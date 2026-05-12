import { useState } from 'react';
import { HiStar } from 'react-icons/hi2';

/**
 * Componente reutilizable de valoración con estrellas.
 *
 * Modo lectura (interactive=false):
 *   <StarRating value={4.3} />              // 4 estrellas + 0.3 fill parcial
 *   <StarRating value={4.3} count={124} />  // muestra "(124)" tras la nota
 *
 * Modo interactivo (interactive=true):
 *   <StarRating value={rating} onChange={setRating} interactive />
 *
 * Accesible:
 * - role="img" con aria-label en modo lectura
 * - role="radiogroup" con radios anidados en modo interactivo
 * - navegable con teclado (←/→ o números 1-5)
 */
export default function StarRating({
  value = 0,
  count = null,
  size = 'md',
  interactive = false,
  onChange,
  showValue = true,
  ariaLabel,
}) {
  const [hoverValue, setHoverValue] = useState(null);
  const displayValue = hoverValue ?? value;

  const sizeClass = SIZES[size] ?? SIZES.md;

  // ── Modo lectura ──
  if (!interactive) {
    return (
      <span
        role="img"
        aria-label={ariaLabel ?? formatAriaLabel(value, count)}
        className="inline-flex items-center gap-1"
      >
        <span className="relative inline-flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <PartialStar key={i} index={i} value={value} sizeClass={sizeClass} />
          ))}
        </span>
        {showValue && value > 0 && (
          <span className="text-sm font-semibold text-text-primary tabular-nums">{value.toFixed(1)}</span>
        )}
        {count !== null && (
          <span className="text-xs text-text-muted">({count})</span>
        )}
      </span>
    );
  }

  // ── Modo interactivo ──
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? 'Selecciona una valoración'}
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHoverValue(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          onChange?.(Math.max(1, (value || 1) - 1));
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          onChange?.(Math.min(5, (value || 0) + 1));
        } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
          e.preventDefault();
          onChange?.(parseInt(e.key, 10));
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHoverValue(star)}
            className="cursor-pointer p-0.5 rounded transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1"
          >
            <HiStar
              className={`${sizeClass} ${filled ? 'text-amber-400' : 'text-surface-300'} transition-colors`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Estrella con fill parcial: para mostrar 4.3 de 5 con la 5ª estrella en gris,
 * la 4ª al 30%. Logrado superponiendo dos copias y recortando la dorada con clip-path.
 */
function PartialStar({ index, value, sizeClass }) {
  const fillPct = Math.max(0, Math.min(1, value - index));
  return (
    <span className="relative inline-block leading-none">
      <HiStar className={`${sizeClass} text-surface-300`} aria-hidden="true" />
      {fillPct > 0 && (
        <span
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${fillPct * 100}%` }}
          aria-hidden="true"
        >
          <HiStar className={`${sizeClass} text-amber-400`} />
        </span>
      )}
    </span>
  );
}

function formatAriaLabel(value, count) {
  if (!value || value === 0) return 'Sin valoraciones aún';
  const base = `Valoración ${value.toFixed(1)} sobre 5`;
  return count ? `${base}, ${count} reseñas` : base;
}

const SIZES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-7 h-7',
};
