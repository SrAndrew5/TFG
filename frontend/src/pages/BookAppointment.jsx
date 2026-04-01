import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineClock, HiOutlineBanknotes, HiOutlineCalendar } from 'react-icons/hi2';

export default function BookAppointment() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    api.get(`/services/${serviceId}`)
      .then((res) => setService(res.data.data))
      .catch(() => toast.error('Servicio no encontrado'))
      .finally(() => setLoading(false));
  }, [serviceId]);

  useEffect(() => {
    if (selectedEmployee && selectedDate) {
      loadSlots();
    }
  }, [selectedEmployee, selectedDate]);

  const loadSlots = async () => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await api.get(`/availability/${selectedEmployee}/slots`, {
        params: { date: selectedDate, serviceId },
      });
      setSlots(res.data.data.slots);
    } catch {
      toast.error('Error al cargar horarios');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedEmployee || !selectedDate || !selectedSlot) {
      toast.error('Completa todos los campos');
      return;
    }
    setBooking(true);
    try {
      await api.post('/appointments', {
        empleado_id: selectedEmployee,
        servicio_id: parseInt(serviceId),
        fecha: selectedDate,
        hora_inicio: selectedSlot,
        notas: notas || null,
      });
      toast.success('¡Cita reservada exitosamente!');
      navigate('/my-appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reservar');
    } finally {
      setBooking(false);
    }
  };

  // Min date: tomorrow
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <button onClick={() => navigate('/services')} className="flex items-center gap-2 text-surface-400 hover:text-surface-200 transition-colors">
        <HiOutlineArrowLeft className="w-5 h-5" />
        Volver a servicios
      </button>

      {/* Service info */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-surface-100">{service.nombre}</h1>
        {service.descripcion && <p className="text-surface-400 mt-2">{service.descripcion}</p>}
        <div className="flex items-center gap-4 mt-3 text-sm text-surface-400">
          <span className="flex items-center gap-1"><HiOutlineClock className="w-4 h-4" />{service.duracion_min} min</span>
          <span className="flex items-center gap-1"><HiOutlineBanknotes className="w-4 h-4" />{parseFloat(service.precio).toFixed(2)}€</span>
        </div>
      </div>

      {/* Step 1: Choose employee */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold">1</span>
          Elige profesional
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {service.empleados?.map((emp) => (
            <button
              key={emp.id}
              onClick={() => setSelectedEmployee(emp.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                selectedEmployee === emp.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-surface-700 hover:border-surface-600 bg-surface-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">
                  {emp.nombre?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-surface-200">{emp.nombre} {emp.apellidos}</p>
                  {emp.especialidad && <p className="text-xs text-surface-500">{emp.especialidad}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Choose date */}
      {selectedEmployee && (
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold">2</span>
            Elige fecha
          </h2>
          <input
            type="date"
            min={getMinDate()}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field"
          />
        </div>
      )}

      {/* Step 3: Choose time */}
      {selectedDate && (
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold">3</span>
            Elige hora
          </h2>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-surface-500 py-4">No hay horarios disponibles para esta fecha</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.hora_inicio}
                  onClick={() => setSelectedSlot(slot.hora_inicio)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    selectedSlot === slot.hora_inicio
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                  }`}
                >
                  {slot.hora_inicio}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Notes + Confirm */}
      {selectedSlot && (
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm font-bold">4</span>
            Confirmar
          </h2>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="input-field mb-4"
            rows={3}
            placeholder="Notas adicionales (opcional)"
          />

          <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700/50 mb-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-surface-400">
              <span>Servicio:</span><span className="text-surface-200 font-medium">{service.nombre}</span>
              <span>Fecha:</span><span className="text-surface-200 font-medium">{new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>Hora:</span><span className="text-surface-200 font-medium">{selectedSlot}</span>
              <span>Precio:</span><span className="text-surface-200 font-medium">{parseFloat(service.precio).toFixed(2)}€</span>
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
