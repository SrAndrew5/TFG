import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
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
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proximas');
  
  // Estado para el Modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Estados para cancelar cita
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => { loadAppointments(); }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch {
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  const requestCancel = (id) => {
    setAppointmentToCancel(id);
    setCancelModalOpen(true);
  };

  const confirmCancelAction = async () => {
    setCanceling(true);
    try {
      await api.put(`/appointments/${appointmentToCancel}/status`, { estado: 'CANCELADA' });
      toast.success('Cita cancelada correctamente');
      loadAppointments();
    } catch {
      toast.error('Error al cancelar la cita');
    } finally {
      setCanceling(false);
      setCancelModalOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const getStatusBadge = (estado) => {
    const map = { 
      PENDIENTE: 'badge-pending', 
      CONFIRMADA: 'badge-confirmed', 
      CANCELADA: 'badge-cancelled', 
      COMPLETADA: 'badge-completed' 
    };
    const labels = {
      PENDIENTE: 'Pendiente',
      CONFIRMADA: 'Confirmada',
      CANCELADA: 'Cancelada',
      COMPLETADA: 'Completada'
    };
    return <span className={`badge ${map[estado]}`}>{labels[estado]}</span>;
  };

  const filteredAppointments = appointments.filter(cita => {
    if (activeTab === 'proximas') return ['PENDIENTE', 'CONFIRMADA'].includes(cita.estado);
    if (activeTab === 'completadas') return cita.estado === 'COMPLETADA';
    if (activeTab === 'canceladas') return cita.estado === 'CANCELADA';
    return true;
  });

  const TABS = [
    { id: 'proximas', label: 'Próximas', count: appointments.filter(c => ['PENDIENTE', 'CONFIRMADA'].includes(c.estado)).length },
    { id: 'completadas', label: 'Completadas', count: appointments.filter(c => c.estado === 'COMPLETADA').length },
    { id: 'canceladas', label: 'Historial / Canceladas', count: appointments.filter(c => c.estado === 'CANCELADA').length }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* ── Encabezado ── */}
      <div className="page-header border-b border-border-base pb-6">
        <h1 className="page-title text-4xl mb-2">Mis Citas</h1>
        <p className="page-subtitle text-base">Gestiona tus reservas de peluquería de forma rápida y sencilla.</p>
      </div>

      {/* ── Sistema de Tabs ── */}
      <div className="flex bg-surface-elevated p-1.5 rounded-2xl w-fit border border-border-base shadow-xs mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.id 
                ? 'bg-white text-brand-700 shadow-[0_2px_8px_rgba(99,102,241,0.1)]' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-md text-xs ${
              activeTab === tab.id ? 'bg-brand-50 text-brand-600' : 'bg-surface-300 text-text-muted'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Lista de Citas ── */}
      {filteredAppointments.length === 0 ? (
        <div className="card w-full py-16 flex flex-col items-center justify-center text-center border-dashed border-2 border-border-strong bg-surface-subtle/50">
          <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4 text-text-muted shadow-sm">
            {activeTab === 'proximas' ? <HiOutlineCalendar className="w-8 h-8" /> : <HiOutlineFaceFrown className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            No hay citas {activeTab}
          </h3>
          <p className="text-text-secondary max-w-md mx-auto">
            {activeTab === 'proximas' ? 'Aún no has reservado ningún servicio. Cuando lo hagas, aparecerá aquí.' : 'No tienes registros en este apartado temporal.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((cita, i) => {
            const dateObj = new Date(cita.fecha);
            const isCancelable = ['PENDIENTE', 'CONFIRMADA'].includes(cita.estado);
            
            return (
              <div 
                key={cita.id} 
                className="card-hover p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-up bg-white group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                
                {/* ── Info de Fecha y Detalles ── */}
                <div className="flex gap-5 items-start">
                  
                  {/* Calendar Widget */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 flex flex-col items-center justify-center text-brand-700 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 opacity-80">
                      {dateObj.toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-extrabold leading-none" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {cita.servicio?.nombre || 'Servicio General'}
                      </h3>
                      {getStatusBadge(cita.estado)}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mt-2">
                      <div className="flex items-center gap-1.5">
                        <HiOutlineClock className="w-4.5 h-4.5 text-text-muted" />
                        <span className="font-medium">{cita.hora_inicio} - {cita.hora_fin}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HiOutlineScissors className="w-4.5 h-4.5 text-text-muted" />
                        <span>Por {cita.empleado?.nombre} {cita.empleado?.apellidos}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HiOutlineMapPin className="w-4.5 h-4.5 text-text-muted" />
                        <span>Salón Principal</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Precio y Acciones ── */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t border-border-base pt-4 md:border-none md:pt-0">
                  <span className="text-xl font-bold text-text-primary">
                    {parseFloat(cita.servicio?.precio || 0).toFixed(2)}€
                  </span>
                  
                  <div className="flex gap-2">
                    <button 
                      className="btn-secondary px-3 py-2 text-xs" 
                      title="Ver Ticket"
                      onClick={() => setSelectedAppointment(cita)}
                    >
                      <HiOutlineEye className="w-4 h-4" />
                      Detalles
                    </button>
                    {isCancelable && (
                      <button 
                        onClick={() => requestCancel(cita.id)} 
                        className="btn-danger px-3 py-2 text-xs bg-white hover:bg-danger-bg text-danger-text opacity-0 group-hover:opacity-100 transition-opacity md:flex" 
                        title="Cancelar cita"
                      >
                        <HiOutlineXMark className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── Espectacular Modal de Detalles de Cita ── */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop con Blur */}
          <div 
            className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedAppointment(null)}
          ></div>
          
          {/* Contenedor del Modal */}
          <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(31,41,55,0.15)] max-w-lg w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base">
            
            {/* Header del Modal */}
            <div className="p-6 border-b border-border-base bg-surface-subtle/50 flex justify-between items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                 <HiOutlineTicket className="w-32 h-32 text-brand-900 -rotate-12" />
              </div>
              
              <div className="relative z-10 pr-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 bg-white border border-border-base rounded-md text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    Ticket #{selectedAppointment.id.toString().padStart(4, '0')}
                  </span>
                  {getStatusBadge(selectedAppointment.estado)}
                </div>
                <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {selectedAppointment.servicio?.nombre || 'Servicio Reservado'}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-elevated text-text-secondary hover:bg-brand-50 hover:text-brand-600 transition-colors z-10 flex-shrink-0"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Modal (Cuadrícula / Grid) */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-elevated p-4 rounded-2xl border border-border-base/50">
                   <div className="flex items-center gap-2 text-brand-500 mb-1">
                     <HiOutlineCalendar className="w-5 h-5" />
                     <p className="text-xs font-bold uppercase tracking-wide">Fecha y Hora</p>
                   </div>
                   <p className="text-sm font-semibold text-text-primary mt-2">
                     {new Date(selectedAppointment.fecha).toLocaleDateString('es-ES', { weekday: 'short', month: 'long', day: 'numeric' })}
                   </p>
                   <p className="text-sm text-text-secondary font-medium">
                     {selectedAppointment.hora_inicio} - {selectedAppointment.hora_fin}
                   </p>
                </div>
                
                <div className="bg-surface-elevated p-4 rounded-2xl border border-border-base/50">
                   <div className="flex items-center gap-2 text-brand-500 mb-1">
                     <HiOutlineUser className="w-5 h-5" />
                     <p className="text-xs font-bold uppercase tracking-wide">Profesional</p>
                   </div>
                   <p className="text-sm font-semibold text-text-primary mt-2">
                     {selectedAppointment.empleado?.nombre} {selectedAppointment.empleado?.apellidos}
                   </p>
                   <p className="text-sm text-text-muted font-medium">Especialista</p>
                </div>

                <div className="bg-surface-elevated p-4 rounded-2xl border border-border-base/50 col-span-2 flex justify-between items-center group">
                   <div>
                     <div className="flex items-center gap-2 text-brand-500 mb-1">
                       <HiOutlineMapPin className="w-5 h-5" />
                       <p className="text-xs font-bold uppercase tracking-wide">Ubicación</p>
                     </div>
                     <p className="text-sm font-semibold text-text-primary mt-1">
                       Local Principal - Zona de Peluquería
                     </p>
                   </div>
                   <Link to="/map?location=valencia" className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg group-hover:bg-brand-100 transition-colors">
                     Ver en mapa
                   </Link>
                </div>
              </div>
            </div>

            {/* Desglose de Precio y Footer */}
            <div className="px-6 py-5 bg-surface-subtle/30 border-t border-border-base mt-auto">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary font-medium">Precio Base</span>
                  <span className="text-text-primary font-semibold">
                    {(parseFloat(selectedAppointment.servicio?.precio || 0) * 0.79).toFixed(2)}€
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary font-medium">IVA (21%)</span>
                  <span className="text-text-primary font-semibold">
                    {(parseFloat(selectedAppointment.servicio?.precio || 0) * 0.21).toFixed(2)}€
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border-base border-dashed mt-2">
                  <span className="text-text-primary font-extrabold uppercase tracking-widest text-xs">Total</span>
                  <span className="text-2xl font-extrabold text-brand-700" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {parseFloat(selectedAppointment.servicio?.precio || 0).toFixed(2)}€
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedAppointment(null)}
                className="w-full py-3.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-sm tracking-wide rounded-xl border border-brand-200/50 transition-colors"
              >
                Cerrar Detalles
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* ── Danger Modal para Confirmación de Cancelación ── */}
      {cancelModalOpen && appointmentToCancel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-center">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md transition-opacity" onClick={() => !canceling && setCancelModalOpen(false)}></div>
          
          <div className="inline-block bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in overflow-hidden border border-border-base/50 p-8 text-center text-left align-middle transition-all transform">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_4px_24px_rgba(239,68,68,0.25)]">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Cancelar Reserva
            </h3>
            
            <p className="text-sm text-text-secondary mb-8">
              ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer y el tramo horario quedará libre para otros clientes.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button 
                type="button" 
                onClick={() => setCancelModalOpen(false)} 
                disabled={canceling} 
                className="w-full btn-secondary bg-surface-elevated hover:bg-surface-300 border-transparent py-3 text-sm font-bold"
              >
                Cerrar
              </button>
              <button 
                type="button" 
                onClick={confirmCancelAction} 
                disabled={canceling} 
                className="w-full btn-danger flex items-center justify-center py-3 text-sm font-bold tracking-wide transition-colors duration-200"
              >
                {canceling ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sí, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
