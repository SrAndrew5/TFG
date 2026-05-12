import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useScrollLock } from '../hooks/useScrollLock';
import { usePageTitle } from '../hooks/usePageTitle';
import { parseDate } from '../utils/dateUtils';
import StatusBadge from '../components/shared/StatusBadge';
import ConfirmModal from '../components/shared/ConfirmModal';
import ReviewModal from '../components/shared/ReviewModal';
import StarRating from '../components/shared/StarRating';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineScissors,
  HiOutlineMapPin,
  HiOutlineFaceFrown,
  HiOutlineTicket,
  HiOutlineUser,
  HiOutlineStar,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const IVA_RATE = 0.21;
const TAB_LABELS = { proximas: 'próximas', completadas: 'completadas', canceladas: 'canceladas' };
export default function MyAppointments() {
  usePageTitle('Mis Citas');
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proximas');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => { loadAppointments(); }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  const requestCancel = (id) => { setAppointmentToCancel(id); setCancelModalOpen(true); };

  const confirmCancelAction = async () => {
    setCanceling(true);
    try {
      await api.put(`/appointments/${appointmentToCancel}/status`, { estado: 'CANCELADA' });
      toast.success('Cita cancelada correctamente');
      loadAppointments();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al cancelar la cita');
    } finally {
      setCanceling(false);
      setCancelModalOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const filteredAppointments = appointments.filter(cita => {
    if (activeTab === 'proximas')    return ['PENDIENTE', 'CONFIRMADA'].includes(cita.estado);
    if (activeTab === 'completadas') return cita.estado === 'COMPLETADA';
    if (activeTab === 'canceladas')  return cita.estado === 'CANCELADA';
    return true;
  });

  useScrollLock(!!selectedAppointment || cancelModalOpen);

  const TABS = [
    { id: 'proximas',    label: 'Próximas',         count: appointments.filter(c => ['PENDIENTE', 'CONFIRMADA'].includes(c.estado)).length },
    { id: 'completadas', label: 'Completadas',       count: appointments.filter(c => c.estado === 'COMPLETADA').length },
    { id: 'canceladas',  label: 'Canceladas',        count: appointments.filter(c => c.estado === 'CANCELADA').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 px-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-accent-500 mb-2 block">Peluquería & Estética</span>
          <h1 className="text-5xl font-black text-brand-500 tracking-tighter">Mis Citas</h1>
          <p className="text-text-secondary font-medium mt-2">Gestiona tus sesiones y servicios reservados.</p>
        </div>
        <button
          onClick={() => navigate('/explorar')}
          className="btn-primary py-4 px-8"
        >
          <HiOutlineSparkles className="w-5 h-5" />
          Nueva reserva
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 p-1.5 bg-surface-subtle rounded-full w-fit mb-10">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-brand-500 shadow-sm' 
                : 'text-text-muted hover:text-brand-500'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Lista ── */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-surface-subtle/50 rounded-[40px] border-2 border-dashed border-border-strong py-24 text-center">
          <HiOutlineCalendar className="w-16 h-16 text-brand-100 mx-auto mb-6" />
          <h3 className="text-xl font-black text-brand-500 mb-2">No tienes citas {activeTab}</h3>
          <p className="text-text-secondary font-medium mb-8 max-w-xs mx-auto">
            ¿Por qué no echas un vistazo a nuestros servicios disponibles?
          </p>
          <button onClick={() => navigate('/explorar')} className="btn-secondary px-8 py-3">
            Explorar servicios
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAppointments.map((cita, i) => {
            const dateObj = parseDate(cita.fecha);
            const esPasada = dateObj < new Date();
            const monthStr = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();

            return (
              <div
                key={cita.id}
                className="group bg-white rounded-[32px] p-6 border border-border-base hover:border-brand-500/30 hover:shadow-subtle transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-brand-400 leading-none">{monthStr}</span>
                      <span className="text-xl font-black text-brand-500 leading-none mt-1">{dateObj.getDate()}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-brand-500 tracking-tight line-clamp-1">
                        {cita.servicio?.nombre}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge estado={cita.estado} />
                      </div>
                    </div>
                  </div>
                  <span className="text-xl font-black text-brand-500">
                    {parseFloat(cita.precio_pagado || cita.servicio?.precio || 0).toFixed(2)}€
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm font-bold text-text-secondary">
                    <HiOutlineClock className="w-5 h-5 text-accent-500" />
                    {cita.hora_inicio} – {cita.hora_fin}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-text-secondary">
                    <HiOutlineUser className="w-5 h-5 text-accent-500" />
                    {cita.empleado?.nombre} {cita.empleado?.apellidos}
                  </div>
                </div>

                <div className="flex gap-2 pt-6 border-t border-border-base/50">
                  <button
                    className="flex-1 btn-secondary py-2.5 text-xs font-black uppercase tracking-widest"
                    onClick={() => setSelectedAppointment(cita)}
                  >
                    Detalles
                  </button>

                  {['PENDIENTE', 'CONFIRMADA'].includes(cita.estado) && !esPasada && (
                    <button
                      onClick={() => requestCancel(cita.id)}
                      className="flex-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full py-2.5 text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Cancelar
                    </button>
                  )}

                  {cita.estado === 'COMPLETADA' && !cita.review && (
                    <button
                      onClick={() => setReviewTarget({ type: 'cita', id: cita.id, name: cita.servicio?.nombre })}
                      className="flex-1 bg-accent-50 text-accent-600 hover:bg-accent-500 hover:text-white rounded-full py-2.5 text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Reseñar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalle */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-brand-500/20 backdrop-blur-xl" onClick={() => setSelectedAppointment(null)} />
          <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full relative z-10 animate-scale-in overflow-hidden border border-border-base">
            <div className="p-8 border-b border-border-base flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-brand-500 tracking-tighter">Detalle de la Cita</h2>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Ref: #{selectedAppointment.id.toString().padStart(4, '0')}</p>
              </div>
              <button onClick={() => setSelectedAppointment(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-subtle hover:bg-red-50 hover:text-red-500 transition-colors">
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-subtle rounded-[24px] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-accent-500 mb-2">Fecha y Hora</p>
                  <p className="text-sm font-black text-brand-500">
                    {parseDate(selectedAppointment.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm font-bold text-text-secondary mt-1">{selectedAppointment.hora_inicio} – {selectedAppointment.hora_fin}</p>
                </div>
                <div className="bg-surface-subtle rounded-[24px] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-accent-500 mb-2">Profesional</p>
                  <p className="text-sm font-black text-brand-500">{selectedAppointment.empleado?.nombre} {selectedAppointment.empleado?.apellidos}</p>
                  <p className="text-sm font-bold text-text-secondary mt-1">Especialista</p>
                </div>
              </div>

              <div className="bg-brand-500 text-white rounded-[32px] p-8 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Total abonado</p>
                  <p className="text-3xl font-black">
                    {parseFloat(selectedAppointment.precio_pagado || selectedAppointment.servicio?.precio || 0).toFixed(2)}€
                  </p>
                </div>
                <HiOutlineTicket className="w-12 h-12 opacity-20" />
              </div>
            </div>

            <div className="p-8 bg-surface-subtle">
              <button onClick={() => setSelectedAppointment(null)} className="btn-secondary w-full py-4 text-sm font-black uppercase tracking-widest bg-white">
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={cancelModalOpen && !!appointmentToCancel}
        title="Cancelar Cita"
        message="¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer."
        confirmLabel="Sí, Cancelar"
        loading={canceling}
        onConfirm={confirmCancelAction}
        onClose={() => setCancelModalOpen(false)}
      />

      <ReviewModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        target={reviewTarget}
        onSuccess={loadAppointments}
      />
    </div>
  );
}
