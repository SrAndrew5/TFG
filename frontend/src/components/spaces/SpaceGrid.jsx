import { useNavigate } from 'react-router-dom';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineFaceFrown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import useResources from '../../hooks/useResources';
import SpaceCard from './SpaceCard';
import SpaceCardSkeleton from './SpaceCardSkeleton';
import ErrorState from '../shared/ErrorState';

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Relevancia' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'rating',     label: 'Mejor valorados' },
  { value: 'name',       label: 'Nombre (A–Z)' },
];

const TIPO_OPTIONS = [
  { value: null,         label: 'Todos' },
  { value: 'MESA',       label: 'Mesa flex' },
  { value: 'PUESTO',     label: 'Puesto fijo' },
  { value: 'SALA',       label: 'Sala reuniones' },
  { value: 'DESPACHO',   label: 'Despacho privado' },
];

const CAPACITY_OPTIONS = [
  { value: null,    label: 'Cualquier aforo' },
  { value: '1-2',   label: '1–2 personas' },
  { value: '3-5',   label: '3–5 personas' },
  { value: '6-10',  label: '6–10 personas' },
  { value: '10+',   label: '+10 personas' },
];

export default function SpaceGrid() {
  const navigate = useNavigate();
  const {
    resources, totalFiltered, totalAll,
    loading, error,
    search, setSearch,
    tipo, setTipo,
    capacityRange, setCapacityRange,
    sort, setSort,
    page, setPage, pageSize, totalPages,
    retry,
  } = useResources({ pageSize: 12 });

  const handleBook = (space) => navigate(`/book-resource/${space.id}`);

  if (error) {
    return (
      <ErrorState
        message="No se pudieron cargar los espacios. Comprueba tu conexión e inténtalo de nuevo."
        onRetry={retry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Filtros ── */}
      <div className="bg-white border border-border-base rounded-2xl shadow-[0_2px_12px_rgba(99,102,241,0.06)] p-4 sm:p-5 flex flex-col gap-4">

        {/* Búsqueda + ordenación */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o ubicación…"
              aria-label="Buscar espacios"
              className="input-field pl-11"
            />
          </div>
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

        {/* Chips de tipo */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1" role="tablist" aria-label="Filtrar por tipo de espacio">
          {TIPO_OPTIONS.map((opt) => (
            <FilterChip key={opt.label} active={tipo === opt.value} onClick={() => setTipo(opt.value)}>
              {opt.label}
            </FilterChip>
          ))}
        </div>

        {/* Chips de capacidad */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1" role="tablist" aria-label="Filtrar por capacidad">
          {CAPACITY_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.label}
              active={capacityRange === opt.value}
              onClick={() => setCapacityRange(opt.value)}
              variant="muted"
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ── Contador ── */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-text-muted" aria-live="polite">
          {loading
            ? 'Cargando espacios…'
            : `Mostrando ${resources.length} de ${totalFiltered} ${totalFiltered === 1 ? 'espacio' : 'espacios'}${
                totalFiltered !== totalAll ? ` (${totalAll} en total)` : ''
              }`}
        </p>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: pageSize }).map((_, i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          onClear={() => { setSearch(''); setTipo(null); setCapacityRange(null); }}
          hasFilters={Boolean(search || tipo || capacityRange)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((s, i) => (
            <SpaceCard key={s.id} space={s} onBook={handleBook} animationDelay={i * 50} />
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

/* ── Componentes auxiliares ── */

function FilterChip({ active, onClick, children, variant = 'default' }) {
  const activeStyle = variant === 'muted'
    ? 'bg-brand-100 text-brand-700 border-2 border-brand-300 shadow-sm'
    : 'bg-brand-500 text-white border-2 border-brand-500 shadow-brand';
  const inactiveStyle = 'bg-white text-text-secondary border-2 border-border-base hover:border-brand-500/30 hover:text-brand-500 hover:bg-surface-subtle';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer whitespace-nowrap border-2 ${active ? activeStyle : inactiveStyle}`}
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
        {hasFilters ? 'No encontramos espacios' : 'No hay espacios disponibles'}
      </h3>
      <p className="text-text-secondary max-w-sm text-sm mb-5">
        {hasFilters
          ? 'Prueba a cambiar los filtros o buscar con otros términos.'
          : 'En este momento no hay espacios activos. Vuelve a intentarlo más tarde.'}
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

function paginationWindow(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const set = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (sorted[i + 1] && sorted[i + 1] - sorted[i] > 1) out.push('…');
  }
  return out;
}
