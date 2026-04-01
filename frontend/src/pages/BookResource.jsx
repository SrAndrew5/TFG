import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineMapPin, HiOutlineBanknotes } from 'react-icons/hi2';

export default function BookResource() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    api.get(`/resources/${id}`)
      .then((res) => setResource(res.data.data))
      .catch(() => toast.error('Recurso no encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      api.get('/resource-bookings/availability', { params: { recursoId: id, date: selectedDate } })
        .then((res) => setOccupiedSlots(res.data.data.occupied_slots))
        .catch(() => {});
    }
  }, [selectedDate, id]);

  const handleBook = async () => {
    if (!selectedDate || !horaInicio || !horaFin) {
      toast.error('Completa todos los campos'); return;
    }
    if (horaInicio >= horaFin) {
      toast.error('La hora de fin debe ser posterior a la de inicio'); return;
    }
    setBooking(true);
    try {
      await api.post('/resource-bookings', {
        recurso_id: parseInt(id),
        fecha: selectedDate,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        notas: notas || null,
      });
      toast.success('¡Reserva creada exitosamente!');
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reservar');
    } finally {
      setBooking(false);
    }
  };

  const getMinDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Calculate estimated price
  const calcPrice = () => {
    if (!horaInicio || !horaFin || !resource) return 0;
    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFin.split(':').map(Number);
    const hours = (h2 * 60 + m2 - h1 * 60 - m1) / 60;
    return (hours * parseFloat(resource.precio_hora)).toFixed(2);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!resource) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/resources')} className="flex items-center gap-2 text-surface-400 hover:text-surface-200 transition-colors">
        <HiOutlineArrowLeft className="w-5 h-5" /> Volver a recursos
      </button>

      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-surface-100">{resource.nombre}</h1>
        {resource.descripcion && <p className="text-surface-400 mt-2">{resource.descripcion}</p>}
        <div className="flex items-center gap-4 mt-3 text-sm text-surface-400">
          {resource.ubicacion && <span className="flex items-center gap-1"><HiOutlineMapPin className="w-4 h-4" />{resource.ubicacion}</span>}
          <span className="flex items-center gap-1"><HiOutlineBanknotes className="w-4 h-4" />{parseFloat(resource.precio_hora).toFixed(2)}€/hora</span>
        </div>
        {resource.equipamiento && <p className="text-xs text-surface-500 mt-2">🛠 {resource.equipamiento}</p>}
      </div>

      {/* Date */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-surface-200 mb-4">Fecha</h2>
        <input type="date" min={getMinDate()} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input-field" />
      </div>

      {/* Occupied slots info */}
      {selectedDate && occupiedSlots.length > 0 && (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-surface-400 mb-3">Horarios ya ocupados:</h3>
          <div className="flex flex-wrap gap-2">
            {occupiedSlots.map((slot, i) => (
              <span key={i} className="badge bg-danger/10 text-danger border border-danger/20">{slot.hora_inicio}-{slot.hora_fin}</span>
            ))}
          </div>
        </div>
      )}

      {/* Time selection */}
      {selectedDate && (
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-surface-200 mb-4">Horario</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-surface-400 mb-2">Hora inicio</label>
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="input-field" min="07:00" max="22:00" />
            </div>
            <div>
              <label className="block text-sm text-surface-400 mb-2">Hora fin</label>
              <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="input-field" min="07:00" max="22:00" />
            </div>
          </div>
        </div>
      )}

      {/* Confirm */}
      {horaInicio && horaFin && horaFin > horaInicio && (
        <div className="glass-card p-6 animate-slide-up">
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="input-field mb-4" rows={2} placeholder="Notas (opcional)" />
          <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 mb-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-surface-400">
              <span>Espacio:</span><span className="text-surface-200 font-medium">{resource.nombre}</span>
              <span>Fecha:</span><span className="text-surface-200 font-medium">{new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <span>Horario:</span><span className="text-surface-200 font-medium">{horaInicio} - {horaFin}</span>
              <span>Precio estimado:</span><span className="text-primary-400 font-bold">{calcPrice()}€</span>
            </div>
          </div>
          <button onClick={handleBook} disabled={booking} className="btn-primary w-full disabled:opacity-50">
            {booking ? 'Reservando...' : 'Confirmar Reserva'}
          </button>
        </div>
      )}
    </div>
  );
}
