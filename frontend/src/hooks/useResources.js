import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

/**
 * Hook gemelo de useServices, adaptado al modelo Recurso (coworking).
 *
 * Filtros disponibles:
 *   search           — texto sobre nombre + ubicación
 *   tipo             — MESA | SALA | PUESTO | DESPACHO | null
 *   capacityRange    — '1-2' | '3-5' | '6-10' | '10+' | null
 *   sort             — 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'name'
 *   page, pageSize
 *
 * Como en useServices, todo es client-side por simplicidad. Migrar a server-side
 * sería un cambio mecánico si el dataset crece.
 */
export default function useResources({ pageSize = 12 } = {}) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const [search, setSearch]                 = useState('');
  const [tipo, setTipo]                     = useState(null);
  const [capacityRange, setCapacityRange]   = useState(null);
  const [sort, setSort]                     = useState('relevance');
  const [page, setPage]                     = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/resources');
      setResources(res.data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, tipo, capacityRange, sort]);

  const filtered = useMemo(() => {
    let list = [...resources];

    if (tipo) list = list.filter((r) => r.tipo === tipo);

    if (capacityRange) {
      list = list.filter((r) => matchesCapacityRange(r.capacidad, capacityRange));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        r.nombre.toLowerCase().includes(q) ||
        (r.ubicacion && r.ubicacion.toLowerCase().includes(q)),
      );
    }

    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => parseFloat(a.precio_hora) - parseFloat(b.precio_hora));
        break;
      case 'price_desc':
        list.sort((a, b) => parseFloat(b.precio_hora) - parseFloat(a.precio_hora));
        break;
      case 'rating':
        list.sort((a, b) => (b.avg_rating ?? -Infinity) - (a.avg_rating ?? -Infinity));
        break;
      case 'name':
        list.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      default:
        break;
    }

    return list;
  }, [resources, search, tipo, capacityRange, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return {
    resources: paginated,
    totalFiltered: filtered.length,
    totalAll: resources.length,
    loading,
    error,
    search, setSearch,
    tipo, setTipo,
    capacityRange, setCapacityRange,
    sort, setSort,
    page: safePage, setPage,
    pageSize, totalPages,
    retry: load,
  };
}

function matchesCapacityRange(capacidad, range) {
  if (range === '1-2')  return capacidad >= 1 && capacidad <= 2;
  if (range === '3-5')  return capacidad >= 3 && capacidad <= 5;
  if (range === '6-10') return capacidad >= 6 && capacidad <= 10;
  if (range === '10+')  return capacidad > 10;
  return true;
}
