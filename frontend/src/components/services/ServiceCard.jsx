import { useState } from 'react';
import {
  HiOutlineClock,
  HiOutlineUsers,
} from 'react-icons/hi2';
import StarRating from '../shared/StarRating';

/**
 * Tarjeta de servicio. Espera el shape devuelto por GET /api/services:
 *   { id, nombre, descripcion, duracion_min, precio, categoria, imagen_url,
 *     empleados: [...], avg_rating, review_count }
 *
 * avg_rating y review_count vienen reales del backend (agregados de la tabla Review).
 * Si el servicio aún no tiene reseñas, mostramos "Sin valoraciones".
 */
export default function ServiceCard({ service, onBook, animationDelay = 0 }) {
  const [imgError, setImgError] = useState(false);

  const availability = computeAvailability(service.empleados?.length ?? 0);
  const showImage    = service.imagen_url && !imgError;
  const hasRating    = service.avg_rating !== null && service.avg_rating !== undefined && service.review_count > 0;

  return (
    <article
      className="group bg-white border border-border-base rounded-2xl shadow-[0_2px_12px_rgba(99,102,241,0.06)] overflow-hidden flex flex-col transition-all duration-300 hover:border-[rgba(99,102,241,0.35)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.16)] hover:-translate-y-1 animate-slide-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* ── Imagen ── */}
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
        {showImage ? (
          <img
            src={service.imagen_url}
            alt={service.nombre}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ImageFallback name={service.nombre} />
        )}

        {/* Categoría sobre la imagen, esquina superior izquierda */}
        {service.categoria && (
          <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 backdrop-blur-sm text-brand-700 shadow-sm">
            {service.categoria}
          </span>
        )}

        {/* Badge de disponibilidad, esquina superior derecha */}
        <span
          className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm ${availability.style}`}
          aria-label={`Disponibilidad: ${availability.label}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${availability.dot}`} aria-hidden="true" />
          {availability.label}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Título + rating */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-text-primary leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
            {service.nombre}
          </h3>
          <div className="flex-shrink-0">
            {hasRating ? (
              <StarRating value={service.avg_rating} count={service.review_count} size="md" />
            ) : (
              <span className="text-xs text-text-muted italic">Sin valoraciones</span>
            )}
          </div>
        </div>

        {/* Descripción */}
        {service.descripcion ? (
          <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
            {service.descripcion}
          </p>
        ) : (
          <p className="text-sm text-text-muted italic">Sin descripción disponible.</p>
        )}

        {/* Meta inferior: duración + nº profesionales */}
        <div className="flex items-center gap-4 mt-auto pt-2 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <HiOutlineClock className="w-4 h-4" aria-hidden="true" />
            {service.duracion_min} min
          </span>
          {service.empleados?.length > 0 && (
            <span className="flex items-center gap-1.5">
              <HiOutlineUsers className="w-4 h-4" aria-hidden="true" />
              {service.empleados.length} profesional{service.empleados.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {/* Precio + CTA */}
        <div className="flex items-center justify-between border-t border-border-base pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-text-muted leading-none">desde</span>
            <span className="text-2xl font-bold text-text-primary leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              {parseFloat(service.precio).toFixed(2)}€
            </span>
          </div>
          <button
            type="button"
            onClick={() => onBook?.(service)}
            disabled={availability.disabled}
            className="btn-primary text-sm py-2.5 px-5"
          >
            {availability.disabled ? 'No disponible' : 'Reservar ahora'}
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Placeholder cuando imagen_url es null o falla la carga.
 * Gradiente brand + inicial grande del nombre para identificar visualmente.
 */
function ImageFallback({ name }) {
  const initial = (name?.trim().charAt(0) || '?').toUpperCase();
  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700"
      aria-hidden="true"
    >
      <span
        className="text-white/90 font-bold select-none"
        style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(3rem, 8vw, 5rem)' }}
      >
        {initial}
      </span>
    </div>
  );
}

/**
 * Heurística de disponibilidad basada en el nº de profesionales asignados al servicio.
 * Sin tabla de "plazas" en el schema, este es el indicador más fiable.
 */
function computeAvailability(numEmployees) {
  if (numEmployees === 0) {
    return {
      label: 'Sin disponibilidad',
      style: 'bg-danger-bg text-danger-text border border-danger-border',
      dot: 'bg-danger',
      disabled: true,
    };
  }
  if (numEmployees <= 2) {
    return {
      label: 'Últimas plazas',
      style: 'bg-warning-bg text-warning-text border border-warning-border',
      dot: 'bg-warning',
      disabled: false,
    };
  }
  return {
    label: 'Disponible',
    style: 'bg-success-bg text-success-text border border-success-border',
    dot: 'bg-success',
    disabled: false,
  };
}
