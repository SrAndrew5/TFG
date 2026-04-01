import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineXMark } from 'react-icons/hi2';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAppointments(); }, []);

  const loadAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch {
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    if (!confirm('¿Seguro que quieres cancelar esta cita?')) return;
    try {
      await api.put(`/appointments/${id}/status`, { estado: 'CANCELADA' });
      toast.success('Cita cancelada');
      loadAppointments();
    } catch {
      toast.error('Error al cancelar');
    }
  };

  const getStatusBadge = (estado) => {
    const map = { PENDIENTE: 'badge-pending', CONFIRMADA: 'badge-confirmed', CANCELADA: 'badge-cancelled', COMPLETADA: 'badge-completed' };
    return <span className={map[estado]}>{estado}</span>;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-surface-100">Mis Citas</h1>
        <p className="text-surface-400 mt-1">Historial de citas de peluquería</p>
      </div>

      {appointments.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HiOutlineCalendar className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-400 text-lg">No tienes citas todavía</p>
          <p className="text-surface-500 text-sm mt-1">Reserva tu primera cita desde la sección de servicios</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((cita, i) => (
            <div key={cita.id} className="glass-card p-5 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 font-bold">
                  {new Date(cita.fecha).getDate()}
                </div>
                <div>
                  <p className="font-semibold text-surface-200">{cita.servicio?.nombre}</p>
                  <p className="text-sm text-surface-500">
                    {cita.empleado?.nombre} {cita.empleado?.apellidos} · {new Date(cita.fecha).toLocaleDateString('es-ES')} · {cita.hora_inicio}-{cita.hora_fin}
                  </p>
                  <p className="text-sm text-surface-500">{parseFloat(cita.servicio?.precio || 0).toFixed(2)}€</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(cita.estado)}
                {(cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') && (
                  <button onClick={() => cancelAppointment(cita.id)} className="p-2 rounded-lg hover:bg-danger/10 text-surface-500 hover:text-danger transition-colors" title="Cancelar">
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
