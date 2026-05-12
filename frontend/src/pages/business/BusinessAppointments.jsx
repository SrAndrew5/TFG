import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  getBusinessAppointments,
  updateBusinessAppointmentStatus,
} from '../../services/businessService';
import StatusBadge from '../../components/shared/StatusBadge';
import ErrorState from '../../components/shared/ErrorState';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCheckBadge,
  HiOutlineFaceSmile,
} from 'react-icons/hi2';
import ModalPortal from '../../components/shared/ModalPortal';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week',  label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'all',   label: 'Histórico' },
];

const ESTADO_OPTIONS = [
  { value: '',           label: 'Todos los estados' },
  { value: 'PENDIENTE',  label: 'Pendientes' },
  { value: 'CONFIRMADA', label: 'Confirmadas' },
  { value: 'COMPLETADA', label: 'Completadas' },
  { value: 'CANCELADA',  label: 'Canceladas' },
];

export default function BusinessAppointments() {
  usePageTitle('Agenda Operativa');

  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const [range, setRange]   = useState('all');
  const [estado, setEstado] = useState('');
  const [search, setSearch] = useState('');

  const [actionTarget, setActionTarget] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = { range };
      if (estado) params.estado = estado;
      if (search.trim()) params.search = search.trim();
      const res = await getBusinessAppointments(params);
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(true);
      toast.error(err.response?.data?.message || 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, [range, estado, search]);

  useEffect(() => { load(); }, [load]);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const closeModal = () => {
    setActionTarget(null);
    setMotivo('');
  };

  const confirmAction = async () => {
    if (!actionTarget) return;
    if (actionTarget.requiresMotivo && motivo.trim().length < 5) {
      toast.error('Indica un motivo (mínimo 5 caracteres)');
      return;
    }
    setSubmitting(true);
    try {
      await updateBusinessAppointmentStatus(
        actionTarget.cita.id,
        actionTarget.estado,
        actionTarget.requiresMotivo ? motivo.trim() : undefined,
      );
      toast.success(`Cita ${actionTarget.estado.toLowerCase()}`);
      closeModal();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo completar la acción');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">

      {/* Header & Controls Section */}
      <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between">
        <div className="flex-1 w-full max-w-2xl">
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted group-focus-within:text-brand-500 transition-colors" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por cliente, email o referencia..."
              className="input-field pl-14 py-5 shadow-sm hover:shadow-md transition-shadow"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-border-base flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  range === opt.value
                    ? 'bg-brand-900 text-white shadow-lg'
                    : 'text-text-muted hover:text-brand-500 hover:bg-brand-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select 
            value={estado} 
            onChange={(e) => setEstado(e.target.value)} 
            className="bg-white border border-border-base px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none cursor-pointer"
          >
            {ESTADO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Main List Area */}
      {error ? (
        <ErrorState message="No se pudieron cargar las citas." onRetry={load} />
      ) : loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
             <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
               {total} Registros Encontrados
             </p>
          </div>
          <div className="grid gap-4">
            {items.map((cita) => (
              <AppointmentRow
                key={cita.id}
                cita={cita}
                onAction={(estado, requiresMotivo, label) => setActionTarget({ cita, estado, requiresMotivo, label })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal acción */}
      {actionTarget && (
        <ModalPortal>
          <ActionModal
            target={actionTarget}
            motivo={motivo}
            setMotivo={setMotivo}
            onConfirm={confirmAction}
            onClose={closeModal}
            submitting={submitting}
          />
        </ModalPortal>
      )}
    </div>
  );
}

function AppointmentRow({ cita, onAction }) {
  // Parseo robusto de fecha
  const datePart = (cita.fecha || '').split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  const dateObj = y ? new Date(y, m - 1, d) : new Date();

  return (
    <div className="profile-content-card !p-6 flex flex-col lg:flex-row lg:items-center gap-8 hover:shadow-xl hover:scale-[1.005] transition-all duration-300">
      
      {/* Date Block */}
      <div className="w-20 h-20 rounded-[2rem] bg-brand-50 border border-brand-100 flex flex-col items-center justify-center text-brand-500 flex-shrink-0 shadow-sm group-hover:bg-brand-500 group-hover:text-white transition-colors">
        <p className="text-[10px] font-black uppercase leading-none mb-1">
          {dateObj.toLocaleDateString('es-ES', { month: 'short' })}
        </p>
        <p className="text-2xl font-black leading-none">{dateObj.getDate()}</p>
      </div>

      {/* Customer & Service Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xl font-black text-brand-500 tracking-tight truncate">
            {cita.servicio?.nombre || 'Servicio'}
          </h3>
          <StatusBadge estado={cita.estado} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
            <HiOutlineUser className="w-5 h-5 text-accent-500" />
            {cita.usuario?.nombre} {cita.usuario?.apellidos}
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-text-secondary">
            <HiOutlineClock className="w-5 h-5 text-brand-400" />
            {cita.hora_inicio} – {cita.hora_fin}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <HiOutlineEnvelope className="w-4 h-4" />
            {cita.usuario?.email}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <HiOutlinePhone className="w-4 h-4" />
            {cita.usuario?.telefono}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end items-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 flex-shrink-0">
        {cita.precio_pagado != null && (
          <div className="mr-6 text-right">
            <p className="text-xl font-black text-brand-500">{parseFloat(cita.precio_pagado).toFixed(2)}€</p>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Pagado</p>
          </div>
        )}
        
        <div className="flex gap-2">
          {cita.estado === 'PENDIENTE' && (
            <>
              <button onClick={() => onAction('CONFIRMADA', false, 'Confirmar')} className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
                <HiOutlineCheckCircle className="w-6 h-6" />
              </button>
              <button onClick={() => onAction('CANCELADA', true, 'Cancelar')} className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </>
          )}
          {cita.estado === 'CONFIRMADA' && (
            <>
              <button onClick={() => onAction('COMPLETADA', false, 'Completar')} className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 hover:bg-brand-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
                <HiOutlineCheckBadge className="w-6 h-6" />
              </button>
              <button onClick={() => onAction('CANCELADA', true, 'Cancelar')} className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface-subtle border-2 border-dashed border-border-base rounded-[3rem] py-32 px-6 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 text-text-muted mx-auto shadow-sm">
        <HiOutlineFaceSmile className="w-10 h-10" />
      </div>
      <p className="font-black text-brand-500 mb-2 text-xl tracking-tight">Sin registros encontrados</p>
      <p className="text-sm text-text-secondary max-w-sm mx-auto font-medium">
        No hay citas que coincidan con los filtros actuales. Intenta cambiar el rango o el estado.
      </p>
    </div>
  );
}

function ActionModal({ target, motivo, setMotivo, onConfirm, onClose, submitting }) {
  const isCancel = target.estado === 'CANCELADA';
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 backdrop-blur-md bg-black/20 animate-fade-in">
      <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-border-base animate-scale-in">
        <div className="flex items-center gap-5 mb-8">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isCancel ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
            {isCancel ? <HiOutlineXCircle className="w-8 h-8" /> : <HiOutlineCheckCircle className="w-8 h-8" />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-brand-500 tracking-tight">{target.label} Cita</h2>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-0.5">Ref #{target.cita.id}</p>
          </div>
        </div>

        <div className="bg-surface-subtle rounded-3xl p-6 mb-8 border border-slate-100">
           <p className="text-sm font-black text-brand-500 mb-1">{target.cita.servicio?.nombre}</p>
           <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{target.cita.usuario?.nombre} {target.cita.usuario?.apellidos}</p>
        </div>

        {target.requiresMotivo && (
          <div className="mb-8">
            <label className="block text-xs font-black uppercase tracking-widest text-brand-500 mb-2 px-1">
              Motivo de Cancelación
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
              rows={4}
              className="input-field resize-none !rounded-3xl"
              placeholder="Ej: Profesional no disponible por urgencia médica..."
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} disabled={submitting} className={`w-full py-5 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${isCancel ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20'}`}>
            {submitting ? 'Procesando...' : `Sí, ${target.label.toLowerCase()}`}
          </button>
          <button onClick={onClose} disabled={submitting} className="w-full py-5 rounded-2xl font-black text-text-primary hover:bg-surface-subtle transition-all">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
