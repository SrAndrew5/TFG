import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

/**
 * Hook que encapsula la carga, filtrado, ordenación y paginación de servicios.
 *
 * Filtrado/orden/paginación es CLIENT-SIDE: para el volumen del TFG (≤ ~100 servicios)
 * es óptimo y sin latencia. Si el dataset crece, debe migrarse al backend con
 * query params ?page&limit&search&category&sort y este hook se simplificaría a un
 * passthrough de los parámetros del usuario.
 *
 * Devuelve también `categories` (cargadas en paralelo del endpoint dedicado)
 * para el componente de filtros.
 */
export default function useServices({ pageSize = 12 } = {}) {
  const [services, setServices]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);

  // Estado de UI: el usuario controla estos
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState(null);  // null = todas
  const [sort, setSort]                 = useState('relevance');
  const [page, setPage]                 = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [resServices, resCategories] = await Promise.all([
        api.get('/services'),
        api.get('/services/categories'),
      ]);
      setServices(resServices.data.data || []);
      setCategories(resCategories.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Reset a página 1 cuando cambia un filtro (de lo contrario quedaríamos en una
  // página inexistente al filtrar 100 → 3 resultados)
  useEffect(() => { setPage(1); }, [search, category, sort]);

  const filtered = useMemo(() => {
    let list = [...services];

    if (category) {
      list = list.filter((s) => s.categoria === category);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) =>
        s.nombre.toLowerCase().includes(q) ||
        (s.descripcion && s.descripcion.toLowerCase().includes(q)),
      );
    }

    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio));
        break;
      case 'price_desc':
        list.sort((a, b) => parseFloat(b.precio) - parseFloat(a.precio));
        break;
      case 'duration_asc':
        list.sort((a, b) => a.duracion_min - b.duracion_min);
        break;
      case 'rating':
        // Servicios sin valoración van al final (Number.NEGATIVE_INFINITY)
        list.sort((a, b) => (b.avg_rating ?? -Infinity) - (a.avg_rating ?? -Infinity));
        break;
      case 'name':
        list.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      default:
        // 'relevance' = mantener orden alfabético del backend
        break;
    }

    return list;
  }, [services, search, category, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return {
    // Datos
    services: paginated,
    totalFiltered: filtered.length,
    totalAll: services.length,
    categories,
    // Estado
    loading,
    error,
    // Filtros (controlados)
    search, setSearch,
    category, setCategory,
    sort, setSort,
    // Paginación
    page: safePage,
    setPage,
    pageSize,
    totalPages,
    // Acciones
    retry: load,
  };
}

// Las funciones derivedRating/derivedReviewCount ya no son necesarias:
// el backend agrega avg_rating y review_count desde la tabla Review.
