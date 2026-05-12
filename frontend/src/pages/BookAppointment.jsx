import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useNotifications } from '../context/NotificationsContext';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineBanknotes,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import DiscountCodeInput from '../components/shared/DiscountCodeInput';
import PaymentModal from '../components/shared/PaymentModal';

export default function BookAppointment() {
  usePageTitle('Reservar Cita');
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const [service, setService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [discount, setDiscount] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    api.get(`/services/${serviceId}`)
      .then((res) => setService(res.data.data))
      .catch(() => { toast.error('Servicio no encontrado'); navigate('/services'); })
      .finally(() => setLoading(false));
  }, [serviceId, navigate]);

  useEffect(() => {
    if (selectedEmployee && selectedDate) loadSlots();
    setSelectedSlot(null);
    setHasAttempted(false);
  }, [selectedEmployee, selectedDate]);

  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`/availability/${selectedEmployee}/slots`, { params: { date: selectedDate, serviceId } });
      setSlots(res.data.data.slots);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al cargar horarios');
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
    setPaymentModalOpen(true);
  };

  const confirmPaymentAndBook = async () => {
    setBooking(true);
    try {
      await api.post('/appointments', {
        empleado_id: selectedEmployee,
        servicio_id: parseInt(serviceId),
        fecha: selectedDate,
        hora_inicio: selectedSlot,
        notas: notas || null,
        codigo_descuento: discount?.code || null,
      });
      setPaymentModalOpen(false);
      addNotification({
        type: 'booking',
        title: '¡Cita confirmada!',
        body: `Tu cita de ${service?.nombre} ha sido reservada para el ${selectedDate} a las ${selectedSlot}h.`,
      });
      navigate('/booking-success', { state: { serviceName: service?.nombre, fecha: selectedDate, horaInicio: selectedSlot, tipo: 'cita' } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reservar la cita');
    } finally {
      setBooking(false);
    }
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const step1Done = !!selectedEmployee;
  const step2Done = !!selectedDate;
  const step3Done = !!selectedSlot;

  const finalPrice = discount
    ? Math.max(0, parseFloat(service?.precio || 0) * (1 - discount.percent / 100)).toFixed(2)
    : parseFloat(service?.precio || 0).toFixed(2);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!service) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <p className="text-slate-500 font-medium">Servicio no encontrado.</p>
      <button onClick={() => navigate('/services')} className="btn-secondary text-sm">Volver al catálogo</button>
    </div>
  );

  const manana = slots.filter(s => parseInt(s.hora_inicio.split(':')[0]) < 14);
  const tarde  = slots.filter(s => parseInt(s.hora_inicio.split(':')[0]) >= 14);

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-fade-in">

      {/* Back */}
      <button onClick={() => navigate('/services')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold text-sm mb-5">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Volver al catálogo
      </button>

      {/* ── Wizard header dark ── */}
      <div className="wizard-header mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-[.1em] mb-2" style={{ color: 'rgba(165,180,252,.65)' }}>Nueva reserva</p>
            <h1 className="wizard-title">{service.nombre}</h1>
            {service.descripcion && <p className="wizard-sub mt-1">{service.descripcion}</p>}
          </div>
          <div className="relative z-10 flex gap-3 flex-shrink-0">
            <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(165,180,252,.6)' }}>Precio</p>
              <p className="text-lg font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.03em' }}>{parseFloat(service.precio).toFixed(2)}€</p>
            </div>
            <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(165,180,252,.6)' }}>Duración</p>
              <p className="text-lg font-extrabold text-white" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.03em' }}>{service.duracion_min}'</p>
            </div>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-4 mt-6">
          {[
            { n: 1, label: 'Profesional', done: step1Done, active: true },
            { n: 2, label: 'Fecha',       done: step2Done, active: step1Done },
            { n: 3, label: 'Hora',        done: step3Done, active: step2Done },
            { n: 4, label: 'Confirmar',   done: false,     active: step3Done },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,.15)' }} />}
              <div className="wizard-step">
                <span className={`wizard-step-num ${s.done ? 'done' : s.active ? 'active' : 'pending'}`}>
                  {s.done ? '✓' : s.n}
                </span>
                <span className={`wizard-step-label ${s.active && !s.done ? 'active' : ''} hidden sm:block`}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Formulario ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(99,102,241,0.08)] overflow-hidden">
        <div className="p-8 space-y-10">

          {/* PASO 1: Profesional */}
          <section>
            <h2 className="wizard-section-title">
              <span className="wizard-section-num">1</span>
              Selecciona el Profesional
            </h2>

            {(!service.empleados || service.empleados.length === 0) ? (
              <div className="p-5 rounded-2xl text-sm font-semibold" style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
                Este servicio no tiene profesionales asignados actualmente.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.empleados.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer"
                    style={{
                      border: selectedEmployee === emp.id ? '2px solid #6366F1' : '2px solid #E8E8F5',
                      background: selectedEmployee === emp.id ? '#EEF2FF' : '#fff',
                      boxShadow: selectedEmployee === emp.id ? '0 4px 16px rgba(99,102,241,.15)' : 'none',
                    }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                      style={{
                        background: selectedEmployee === emp.id ? 'linear-gradient(135deg, #6366F1, #4338CA)' : '#F3F4F6',
                        color: selectedEmployee === emp.id ? '#fff' : '#475569',
                        boxShadow: selectedEmployee === emp.id ? '0 4px 12px rgba(99,102,241,.3)' : 'none',
                      }}>
                      {emp.nombre?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: selectedEmployee === emp.id ? '#312E81' : '#0F172A' }}>
                        {emp.nombre} {emp.apellidos}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: selectedEmployee === emp.id ? '#6366F1' : '#64748B' }}>
                        {emp.especialidad || 'Especialista'}
                      </p>
                    </div>
                    {selectedEmployee === emp.id && (
                      <HiOutlineCheckCircle className="w-5 h-5 ml-auto flex-shrink-0" style={{ color: '#6366F1' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
            {hasAttempted && !selectedEmployee && (
              <p className="text-xs font-semibold text-red-500 mt-2">Seleccionar un profesional es obligatorio.</p>
            )}
          </section>

          {/* PASO 2: Fecha */}
          <section className={`transition-all duration-300 ${!step1Done ? 'opacity-40 pointer-events-none' : ''}`}>
            <h2 className="wizard-section-title">
              <span className="wizard-section-num">2</span>
              Elige tu fecha
            </h2>
            <div className="max-w-xs relative">
              <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                min={getMinDate()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field pl-11 py-3.5 font-medium"
                style={{ borderColor: hasAttempted && !selectedDate && step1Done ? '#EF4444' : undefined }}
              />
            </div>
            {hasAttempted && !selectedDate && step1Done && (
              <p className="text-xs font-semibold text-red-500 mt-2">La fecha es requerida.</p>
            )}
          </section>

          {/* PASO 3: Hora */}
          <section className={`transition-all duration-300 ${!step2Done ? 'opacity-40 pointer-events-none' : ''}`}>
            <h2 className="wizard-section-title">
              <span className="wizard-section-num">3</span>
              Selecciona una hora
            </h2>

            {loadingSlots ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-slate-500">Buscando horarios disponibles...</p>
              </div>
            ) : selectedDate && slots.length === 0 ? (
              <div className="p-5 rounded-2xl text-sm font-semibold" style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
                Este día el profesional no tiene horarios disponibles. Prueba con otra fecha.
              </div>
            ) : (
              <div className="space-y-5">
                {manana.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Mañana</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {manana.map(slot => (
                        <button
                          key={slot.hora_inicio}
                          onClick={() => setSelectedSlot(slot.hora_inicio)}
                          className={`wizard-slot-btn ${selectedSlot === slot.hora_inicio ? 'selected' : ''}`}
                        >
                          {slot.hora_inicio}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {tarde.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tarde</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {tarde.map(slot => (
                        <button
                          key={slot.hora_inicio}
                          onClick={() => setSelectedSlot(slot.hora_inicio)}
                          className={`wizard-slot-btn ${selectedSlot === slot.hora_inicio ? 'selected' : ''}`}
                        >
                          {slot.hora_inicio}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasAttempted && !selectedSlot && selectedDate && slots.length > 0 && (
              <p className="text-xs font-semibold text-red-500 mt-2">Debes seleccionar una hora.</p>
            )}
          </section>

          {/* PASO 4: Confirmar */}
          <section className={`space-y-5 pt-6 border-t border-slate-100 transition-all duration-500 ${!step3Done ? 'opacity-30 pointer-events-none' : ''}`}>
            <h2 className="wizard-section-title">
              <span className="wizard-section-num">4</span>
              Confirmar reserva
            </h2>

            {/* Notas */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Comentarios (Opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="input-field py-3"
                rows={3}
                placeholder="¿Algún corte o tinte en particular? ¿Alergias? Cuéntanos..."
              />
            </div>

            {/* Código descuento */}
            <DiscountCodeInput onApply={setDiscount} appliedDiscount={discount} />

            {/* Resumen */}
            <div className="rounded-2xl p-5" style={{ background: '#F8F9FF', border: '1px solid #E0E7FF' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Resumen de la visita</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Servicio</span>
                  <span className="font-bold text-slate-900">{service.nombre}</span>
                </div>
                {selectedDate && selectedSlot && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha y hora</span>
                    <span className="font-bold text-slate-900">
                      {(() => { const [y,m,d] = selectedDate.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' }); })()} · {selectedSlot}h
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Total</span>
                  <div className="text-right">
                    {discount && <p className="text-xs line-through text-slate-400">{parseFloat(service.precio).toFixed(2)}€</p>}
                    <span className="text-xl font-extrabold text-indigo-700" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.04em' }}>
                      {finalPrice}€
                      {discount && <span className="text-xs font-semibold text-green-600 ml-1">(-{discount.percent}%)</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={booking}
              className="wizard-book-btn"
            >
              {booking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando reserva...
                </>
              ) : (
                <>
                  <HiOutlineSparkles className="w-5 h-5" />
                  Ir a Pagar — {finalPrice}€
                </>
              )}
            </button>

            <PaymentModal
              isOpen={paymentModalOpen}
              onClose={() => setPaymentModalOpen(false)}
              onConfirm={confirmPaymentAndBook}
              originalTotal={parseFloat(service.precio).toFixed(2)}
              total={finalPrice}
              discount={discount}
              concept={service.nombre}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
