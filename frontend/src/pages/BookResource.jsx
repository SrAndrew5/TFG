import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineBanknotes,
  HiOutlineUsers,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import DiscountCodeInput from '../components/shared/DiscountCodeInput';
import PaymentModal from '../components/shared/PaymentModal';

const HOURS = Array.from({ length: 13 }, (_, i) => {
  const h = i + 8;
  return `${h.toString().padStart(2, '0')}:00`;
});

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m) {
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

function buildAvailableSlots(occupiedSlots) {
  const open = timeToMinutes('08:00');
  const close = timeToMinutes('21:00');
  return HOURS.filter((h) => {
    const start = timeToMinutes(h);
    const end = start + 60;
    return (
      end <= close &&
      !occupiedSlots.some((s) => {
        const os = timeToMinutes(s.hora_inicio);
        const oe = timeToMinutes(s.hora_fin);
        return start < oe && end > os;
      })
    );
  });
}

export default function BookResource() {
  const { resourceId } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [notas, setNotas] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [discount, setDiscount] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    api.get(`/resources/${resourceId}`)
      .then((res) => setResource(res.data.data))
      .catch(() => { toast.error('Recurso no encontrado'); navigate('/resources'); })
      .finally(() => setLoading(false));
  }, [resourceId, navigate]);

  useEffect(() => {
    if (selectedDate) {
      setSelectedStart(null);
      setSelectedEnd(null);
      setLoadingSlots(true);
      api.get('/resource-bookings/availability', {
        params: { recursoId: resourceId, date: selectedDate },
      })
        .then((res) => {
          const occupied = res.data.data.occupied_slots || [];
          setOccupiedSlots(occupied);
          setAvailableSlots(buildAvailableSlots(occupied));
        })
        .catch(() => toast.error('Error al comprobar disponibilidad'))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDate, resourceId]);

  const handleSlotClick = (hour) => {
    if (!selectedStart) {
      setSelectedStart(hour);
      setSelectedEnd(null);
    } else if (hour === selectedStart) {
      setSelectedStart(null);
      setSelectedEnd(null);
    } else {
      const start = timeToMinutes(selectedStart);
      const clicked = timeToMinutes(hour);
      if (clicked > start) {
        // Check no occupied slots in between
        const endTime = clicked + 60;
        const conflict = occupiedSlots.some((s) => {
          const os = timeToMinutes(s.hora_inicio);
          const oe = timeToMinutes(s.hora_fin);
          return start < oe && endTime > os;
        });
        if (conflict) {
          toast.error('Hay un conflicto en el rango seleccionado');
        } else {
          setSelectedEnd(minutesToTime(clicked + 60));
        }
      } else {
        setSelectedStart(hour);
        setSelectedEnd(null);
      }
    }
  };

  const finalEnd = selectedEnd || (selectedStart ? minutesToTime(timeToMinutes(selectedStart) + 60) : null);

  const totalHours = selectedStart && finalEnd
    ? (timeToMinutes(finalEnd) - timeToMinutes(selectedStart)) / 60
    : 0;

  const totalPrice = resource ? (parseFloat(resource.precio_hora) * totalHours).toFixed(2) : '0.00';

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleBook = async () => {
    setHasAttempted(true);
    if (!selectedDate || !selectedStart) {
      toast.error('Selecciona una fecha y un horario de inicio');
      return;
    }
    setPaymentModalOpen(true);
  };

  const confirmPaymentAndBook = async () => {
    setBooking(true);
    try {
      await api.post('/resource-bookings', {
        recurso_id: parseInt(resourceId),
        fecha: selectedDate,
        hora_inicio: selectedStart,
        hora_fin: finalEnd,
        notas: notas || null,
      });
      setPaymentModalOpen(false);
      navigate('/my-bookings', { state: { successResource: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setBooking(false);
    }
  };

  const isInRange = (hour) => {
    if (!selectedStart) return false;
    const s = timeToMinutes(selectedStart);
    const h = timeToMinutes(hour);
    const e = finalEnd ? timeToMinutes(finalEnd) : s + 60;
    return h >= s && h < e;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!resource) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-fade-in">
      <button
        onClick={() => navigate('/resources')}
        className="flex items-center gap-2 text-text-secondary hover:text-brand-600 transition-colors font-semibold text-sm mb-2"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Volver a espacios
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-surface-subtle to-brand-50/30 p-8 border-b border-border-base relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-border-base text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 shadow-xs">
                {resource.tipo}
              </span>
              <h1 className="text-3xl font-extrabold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                {resource.nombre}
              </h1>
              {resource.descripcion && <p className="text-text-secondary text-sm max-w-lg">{resource.descripcion}</p>}
            </div>
            <div className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-border-base shadow-xs w-fit text-sm">
              <span className="flex items-center gap-2 text-text-secondary font-semibold">
                <HiOutlineBanknotes className="w-4 h-4 text-brand-500" />
                {parseFloat(resource.precio_hora).toFixed(2)}€ / hora
              </span>
              <span className="flex items-center gap-2 text-text-secondary font-semibold">
                <HiOutlineUsers className="w-4 h-4 text-brand-500" />
                Hasta {resource.capacidad} persona{resource.capacidad > 1 ? 's' : ''}
              </span>
              {resource.ubicacion && (
                <span className="flex items-center gap-2 text-text-secondary font-semibold">
                  <HiOutlineMapPin className="w-4 h-4 text-brand-500" />
                  {resource.ubicacion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-10">

          {/* Paso 1: Fecha */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-sm font-extrabold border border-brand-100">1</span>
              Elige la fecha
            </h2>
            <div className="max-w-xs relative">
              <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
              <input
                type="date"
                min={getMinDate()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field pl-11 py-3.5 font-medium"
              />
            </div>
            {hasAttempted && !selectedDate && (
              <p className="text-xs font-semibold text-danger-text">La fecha es obligatoria.</p>
            )}
          </section>

          {/* Paso 2: Horario */}
          <section className={`space-y-4 transition-all duration-300 ${!selectedDate ? 'opacity-40 pointer-events-none' : ''}`}>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-sm font-extrabold border border-brand-100">2</span>
              Selecciona horario
            </h2>
            <p className="text-sm text-text-secondary">
              Haz clic en la hora de inicio y luego en la hora de fin (o deja sólo una hora para reservar 1h).
            </p>

            {loadingSlots ? (
              <div className="p-8 border-2 border-dashed border-border-base rounded-2xl flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm font-medium text-text-muted">Consultando disponibilidad...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {HOURS.filter(h => timeToMinutes(h) + 60 <= timeToMinutes('21:00')).map((hour) => {
                  const occupied = occupiedSlots.some((s) => {
                    const os = timeToMinutes(s.hora_inicio);
                    const oe = timeToMinutes(s.hora_fin);
                    const h = timeToMinutes(hour);
                    return h >= os && h < oe;
                  });
                  const inRange = isInRange(hour);
                  const isStart = hour === selectedStart;

                  return (
                    <button
                      key={hour}
                      disabled={occupied}
                      onClick={() => handleSlotClick(hour)}
                      className={`py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 border
                        ${occupied
                          ? 'bg-surface-300 text-text-muted border-border-base cursor-not-allowed opacity-50'
                          : isStart
                          ? 'bg-brand-500 text-white border-brand-500 shadow-brand -translate-y-0.5 ring-4 ring-brand-500/20'
                          : inRange
                          ? 'bg-brand-100 text-brand-700 border-brand-300'
                          : 'bg-white border-border-base text-text-secondary hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 shadow-xs'
                        }`}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>
            )}
            {hasAttempted && !selectedStart && (
              <p className="text-xs font-semibold text-danger-text">Debes seleccionar al menos una hora de inicio.</p>
            )}
          </section>

          {/* Paso 3: Notas + Resumen */}
          <section className={`space-y-6 pt-6 border-t border-border-base transition-all duration-500 ${!selectedStart ? 'opacity-20 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">Notas (Opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="input-field py-3"
                rows={2}
                placeholder="¿Necesitas proyector, pizarra u otro equipamiento?"
              />
            </div>

            {/* Código de descuento */}
            <DiscountCodeInput onApply={setDiscount} appliedDiscount={discount} />

            {/* Ticket Resumen */}
            {selectedStart && (
              <div className="bg-surface-elevated rounded-2xl p-6 border border-border-strong relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <HiOutlineCheckCircle className="w-32 h-32 text-text-primary" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">Resumen de Reserva</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-border-strong/50">
                    <span className="text-text-secondary">Espacio</span>
                    <span className="font-bold text-text-primary">{resource.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border-strong/50">
                    <span className="text-text-secondary">Fecha</span>
                    <span className="font-bold text-text-primary">
                      {selectedDate && new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'short', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border-strong/50">
                    <span className="text-text-secondary flex items-center gap-1">
                      <HiOutlineClock className="w-4 h-4" /> Horario
                    </span>
                    <span className="font-bold text-text-primary">{selectedStart}h → {finalEnd}h ({totalHours}h)</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-text-secondary">Total estimado</span>
                    <div className="text-right">
                      {discount && (
                        <p className="text-xs line-through text-text-muted">{totalPrice}€</p>
                      )}
                      <span className="font-extrabold text-brand-600 text-lg">
                        {discount
                          ? Math.max(0, parseFloat(totalPrice) * (1 - discount.percent / 100)).toFixed(2)
                          : totalPrice}€
                        {discount && <span className="text-xs text-success-text ml-1">(-{discount.percent}%)</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                'Ir a Pagar'
              )}
            </button>

            {/* Modal de Pago */}
            <PaymentModal
              isOpen={paymentModalOpen}
              onClose={() => setPaymentModalOpen(false)}
              onConfirm={confirmPaymentAndBook}
              originalTotal={totalPrice}
              total={discount
                ? Math.max(0, parseFloat(totalPrice) * (1 - discount.percent / 100)).toFixed(2)
                : totalPrice}
              discount={discount}
              concept={resource?.nombre}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
