import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import {
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineBuildingOffice2,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
} from 'react-icons/hi2';

const TABS = ['Todas', 'Pendientes', 'Confirmadas', 'Canceladas'];

const STATUS_MAP = {
  Pendientes: 'PENDIENTE',
  Confirmadas: 'CONFIRMADA',
  Canceladas: 'CANCELADA',
};

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Todas');
  const [processingId, setProcessingId] = useState(null);

  // Modal detalles
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingApt, setViewingApt] = useState(null);

  // Modal cancelar
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelingApt, setCancelingApt] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null);

  // ── Carga desde la DB ──
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (err) {
      toast.error('Error al cargar las reservas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtrado por tab ──
  const filtered = appointments.filter((apt) => {
    if (activeTab === 'Todas') return true;
    return apt.estado === STATUS_MAP[activeTab];
  });

  // ── Confirmar cita (PENDIENTE → CONFIRMADA) ──
  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await api.put(`/appointments/${id}/status`, { estado: 'CONFIRMADA' });
      toast.success('Reserva confirmada');
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, estado: 'CONFIRMADA' } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al confirmar');
    } finally {
      setProcessingId(null);
    }
  };

  // ── Completar cita (CONFIRMADA → COMPLETADA) ──
  const handleComplete = async (id) => {
    setProcessingId(id);
    try {
      await api.put(`/appointments/${id}/status`, { estado: 'COMPLETADA' });
      toast.success('Servicio marcado como completado');
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, estado: 'COMPLETADA' } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al completar');
    } finally {
      setProcessingId(null);
    }
  };

  // ── Cancelar cita ──
  const requestCancel = (apt) => {
    setItemToCancel(apt);
    setCancelModalOpen(true);
  };

  const executeCancel = async () => {
    setCancelingApt(true);
    try {
      await api.put(`/appointments/${itemToCancel.id}/status`, { estado: 'CANCELADA' });
      toast.success('Reserva cancelada correctamente');
      setAppointments((prev) =>
        prev.map((a) => (a.id === itemToCancel.id ? { ...a, estado: 'CANCELADA' } : a))
      );
      setCancelModalOpen(false);
      setItemToCancel(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cancelar');
    } finally {
      setCancelingApt(false);
    }
  };

  const getStatusBadge = (estado) => {
    const styles = {
      PENDIENTE: 'text-warning-text bg-warning-bg border-warning-border',
      CONFIRMADA: 'text-success-text bg-success-bg border-success-border',
      COMPLETADA: 'text-brand-700 bg-brand-50 border-brand-200',
      CANCELADA: 'text-danger-text bg-danger-bg border-danger-border',
    };
    const dots = {
      PENDIENTE: 'bg-warning animate-pulse',
      CONFIRMADA: 'bg-success',
      COMPLETADA: 'bg-brand-500',
      CANCELADA: 'bg-danger',
    };
    const labels = {
      PENDIENTE: 'Pendiente',
      CONFIRMADA: 'Confirmada',
      COMPLETADA: 'Completada',
      CANCELADA: 'Cancelada',
    };
    return (
      <span className={`flex items-center gap-1.5 text-xs font-bold border px-2.5 py-1 rounded-full w-fit ${styles[estado]}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${dots[estado]}`} />
        {labels[estado]}
      </span>
    );
  };

  const tabCount = (tab) => {
    if (tab === 'Todas') return appointments.length;
    return appointments.filter((a) => a.estado === STATUS_MAP[tab]).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      <div>
        <h1 className="text-3xl font-extrabold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
          Gestión de Reservas
        </h1>
        <p className="text-text-secondary">Controla el flujo de citas en tiempo real.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">

        {/* Tabs */}
        <div className="border-b border-border-base px-4 flex gap-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 whitespace-nowrap text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab}
              <span className="ml-2 text-[11px] font-bold bg-surface-elevated px-1.5 py-0.5 rounded-md text-text-muted">
                {tabCount(tab)}
              </span>
            </button>
          ))}
        </div>

        <div className="table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/50 text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">ID</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Cliente</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Servicio</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Empleado</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Fecha / Hora</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Estado</th>
                <th className="font-bold py-4 px-2 text-right whitespace-nowrap min-w-[150px] text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filtered.map((apt) => (
                <tr key={apt.id} className="hover:bg-surface-elevated/50 transition-colors group">
                  <td className="py-3 px-2 text-xs font-extrabold text-text-primary">#{apt.id}</td>

                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2 max-w-[130px]">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-[10px] border border-brand-100">
                        {apt.usuario?.nombre?.charAt(0)}
                      </div>
                      <p className="font-semibold text-text-secondary text-xs truncate">
                        {apt.usuario?.nombre} {apt.usuario?.apellidos}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-2 max-w-[140px]">
                    <p className="font-semibold text-text-primary text-xs truncate">{apt.servicio?.nombre}</p>
                  </td>

                  <td className="py-3 px-2 max-w-[110px]">
                    <p className="text-xs font-medium text-text-muted truncate">
                      {apt.empleado?.nombre} {apt.empleado?.apellidos}
                    </p>
                  </td>

                  <td className="py-3 px-2 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center text-xs text-text-secondary font-semibold">
                        <HiOutlineCalendar className="w-3 h-3 mr-1 text-text-muted shrink-0" />
                        {new Date(apt.fecha).toLocaleDateString('es-ES')}
                      </span>
                      <span className="flex items-center text-[11px] text-text-muted font-medium">
                        <HiOutlineClock className="w-3 h-3 mr-1 shrink-0" />
                        {apt.hora_inicio}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-2 whitespace-nowrap">
                    {getStatusBadge(apt.estado)}
                  </td>

                  <td className="py-3 px-2 text-right whitespace-nowrap min-w-[150px]">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">

                      {apt.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => handleApprove(apt.id)}
                          disabled={processingId === apt.id}
                          className="w-8 h-8 rounded-lg bg-success-bg text-success-text hover:bg-[#A7F3D0] flex items-center justify-center transition-all"
                          title="Confirmar"
                        >
                          {processingId === apt.id ? (
                            <div className="w-4 h-4 border-2 border-success border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <HiOutlineCheck className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {apt.estado === 'CONFIRMADA' && (
                        <button
                          onClick={() => handleComplete(apt.id)}
                          disabled={processingId === apt.id}
                          className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 flex items-center justify-center transition-all"
                          title="Completar"
                        >
                          {processingId === apt.id ? (
                            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <HiOutlineCheck className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => { setViewingApt(apt); setDetailsModalOpen(true); }}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-surface-elevated text-text-secondary flex items-center justify-center transition-all shadow-xs"
                        title="Ver detalles"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>

                      {(apt.estado === 'PENDIENTE' || apt.estado === 'CONFIRMADA') && (
                        <button
                          onClick={() => requestCancel(apt)}
                          className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-danger-bg hover:text-danger-text hover:border-danger-border text-text-secondary flex items-center justify-center transition-all shadow-xs"
                          title="Cancelar"
                        >
                          <HiOutlineXMark className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center">
              <HiOutlineCalendar className="w-12 h-12 text-text-muted mb-3" />
              <p className="text-text-primary font-bold mb-1">Sin resultados</p>
              <p className="text-text-muted text-sm">No hay reservas para este filtro.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal detalles ── */}
      {detailsModalOpen && viewingApt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setDetailsModalOpen(false)} />
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-md w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            <div className="px-8 py-6 border-b border-border-base bg-surface-subtle/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Detalles de la Cita
                </h2>
                <p className="text-xs text-text-secondary mt-1">#{viewingApt.id}</p>
              </div>
              <button onClick={() => setDetailsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              {[
                ['Cliente', `${viewingApt.usuario?.nombre} ${viewingApt.usuario?.apellidos}`],
                ['Servicio', viewingApt.servicio?.nombre],
                ['Especialista', `${viewingApt.empleado?.nombre} ${viewingApt.empleado?.apellidos}`],
                ['Fecha', new Date(viewingApt.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })],
                ['Hora', `${viewingApt.hora_inicio} – ${viewingApt.hora_fin}`],
                ['Precio', `${parseFloat(viewingApt.servicio?.precio || 0).toFixed(2)}€`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center border-b border-border-base pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
                  <span className="text-sm font-semibold text-text-primary">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Estado</span>
                {getStatusBadge(viewingApt.estado)}
              </div>
            </div>
            <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end">
              <button onClick={() => setDetailsModalOpen(false)} className="btn-secondary bg-white border-border-strong px-6 py-3">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal cancelar ── */}
      {cancelModalOpen && itemToCancel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !cancelingApt && setCancelModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in p-8 text-center border border-border-base/50">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Cancelar Reserva
            </h3>
            <p className="text-sm text-text-secondary mb-8">
              ¿Seguro que deseas cancelar la cita de{' '}
              <strong>{itemToCancel.usuario?.nombre} {itemToCancel.usuario?.apellidos}</strong>?
              Esta acción enviará un email de notificación.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelingApt}
                className="w-full btn-secondary bg-surface-elevated border-transparent py-3 text-sm font-bold"
              >
                Volver
              </button>
              <button
                onClick={executeCancel}
                disabled={cancelingApt}
                className="w-full btn-danger flex items-center justify-center py-3 text-sm font-bold"
              >
                {cancelingApt ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Sí, Cancelar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
