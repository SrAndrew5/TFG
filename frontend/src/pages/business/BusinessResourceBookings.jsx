import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  getBusinessResourceBookings,
  updateBusinessResourceBookingStatus,
} from '../../services/businessService';
import StatusBadge from '../../components/shared/StatusBadge';
import ErrorState from '../../components/shared/ErrorState';
import ModalPortal from '../../components/shared/ModalPortal';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineFaceSmile,
  HiOutlineBuildingOffice2,
  HiOutlineCurrencyEuro,
} from 'react-icons/hi2';

const ESTADO_OPTIONS = [
  { value: '',           label: 'Todos' },
  { value: 'PENDIENTE',  label: 'Pendiente' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'CANCELADA',  label: 'Cancelada' },
];

const TIPO_LABELS = {
  MESA: 'Mesa',
  SALA: 'Sala de reuniones',
  PUESTO: 'Puesto individual',
  DESPACHO: 'Despacho privado',
};

export default function BusinessResourceBookings() {
  usePageTitle('Reservas de Espacios');

  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const [estado, setEstado]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]         = useState('');

  const [actionTarget, setActionTarget] = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = {};
      if (estado) params.estado = estado;
      if (search.trim()) params.search = search.trim();
      const res = await getBusinessResourceBookings(params);
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(true);
      toast.error(err.response?.data?.message || 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  }, [estado, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const confirmAction = async () => {
    if (!actionTarget) return;
    setSubmitting(true);
    try {
      await updateBusinessResourceBookingStatus(actionTarget.booking.id, actionTarget.estado);
      toast.success(`Reserva ${actionTarget.estado.toLowerCase()}`);
      setActionTarget(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo completar la acción');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">

      {/* Header */}
      <div className="profile-hero !mb-6 !p-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
            Reservas de Espacios
          </div>
          <h1 className="profile-hero-name">Gestión de Reservas</h1>
          <p className="profile-hero-email">Confirma o cancela las reservas de tus espacios coworking.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
        <div className="flex-1 w-full max-w-2xl">
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted group-focus-within:text-brand-500 transition-colors" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por cliente o email..."
              className="input-field pl-14 py-5 shadow-sm hover:shadow-md transition-shadow"
            />
          </div>
        </div>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="bg-white border border-border-base px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none cursor-pointer"
        >
          {ESTADO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {error ? (
        <ErrorState message="No se pudieron cargar las reservas." onRetry={load} />
      ) : loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface-subtle border-2 border-dashed border-border-base rounded-[3rem] py-32 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 text-text-muted mx-auto shadow-sm">
            <HiOutlineFaceSmile className="w-10 h-10" />
          </div>
          <p className="font-black text-brand-500 mb-2 text-xl tracking-tight">Sin reservas</p>
          <p className="text-sm text-text-secondary max-w-sm mx-auto font-medium">
            No hay reservas que coincidan con los filtros actuales.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4">
            {total} reservas encontradas
          </p>
          <div className="grid gap-4">
            {items.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                tipoLabels={TIPO_LABELS}
                onAction={(estado) => setActionTarget({ booking, estado })}
              />
            ))}
          </div>
        </div>
      )}

      {actionTarget && (
        <ModalPortal>
          <ActionModal
            target={actionTarget}
            onConfirm={confirmAction}
            onClose={() => setActionTarget(null)}
            submitting={submitting}
          />
        </ModalPortal>
      )}
    </div>
  );
}

function BookingRow({ booking, tipoLabels, onAction }) {
  const datePart = (booking.fecha || '').split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  const dateObj = y ? new Date(y, m - 1, d) : new Date();

  return (
    <div className="profile-content-card !p-6 flex flex-col lg:flex-row lg:items-center gap-8 hover:shadow-xl hover:scale-[1.005] transition-all duration-300">

      {/* Date Block */}
      <div className="w-20 h-20 rounded-[2rem] bg-brand-50 border border-brand-100 flex flex-col items-center justify-center text-brand-500 flex-shrink-0 shadow-sm">
        <p className="text-[10px] font-black uppercase leading-none mb-1">
          {dateObj.toLocaleDateString('es-ES', { month: 'short' })}
        </p>
        <p className="text-2xl font-black leading-none">{dateObj.getDate()}</p>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <HiOutlineBuildingOffice2 className="w-5 h-5 text-accent-500" />
            <span className="text-xl font-black text-brand-500 tracking-tight truncate">
              {booking.recurso?.nombre}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-[9px] font-black uppercase tracking-widest">
            {tipoLabels[booking.recurso?.tipo] || booking.recurso?.tipo}
          </span>
          <StatusBadge estado={booking.estado} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
            <HiOutlineUser className="w-5 h-5 text-accent-500" />
            {booking.usuario?.nombre} {booking.usuario?.apellidos}
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
            <HiOutlineClock className="w-5 h-5 text-brand-400" />
            {booking.hora_inicio} – {booking.hora_fin}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <HiOutlineEnvelope className="w-4 h-4" />
            {booking.usuario?.email}
          </div>
          {booking.precio_pagado != null && (
            <div className="flex items-center gap-2 text-xs font-bold text-brand-500">
              <HiOutlineCurrencyEuro className="w-4 h-4" />
              {parseFloat(booking.precio_pagado).toFixed(2)} €
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end items-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 flex-shrink-0">
        {booking.estado === 'PENDIENTE' && (
          <>
            <button
              onClick={() => onAction('CONFIRMADA')}
              className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
              title="Confirmar reserva"
            >
              <HiOutlineCheckCircle className="w-6 h-6" />
            </button>
            <button
              onClick={() => onAction('CANCELADA')}
              className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
              title="Cancelar reserva"
            >
              <HiOutlineXCircle className="w-6 h-6" />
            </button>
          </>
        )}
        {booking.estado === 'CONFIRMADA' && (
          <button
            onClick={() => onAction('CANCELADA')}
            className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
            title="Cancelar reserva"
          >
            <HiOutlineXCircle className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

function ActionModal({ target, onConfirm, onClose, submitting }) {
  const isCancel = target.estado === 'CANCELADA';
  const label = isCancel ? 'Cancelar' : 'Confirmar';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 backdrop-blur-md bg-black/20 animate-fade-in">
      <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-border-base animate-scale-in">
        <div className="flex items-center gap-5 mb-8">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isCancel ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
            {isCancel ? <HiOutlineXCircle className="w-8 h-8" /> : <HiOutlineCheckCircle className="w-8 h-8" />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-brand-500 tracking-tight">{label} Reserva</h2>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-0.5">Ref #{target.booking.id}</p>
          </div>
        </div>

        <div className="bg-surface-subtle rounded-3xl p-6 mb-8 border border-slate-100">
          <p className="text-sm font-black text-brand-500 mb-1">{target.booking.recurso?.nombre}</p>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
            {target.booking.usuario?.nombre} {target.booking.usuario?.apellidos}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {target.booking.hora_inicio} – {target.booking.hora_fin}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={submitting}
            className={`w-full py-5 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${isCancel ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-500 hover:bg-brand-600'}`}
          >
            {submitting ? 'Procesando...' : `Sí, ${label.toLowerCase()}`}
          </button>
          <button onClick={onClose} disabled={submitting} className="w-full py-5 rounded-2xl font-black text-text-primary hover:bg-surface-subtle transition-all">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
