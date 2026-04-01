import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineBuildingOffice2, HiOutlineXMark } from 'react-icons/hi2';

const typeIcons = { MESA: '🪑', SALA: '🏢', PUESTO: '💻', DESPACHO: '🚪' };

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    try {
      const res = await api.get('/resource-bookings');
      setBookings(res.data.data);
    } catch {
      toast.error('Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return;
    try {
      await api.put(`/resource-bookings/${id}/status`, { estado: 'CANCELADA' });
      toast.success('Reserva cancelada');
      loadBookings();
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
        <h1 className="text-3xl font-bold text-surface-100">Mis Reservas</h1>
        <p className="text-surface-400 mt-1">Historial de reservas de coworking</p>
      </div>

      {bookings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HiOutlineBuildingOffice2 className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <p className="text-surface-400 text-lg">No tienes reservas todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => (
            <div key={b.id} className="glass-card p-5 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center text-2xl">
                  {typeIcons[b.recurso?.tipo] || '📍'}
                </div>
                <div>
                  <p className="font-semibold text-surface-200">{b.recurso?.nombre}</p>
                  <p className="text-sm text-surface-500">
                    {b.recurso?.ubicacion} · {new Date(b.fecha).toLocaleDateString('es-ES')} · {b.hora_inicio}-{b.hora_fin}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(b.estado)}
                {(b.estado === 'PENDIENTE' || b.estado === 'CONFIRMADA') && (
                  <button onClick={() => cancelBooking(b.id)} className="p-2 rounded-lg hover:bg-danger/10 text-surface-500 hover:text-danger transition-colors">
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
