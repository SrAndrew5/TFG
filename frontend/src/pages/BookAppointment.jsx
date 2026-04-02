import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { 
  HiOutlineArrowLeft, 
  HiOutlineClock, 
  HiOutlineBanknotes, 
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineCheckCircle
} from 'react-icons/hi2';

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
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  // Intentos de reserva para mostrar errores (UX)
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    api.get(`/services/${serviceId}`)
      .then((res) => setService(res.data.data))
      .catch(() => {
        toast.error('Servicio no encontrado');
        navigate('/services');
      })
      .finally(() => setLoading(false));
  }, [serviceId, navigate]);

  useEffect(() => {
    if (selectedEmployee && selectedDate) {
      loadSlots();
    }
    // Si cambian fecha/empleado, reseteamos la hora elegida y estado de intento
    setSelectedSlot(null);
    setHasAttempted(false);
  }, [selectedEmployee, selectedDate]);

  const loadSlots = async () => {
    setLoadingSlots(true);
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
    setHasAttempted(true);
    
    if (!selectedEmployee || !selectedDate || !selectedSlot) {
      toast.error('Por favor completa todos los pasos obligatorios');
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
      navigate('/booking-success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reservar la cita');
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-fade-in">
      
      {/* ── Header Flotante con Back ── */}
      <button 
        onClick={() => navigate('/services')} 
        className="flex items-center gap-2 text-text-secondary hover:text-brand-600 transition-colors font-semibold text-sm mb-2"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Volver al catálogo
      </button>

      {/* ── Tarjeta Principal de Reserva ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">
        
        {/* Cabecera de la Tarjeta (Info del servicio) */}
        <div className="bg-gradient-to-br from-surface-subtle to-brand-50/30 p-8 border-b border-border-base relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-border-base text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 shadow-xs">
                Nueva Reserva
              </div>
              <h1 className="text-3xl font-extrabold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                {service.nombre}
              </h1>
              {service.descripcion && <p className="text-text-secondary text-sm max-w-lg">{service.descripcion}</p>}
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-border-base shadow-xs w-fit">
              <div className="text-center px-4 border-r border-border-base">
                <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Costo</p>
                <p className="text-xl font-extrabold text-text-primary flex justify-center items-center gap-1">
                  {parseFloat(service.precio).toFixed(2)}€
                </p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-1">Tiempo</p>
                <p className="text-xl font-extrabold text-text-primary flex justify-center items-center gap-1">
                  {service.duracion_min}'
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cuerpo del Formulario ── */}
        <div className="p-8 space-y-10">

          {/* Paso 1: Profesional */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-sm font-extrabold border border-brand-100">1</span>
              Selecciona el Profesional
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {service.empleados?.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
                    selectedEmployee === emp.id
                      ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/10'
                      : 'border-border-base hover:border-brand-300 hover:bg-surface-elevated'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    selectedEmployee === emp.id ? 'bg-brand-500 text-white shadow-brand' : 'bg-surface-300 text-text-secondary'
                  }`}>
                    {emp.nombre?.charAt(0)}
                  </div>
                  <div>
                    <p className={`font-bold ${selectedEmployee === emp.id ? 'text-brand-900' : 'text-text-primary'}`}>
                      {emp.nombre} {emp.apellidos}
                    </p>
                    <p className={`text-xs ${selectedEmployee === emp.id ? 'text-brand-600' : 'text-text-secondary'}`}>
                      {emp.especialidad || 'Especialista General'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {hasAttempted && !selectedEmployee && (
              <p className="text-xs font-semibold text-danger-text mt-2 flex items-center gap-1">
                Seleccionar un profesional es obligatorio.
              </p>
            )}
          </section>

          {/* Paso 2: Fecha */}
          <section className={`space-y-4 transition-all duration-300 ${!selectedEmployee ? 'opacity-40 pointer-events-none' : ''}`}>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-sm font-extrabold border border-brand-100">2</span>
              Elige tu fecha
            </h2>
            
            <div className="max-w-xs relative">
              <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
              <input
                type="date"
                min={getMinDate()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`input-field pl-11 py-3.5 font-medium ${hasAttempted && !selectedDate && selectedEmployee ? 'border-danger-border ring-danger-bg' : ''}`}
              />
            </div>
            {hasAttempted && !selectedDate && selectedEmployee && (
              <p className="text-xs font-semibold text-danger-text flex items-center gap-1">
                La fecha es requerida para buscar horarios.
              </p>
            )}
          </section>

          {/* Paso 3: Hora */}
          <section className={`space-y-4 transition-all duration-300 ${!selectedDate ? 'opacity-40 pointer-events-none' : ''}`}>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-sm font-extrabold border border-brand-100">3</span>
              Selecciona una hora
            </h2>
            
            {loadingSlots ? (
              <div className="p-8 border-2 border-dashed border-border-base rounded-2xl flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm font-medium text-text-muted">Buscando horarios...</p>
              </div>
            ) : selectedDate && slots.length === 0 ? (
              <div className="p-6 bg-warning-bg border border-warning-border rounded-2xl text-warning-text flex items-center gap-3 text-sm font-semibold">
                Lo sentimos, este día el profesional no tiene horarios disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot.hora_inicio}
                    onClick={() => setSelectedSlot(slot.hora_inicio)}
                    className={`py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer border ${
                      selectedSlot === slot.hora_inicio
                        ? 'bg-brand-500 text-white border-brand-500 shadow-brand -translate-y-0.5'
                        : 'bg-white border-border-base text-text-secondary hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 shadow-xs'
                    }`}
                  >
                    {slot.hora_inicio}
                  </button>
                ))}
              </div>
            )}
            
            {hasAttempted && !selectedSlot && selectedDate && slots.length > 0 && (
              <p className="text-xs font-semibold text-danger-text mt-2 flex items-center gap-1">
                Debes seleccionar tu hora preferida.
              </p>
            )}
          </section>
          
          {/* Paso 4: Cierre y Ticket Resumen */}
          <section className={`space-y-6 pt-6 border-t border-border-base transition-all duration-500 ${!selectedSlot ? 'opacity-20 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Comentarios para este servicio (Opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="input-field py-3"
                rows={3}
                placeholder="¿Algún corte o tinte en particular? ¿Alergias o consideraciones? Cuéntanos..."
              />
            </div>

            {/* Ticket de Compra Visual */}
            <div className="bg-surface-elevated rounded-2xl p-6 border border-border-strong relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <HiOutlineCheckCircle className="w-32 h-32 text-text-primary" />
              </div>
              
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">Resumen de tu Visita</h3>
              
              <div className="space-y-3 relative z-10 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-border-strong/50">
                  <span className="text-text-secondary">Servicio</span>
                  <span className="font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>{service.nombre}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border-strong/50">
                  <span className="text-text-secondary">Fecha y Hora</span>
                  <span className="font-bold text-text-primary">
                    {selectedDate && new Date(selectedDate).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}, a las {selectedSlot}h
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border-strong/50">
                  <span className="text-text-secondary">Costo al finalizar</span>
                  <span className="font-extrabold text-brand-600 text-lg">{parseFloat(service.precio).toFixed(2)}€</span>
                </div>
              </div>
            </div>

            {/* Botón CTA Fuerte */}
            <button 
              onClick={handleBook} 
              disabled={booking} 
              className={`btn-primary w-full py-4 text-base tracking-wide flex justify-center items-center transition-all ${booking ? 'opacity-80 scale-95' : 'hover:scale-[1.01]'}`}
            >
              {booking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Procesando reserva...
                </>
              ) : (
                'Confirmar Reserva'
              )}
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}
