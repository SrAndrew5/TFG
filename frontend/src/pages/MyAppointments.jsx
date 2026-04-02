import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { 
  HiOutlineCalendar, 
  HiOutlineClock, 
  HiOutlineXMark, 
  HiOutlineEye,
  HiOutlineScissors,
  HiOutlineMapPin,
  HiOutlineFaceFrown
} from 'react-icons/hi2';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proximas');

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

  const cancelAppointment = async (id) => {
    if (!confirm('¿Seguro que quieres cancelar esta cita? No se puede deshacer.')) return;
    try {
      await api.put(`/appointments/${id}/status`, { estado: 'CANCELADA' });
      toast.success('Cita cancelada correctamente');
      loadAppointments();
    } catch {
      toast.error('Error al cancelar la cita');
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
                    <button className="btn-secondary px-3 py-2 text-xs" title="Ver Ticket">
                      <HiOutlineEye className="w-4 h-4" />
                      Detalles
                    </button>
                    {isCancelable && (
                      <button 
                        onClick={() => cancelAppointment(cita.id)} 
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
    </div>
  );
}
