import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  HiOutlineArrowLeft,
  HiOutlineUserGroup,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineTicket,
  HiOutlineChevronRight,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import DiscountCodeInput from '../components/shared/DiscountCodeInput';
import PaymentModal from '../components/shared/PaymentModal';

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m) {
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

function buildAvailableSlots(occupiedSlots, apertura = '08:00', cierre = '20:00') {
  const open = timeToMinutes(apertura);
  const close = timeToMinutes(cierre);
  const hours = [];
  for (let m = open; m + 60 <= close; m += 60) {
    hours.push(minutesToTime(m));
  }
  return hours.filter((h) => {
    const start = timeToMinutes(h);
    const end = start + 60;
    return !occupiedSlots.some((s) => {
      const os = timeToMinutes(s.hora_inicio);
      const oe = timeToMinutes(s.hora_fin);
      return start < oe && end > os;
    });
  });
}

export default function BookResource() {
  usePageTitle('Reservar Espacio');
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

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
          setAvailableSlots(buildAvailableSlots(occupied, resource?.horario_apertura, resource?.horario_cierre));
        })
        .catch(() => toast.error('Error al comprobar disponibilidad'))
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDate, resourceId, resource?.horario_apertura, resource?.horario_cierre]);

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
  const totalHours = selectedStart && finalEnd ? (timeToMinutes(finalEnd) - timeToMinutes(selectedStart)) / 60 : 0;
  const totalPrice = resource ? (parseFloat(resource.precio_hora) * totalHours).toFixed(2) : '0.00';
  const getMinDate = () => new Date().toISOString().split('T')[0];
  const { user, openLoginModal } = useAuth();

  const handleBook = async () => {
    setHasAttempted(true);
    if (!selectedDate || !selectedStart) {
      toast.error('Selecciona una fecha y un horario de inicio');
      return;
    }
    if (!user) {
      openLoginModal(() => setPaymentModalOpen(true));
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
        codigo_descuento: discount?.code || null,
      });
      setPaymentModalOpen(false);
      addNotification({
        type: 'space',
        title: '¡Reserva confirmada!',
        body: `Tu reserva de ${resource?.nombre} el ${selectedDate} de ${selectedStart} a ${finalEnd} está confirmada.`,
      });
      navigate('/booking-success', {
        state: { serviceName: resource?.nombre, fecha: selectedDate, horaInicio: selectedStart, tipo: 'recurso' },
      });
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 animate-fade-in">
      
      {/* ── BREADCRUMB ── */}
      <nav className="py-8">
        <button onClick={() => navigate('/resources')} className="flex items-center gap-2 text-text-muted hover:text-brand-500 transition-colors text-sm font-bold group">
          <HiOutlineArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a espacios
        </button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* ── LEFT COLUMN: Selection ── */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Hero Section Card */}
          <div className="relative rounded-[3rem] overflow-hidden bg-brand-900 aspect-[21/9] shadow-2xl">
            <img 
              src="/coworking_space_hero_1778457464161.png" 
              className="w-full h-full object-cover opacity-60" 
              alt={resource.nombre} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-10 right-10 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                {resource.tipo}
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-2">{resource.nombre}</h1>
              <p className="text-brand-100/60 text-sm font-medium flex items-center gap-2">
                <HiOutlineMapPin className="w-4 h-4 text-accent-500" />
                Zona Principal · CoworkPro Business Center
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bento-card">
               <HiOutlineInformationCircle className="w-8 h-8 text-brand-500 mb-4" />
               <h3 className="text-lg font-black text-brand-500 mb-2 tracking-tight">Sobre este espacio</h3>
               <p className="text-text-secondary text-sm leading-relaxed font-medium">
                 {resource.descripcion || 'Un espacio diseñado para maximizar tu productividad, con conexión simétrica de fibra óptica y mobiliario ergonómico.'}
               </p>
            </div>
            <div className="bento-card">
               <HiOutlineUserGroup className="w-8 h-8 text-brand-500 mb-4" />
               <h3 className="text-lg font-black text-brand-500 mb-2 tracking-tight">Capacidad</h3>
               <p className="text-text-secondary text-sm leading-relaxed font-medium">
                 Este espacio permite hasta <span className="font-bold text-brand-500">{resource.capacidad} personas</span> trabajando cómodamente.
               </p>
            </div>
          </div>

          {/* Step 1: Date */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-black text-sm">1</span>
              <h2 className="text-2xl font-black text-brand-500 tracking-tight">¿Cuándo vienes?</h2>
            </div>
            <div className="max-w-md">
              <div className="relative group">
                <HiOutlineCalendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="date"
                  min={getMinDate()}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field pl-14 py-4"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Time */}
          <section className={`space-y-6 transition-all duration-500 ${!selectedDate ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-black text-sm">2</span>
              <h2 className="text-2xl font-black text-brand-500 tracking-tight">Elige tu horario</h2>
            </div>
            
            {loadingSlots ? (
              <div className="py-12 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-border-base">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Verificando disponibilidad...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {(() => {
                  const ap = timeToMinutes(resource?.horario_apertura || '08:00');
                  const cl = timeToMinutes(resource?.horario_cierre || '20:00');
                  const all = [];
                  for (let m = ap; m + 60 <= cl; m += 60) all.push(minutesToTime(m));

                  return all.map((hour) => {
                    const hMinutes = timeToMinutes(hour);
                    const now = new Date();
                    const isToday = selectedDate === now.toISOString().split('T')[0];
                    const isPast = isToday && hMinutes < (now.getHours() * 60 + now.getMinutes());
                    const occupied = occupiedSlots.some((s) => {
                      const os = timeToMinutes(s.hora_inicio);
                      const oe = timeToMinutes(s.hora_fin);
                      return hMinutes >= os && hMinutes < oe;
                    });
                    const inRange = isInRange(hour);
                    const isStart = hour === selectedStart;

                    return (
                      <button
                        key={hour}
                        disabled={occupied || isPast}
                        onClick={() => handleSlotClick(hour)}
                        className={`py-4 px-2 rounded-2xl text-xs font-black transition-all border-2 ${
                          occupied || isPast ? 'bg-surface-subtle text-text-muted/40 border-transparent cursor-not-allowed line-through' :
                          isStart ? 'bg-brand-500 text-white border-brand-500 shadow-brand' :
                          inRange ? 'bg-brand-50 text-brand-600 border-brand-200' :
                          'bg-white text-text-secondary border-border-base hover:border-brand-500/20 hover:bg-surface-subtle'
                        }`}
                      >
                        {hour}
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </section>

          {/* Step 3: Notes */}
          <section className={`space-y-6 transition-all duration-500 ${!selectedStart ? 'opacity-30 pointer-events-none' : ''}`}>
             <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-black text-sm">3</span>
                <h2 className="text-2xl font-black text-brand-500 tracking-tight">¿Algo más?</h2>
              </div>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="input-field py-5"
                placeholder="Indica si necesitas alguna configuración especial..."
              />
          </section>
        </div>

        {/* ── RIGHT COLUMN: Sticky Summary ── */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28">
           <div className="bg-white border border-border-base rounded-[3rem] shadow-xl overflow-hidden p-10 space-y-8 animate-fade-in">
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-black text-brand-500 tracking-tight mb-1">Resumen</h2>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Finaliza tu reserva</p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
                    <HiOutlineSparkles className="w-6 h-6 text-brand-500" />
                 </div>
              </div>

              {selectedDate && selectedStart ? (
                <div className="space-y-6">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center py-4 border-b border-border-base border-dashed">
                         <div className="flex items-center gap-3">
                            <HiOutlineCalendar className="w-5 h-5 text-brand-500" />
                            <span className="text-sm font-bold text-text-secondary">Fecha</span>
                         </div>
                         <span className="text-sm font-black text-brand-500">
                           {new Date(selectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                         </span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-border-base border-dashed">
                         <div className="flex items-center gap-3">
                            <HiOutlineClock className="w-5 h-5 text-brand-500" />
                            <span className="text-sm font-bold text-text-secondary">Horario</span>
                         </div>
                         <span className="text-sm font-black text-brand-500">{selectedStart} → {finalEnd}</span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-border-base border-dashed">
                         <div className="flex items-center gap-3">
                            <HiOutlineInformationCircle className="w-5 h-5 text-brand-500" />
                            <span className="text-sm font-bold text-text-secondary">Duración</span>
                         </div>
                         <span className="text-sm font-black text-brand-500">{totalHours} horas</span>
                      </div>
                   </div>

                   <div className="pt-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 block">¿Tienes un cupón?</label>
                      <DiscountCodeInput onApply={setDiscount} appliedDiscount={discount} />
                   </div>

                   <div className="pt-6 border-t-[3px] border-surface-subtle space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-sm font-bold text-text-secondary">Subtotal</span>
                         <span className="text-sm font-bold text-text-secondary">{totalPrice}€</span>
                      </div>
                      {discount && (
                        <div className="flex justify-between items-center text-accent-500">
                           <span className="text-sm font-black flex items-center gap-2">
                              <HiOutlineTicket className="w-4 h-4" /> Descuento ({discount.percent}%)
                           </span>
                           <span className="text-sm font-black">
                             -{ (parseFloat(totalPrice) * (discount.percent / 100)).toFixed(2) }€
                           </span>
                        </div>
                      )}
                      <div className="flex justify-between items-end pt-4">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted leading-none mb-1">Total a pagar</p>
                            <p className="text-xs text-text-muted italic">Incluye IVA y servicios</p>
                         </div>
                         <div className="text-right">
                            <p className="text-4xl font-black text-brand-500 tracking-tighter leading-none">
                              {discount
                                ? Math.max(0, parseFloat(totalPrice) * (1 - discount.percent / 100)).toFixed(2)
                                : totalPrice}€
                            </p>
                         </div>
                      </div>
                   </div>

                   <button
                    onClick={handleBook}
                    disabled={booking}
                    className="btn-primary w-full py-5 rounded-[2rem] text-sm group"
                   >
                    {booking ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirmar y Pagar
                        <HiOutlineChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                   </button>
                </div>
              ) : (
                <div className="py-20 text-center space-y-6">
                   <div className="w-16 h-16 rounded-3xl bg-surface-subtle flex items-center justify-center mx-auto text-text-muted/30">
                      <HiOutlineClock className="w-8 h-8" />
                   </div>
                   <p className="text-text-muted font-bold tracking-tight px-6 leading-relaxed">
                     Selecciona una fecha y un horario para ver el desglose detallado de tu reserva.
                   </p>
                </div>
              )}
           </div>

           <div className="mt-8 px-10 flex items-center gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
              <HiOutlineShieldCheck className="w-5 h-5 text-accent-500" />
              <span>Cancelación gratuita hasta 24h antes</span>
           </div>
        </aside>

      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={confirmPaymentAndBook}
        originalTotal={totalPrice}
        total={discount ? Math.max(0, parseFloat(totalPrice) * (1 - discount.percent / 100)).toFixed(2) : totalPrice}
        discount={discount}
        concept={resource?.nombre}
      />
    </div>
  );
}

function HiOutlineShieldCheck(props) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
