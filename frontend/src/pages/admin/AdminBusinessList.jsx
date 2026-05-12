import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  getAdminBusinesses,
  TIPO_NEGOCIO_OPTIONS,
  ESTADO_BUSINESS_META,
} from '../../services/businessService';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineBuildingOffice2,
  HiOutlineEye,
  HiOutlineFaceFrown,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import ErrorState from '../../components/shared/ErrorState';

export default function AdminBusinessList() {
  usePageTitle('Empresas registradas');

  const [items, setItems]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [pendientes, setPend]   = useState(0);
  const [page, setPage]         = useState(1);
  const [limit]                 = useState(20);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const [search, setSearch]     = useState('');
  const [estado, setEstado]     = useState('');
  const [tipo, setTipo]         = useState('');

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = { page, limit };
      if (estado) params.estado = estado;
      if (tipo)   params.tipo = tipo;
      if (search.trim()) params.search = search.trim();
      const res = await getAdminBusinesses(params);
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
      setPend(res.data.meta?.pendientes ?? 0);
    } catch (err) {
      setError(true);
      toast.error(err.response?.data?.message || 'Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  }, [page, limit, estado, tipo, search]);

  useEffect(() => { load(); }, [load]);

  // Reset a página 1 cuando cambia un filtro
  useEffect(() => { setPage(1); }, [estado, tipo, search]);

  if (error) {
    return <ErrorState message="No se pudieron cargar las empresas." onRetry={load} />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Header */}
      <div className="page-header border-b border-border-base pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="page-title text-3xl mb-2">Empresas registradas</h1>
          <p className="page-subtitle text-base">
            Gestiona las solicitudes de negocios y sus estados.
          </p>
        </div>
        {pendientes > 0 && (
          <div className="bg-warning-bg border border-warning-border rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" aria-hidden="true" />
            <span className="text-sm font-bold text-warning-text">
              {pendientes} pendiente{pendientes !== 1 ? 's' : ''} de aprobación
            </span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o CIF…"
              className="input-field pl-11"
            />
          </div>
          <div className="relative sm:w-52">
            <HiOutlineFunnel className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="input-field pl-10 pr-3 cursor-pointer appearance-none"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="ACTIVO">Activos</option>
              <option value="SUSPENDIDO">Suspendidos</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>
          <div className="relative sm:w-52">
            <HiOutlineFunnel className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="input-field pl-10 pr-3 cursor-pointer appearance-none"
            >
              <option value="">Todos los tipos</option>
              {TIPO_NEGOCIO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla / lista */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="hidden md:block table-wrapper">
              <table className="table-pro">
                <thead className="bg-surface-elevated border-b border-border-base">
                  <tr>
                    <th className="py-3 px-5 text-left text-xs font-bold uppercase tracking-wider text-text-muted">Negocio</th>
                    <th className="py-3 px-5 text-left text-xs font-bold uppercase tracking-wider text-text-muted">Tipo</th>
                    <th className="py-3 px-5 text-left text-xs font-bold uppercase tracking-wider text-text-muted">Ciudad</th>
                    <th className="py-3 px-5 text-left text-xs font-bold uppercase tracking-wider text-text-muted">Estado</th>
                    <th className="py-3 px-5 text-left text-xs font-bold uppercase tracking-wider text-text-muted">Registrado</th>
                    <th className="py-3 px-5 text-right text-xs font-bold uppercase tracking-wider text-text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {items.map((b) => <Row key={b.id} business={b} />)}
                </tbody>
              </table>
            </div>

            {/* Vista cards en móvil */}
            <div className="md:hidden divide-y divide-border-base">
              {items.map((b) => <CardRow key={b.id} business={b} />)}
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────── */

function Row({ business }) {
  const tipoLabel = TIPO_NEGOCIO_OPTIONS.find((t) => t.value === business.tipo)?.label || business.tipo;
  const estadoMeta = ESTADO_BUSINESS_META[business.estado] || ESTADO_BUSINESS_META.ACTIVO;

  return (
    <tr className="hover:bg-surface-subtle transition-colors">
      <td className="py-4 px-5">
        <div className="flex items-center gap-3">
          <Logo business={business} />
          <div className="min-w-0">
            <p className="font-bold text-text-primary truncate">{business.nombre}</p>
            <p className="text-xs text-text-muted font-mono">{business.cif_nif}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-5 text-sm text-text-secondary">{tipoLabel}</td>
      <td className="py-4 px-5 text-sm text-text-secondary">{business.ciudad}</td>
      <td className="py-4 px-5">
        <span className={`badge ${estadoMeta.className}`}>{estadoMeta.label}</span>
      </td>
      <td className="py-4 px-5 text-sm text-text-muted whitespace-nowrap">
        {new Date(business.created_at).toLocaleDateString('es-ES')}
      </td>
      <td className="py-4 px-5 text-right">
        <Link to={`/admin/businesses/${business.id}`} className="btn-secondary text-xs py-2 px-3 inline-flex">
          <HiOutlineEye className="w-4 h-4" aria-hidden="true" />
          Ver
        </Link>
      </td>
    </tr>
  );
}

function CardRow({ business }) {
  const tipoLabel = TIPO_NEGOCIO_OPTIONS.find((t) => t.value === business.tipo)?.label || business.tipo;
  const estadoMeta = ESTADO_BUSINESS_META[business.estado] || ESTADO_BUSINESS_META.ACTIVO;

  return (
    <Link to={`/admin/businesses/${business.id}`} className="block p-4 hover:bg-surface-subtle transition-colors">
      <div className="flex items-start gap-3">
        <Logo business={business} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-text-primary truncate">{business.nombre}</p>
              <p className="text-xs text-text-muted">{tipoLabel} · {business.ciudad}</p>
            </div>
            <span className={`badge ${estadoMeta.className} flex-shrink-0`}>{estadoMeta.label}</span>
          </div>
          <p className="text-xs text-text-muted mt-1 font-mono">{business.cif_nif}</p>
        </div>
      </div>
    </Link>
  );
}

function Logo({ business }) {
  if (business.logo_url) {
    return (
      <img
        src={business.logo_url}
        alt=""
        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-border-base"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
      {(business.nombre?.charAt(0) || '?').toUpperCase()}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card border-2 border-dashed border-border-strong p-12 text-center">
      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted">
        <HiOutlineFaceFrown className="w-7 h-7" aria-hidden="true" />
      </div>
      <p className="font-bold text-text-primary mb-1">No hay empresas con esos filtros</p>
      <p className="text-sm text-text-secondary max-w-sm mx-auto">
        Prueba a cambiar los filtros o limpia la búsqueda.
      </p>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  return (
    <nav className="flex items-center justify-center gap-1 pt-2" aria-label="Paginación">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-10 h-10 rounded-lg text-text-secondary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
        aria-label="Página anterior"
      >
        <HiOutlineChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      <span className="px-4 text-sm font-semibold text-text-secondary">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-10 h-10 rounded-lg text-text-secondary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
        aria-label="Página siguiente"
      >
        <HiOutlineChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </nav>
  );
}
