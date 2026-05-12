import { useNavigate } from 'react-router-dom';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineFaceFrown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import useServices from '../../hooks/useServices';
import ServiceCard from './ServiceCard';
import ServiceCardSkeleton from './ServiceCardSkeleton';
import ErrorState from '../shared/ErrorState';

const SORT_OPTIONS = [
  { value: 'relevance',     label: 'Relevancia' },
  { value: 'price_asc',     label: 'Precio: menor a mayor' },
  { value: 'price_desc',    label: 'Precio: mayor a menor' },
  { value: 'duration_asc',  label: 'Duración: más corto' },
  { value: 'rating',        label: 'Mejor valorados' },
  { value: 'name',          label: 'Nombre (A–Z)' },
];

export default function ServiceGrid() {
  const navigate = useNavigate();
  const {
    services, totalFiltered, totalAll, categories,
    loading, error,
    search, setSearch,
    category, setCategory,
    sort, setSort,
    page, setPage, pageSize, totalPages,
    retry,
  } = useServices({ pageSize: 12 });

  const handleBook = (service) => navigate(`/book/${service.id}`);

  if (error) {
    return (
      <ErrorState
        message="No se pudieron cargar los servicios. Comprueba tu conexión e inténtalo de nuevo."
        onRetry={retry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Barra de filtros ── */}
      <div className="bg-white border border-border-base rounded-2xl shadow-[0_2px_12px_rgba(99,102,241,0.06)] p-4 sm:p-5 flex flex-col gap-4">

        {/* Fila 1: búsqueda + ordenación */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción…"
              aria-label="Buscar servicios"
              className="input-field pl-11"
            />
          </div>

          {/* Ordenar */}
          <div className="relative sm:w-64">
            <HiOutlineFunnel className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Ordenar resultados"
              className="input-field pl-10 pr-3 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: chips de categorías */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1" role="tablist" aria-label="Filtrar por categoría">
            <CategoryChip active={category === null} onClick={() => setCategory(null)}>
              Todas
            </CategoryChip>
            {categories.map((cat) => (
              <CategoryChip
                key={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </CategoryChip>
            ))}
          </div>
        )}
      </div>

      {/* ── Contador de resultados ── */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-text-muted" aria-live="polite">
          {loading
            ? 'Cargando servicios…'
            : `Mostrando ${services.length} de ${totalFiltered} ${totalFiltered === 1 ? 'servicio' : 'servicios'}${
                totalFiltered !== totalAll ? ` (${totalAll} en total)` : ''
              }`}
        </p>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: pageSize }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState onClear={() => { setSearch(''); setCategory(null); }} hasFilters={Boolean(search || category)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <ServiceCard
              key={s.id}
              service={s}
              onBook={handleBook}
              animationDelay={i * 50}
            />
          ))}
        </div>
      )}

      {/* ── Paginación ── */}
      {!loading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── */

function CategoryChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
        active
          ? 'bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)]'
          : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ onClear, hasFilters }) {
  return (
    <div className="bg-white border-2 border-dashed border-border-strong rounded-2xl py-16 px-6 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4 text-text-muted">
        <HiOutlineFaceFrown className="w-8 h-8" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-1">
        {hasFilters ? 'No encontramos resultados' : 'No hay servicios disponibles'}
      </h3>
      <p className="text-text-secondary max-w-sm text-sm mb-5">
        {hasFilters
          ? 'Prueba a cambiar los filtros o buscar con otros términos.'
          : 'En este momento no hay servicios activos. Vuelve a intentarlo más tarde.'}
      </p>
      {hasFilters && (
        <button type="button" onClick={onClear} className="btn-secondary text-sm">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  // Ventana de hasta 5 números alrededor de la página actual
  const pages = paginationWindow(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1 pt-4" aria-label="Paginación">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-text-secondary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Página anterior"
      >
        <HiOutlineChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-text-muted select-none">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold transition-all ${
              p === page
                ? 'bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-[0_4px_12px_rgba(99,102,241,0.30)]'
                : 'text-text-secondary hover:bg-surface-elevated'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-text-secondary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Página siguiente"
      >
        <HiOutlineChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </nav>
  );
}

/**
 * Calcula la ventana de números a mostrar: siempre 1, totalPages, y 1 vecino a cada
 * lado de la página actual. Inserta '…' donde haya saltos.
 *   page=5, total=20  →  [1, '…', 4, 5, 6, '…', 20]
 */
function paginationWindow(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (sorted[i + 1] && sorted[i + 1] - sorted[i] > 1) out.push('…');
  }
  return out;
}
