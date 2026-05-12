import { useState } from 'react';
import {
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';
import StarRating from '../shared/StarRating';

/**
 * Tarjeta de espacio coworking. Espera el shape devuelto por GET /api/resources:
 *   { id, nombre, tipo, descripcion, capacidad, ubicacion, precio_hora, imagen_url,
 *     reservas_activas, avg_rating, review_count }
 *
 * `tipo` es enum TipoRecurso: MESA | SALA | PUESTO | DESPACHO
 */
export default function SpaceCard({ space, onBook, animationDelay = 0 }) {
  const [imgError, setImgError] = useState(false);

  const showImage = space.imagen_url && !imgError;
  const hasRating = space.avg_rating !== null && space.avg_rating !== undefined && space.review_count > 0;
  const tipoMeta  = TIPO_META[space.tipo] ?? TIPO_META.MESA;

  return (
    <article
      className="group bg-white border border-border-base rounded-[2.5rem] shadow-subtle overflow-hidden flex flex-col transition-all duration-500 hover:border-brand-500/30 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-2 animate-fade-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* ── Visual Hero ── */}
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-subtle">
        {showImage ? (
          <img
            src={space.imagen_url}
            alt={space.nombre}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <ImageFallback type={space.tipo} name={space.nombre} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-brand-500 shadow-sm border border-white/20">
            {tipoMeta.label}
          </span>
        </div>

        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/40 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white shadow-sm border border-white/10">
            <HiOutlineUsers className="w-3.5 h-3.5 text-accent-400" />
            {space.capacidad} {space.capacidad === 1 ? 'Persona' : 'Personas'}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-7 flex flex-col gap-4 flex-1">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-black text-brand-500 tracking-tighter leading-[1.1] line-clamp-2 group-hover:text-accent-500 transition-colors">
              {space.nombre}
            </h3>
            <div className="shrink-0 pt-1">
              {hasRating ? (
                <div className="flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-lg">
                   <span className="text-xs font-black text-brand-500">{space.avg_rating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-50">New</span>
              )}
            </div>
          </div>
          
          {space.ubicacion && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-widest">
              <HiOutlineMapPin className="w-4 h-4 text-accent-500" />
              {space.ubicacion}
            </div>
          )}
        </div>

        <p className="text-sm text-text-secondary font-medium line-clamp-2 leading-relaxed">
          {space.descripcion || 'Espacio optimizado para productividad con todas las comodidades esenciales.'}
        </p>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between border-t border-border-base/50 pt-6 mt-auto">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted leading-none mb-1">Desde</p>
            <p className="text-2xl font-black text-brand-500 tracking-tighter leading-none">
              {parseFloat(space.precio_hora).toFixed(0)}€
              <span className="text-sm font-bold text-text-muted ml-1 tracking-normal">/ h</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onBook?.(space)}
            className="btn-primary px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em]"
          >
            Reservar
          </button>
        </div>
      </div>
    </article>
  );
}

function ImageFallback({ type, name }) {
  const meta = TIPO_META[type] || TIPO_META.MESA;
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-brand-500`} aria-hidden="true">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
          <meta.Icon className="w-8 h-8 text-accent-400" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-100/50">{name}</span>
      </div>
    </div>
  );
}

const TIPO_META = {
  MESA:     { label: 'Mesa Flex',      Icon: HiOutlineBuildingOffice2, style: 'bg-brand-50 text-brand-500' },
  SALA:     { label: 'Sala Reunión',   Icon: HiOutlineBuildingOffice2, style: 'bg-brand-50 text-brand-500' },
  PUESTO:   { label: 'Puesto Fijo',    Icon: HiOutlineBuildingOffice2, style: 'bg-brand-50 text-brand-500' },
  DESPACHO: { label: 'Despacho',       Icon: HiOutlineBuildingOffice2, style: 'bg-brand-50 text-brand-500' },
};
