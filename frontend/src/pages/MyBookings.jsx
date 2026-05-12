import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePageTitle } from '../hooks/usePageTitle';
import toast from 'react-hot-toast';
import { useScrollLock } from '../hooks/useScrollLock';
import ModalPortal from '../components/shared/ModalPortal';
import StatusBadge from '../components/shared/StatusBadge';
import ConfirmModal from '../components/shared/ConfirmModal';
import ReviewModal from '../components/shared/ReviewModal';
import PageWrapper from '../components/layout/PageWrapper';
import {
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlineXMark,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineChevronRight,
  HiOutlineTicket,
  HiOutlineArrowPath,
  HiOutlinePlus,
  HiOutlineInformationCircle,
} from 'react-icons/hi2';

function calcPrecioHoras(precioHora, horaInicio, horaFin) {
  if (!precioHora || !horaInicio || !horaFin) return '—';
  const [hh, hm] = horaInicio.split(':').map(Number);
  const [eh, em] = horaFin.split(':').map(Number);
  const hours = ((eh * 60 + em) - (hh * 60 + hm)) / 60;
  return (parseFloat(precioHora) * hours).toFixed(2) + '€';
}

export default function MyBookings() {
  usePageTitle('Mis Reservas');
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proximas');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (location.state?.successResource) toast.success('¡Reserva de espacio creada exitosamente!');
    loadBookings();
  }, [page, activeTab]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resource-bookings', {
        params: { page, pageSize, tab: activeTab }
      });
      const data = res.data.data || [];
      setBookings(data);
      setHasMore(data.length === pageSize);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const requestCancel = (id) => { setBookingToCancel(id); setCancelModalOpen(true); };

  const confirmCancel = async () => {
    setCanceling(true);
    try {
      await api.put(`/resource-bookings/${bookingToCancel}/status`, { estado: 'CANCELADA' });
      toast.success('Reserva cancelada correctamente');
      loadBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al cancelar la reserva');
    } finally {
      setCanceling(false);
      setCancelModalOpen(false);
      setBookingToCancel(null);
    }
  };

  useScrollLock(!!selectedBooking || cancelModalOpen);

  const filtered = bookings.filter(b =>
    activeTab === 'proximas'
      ? ['PENDIENTE', 'CONFIRMADA'].includes(b.estado)
      : ['COMPLETADA', 'CANCELADA'].includes(b.estado)
  );

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto pb-24 px-6 animate-fade-in">

        {/* ── HIGH-END HERO ── */}
        <div className="relative mb-16 p-12 md:p-16 rounded-[4rem] bg-brand-500 text-white overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                Historial de Actividad
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">Mis Reservas</h1>
              <p className="text-brand-100/60 text-lg font-medium max-w-md">
                Gestiona tus espacios de trabajo y salas de reuniones desde un solo lugar.
              </p>
            </div>
            <button
              onClick={() => navigate('/resources')}
              className="bg-white text-brand-500 font-black text-sm uppercase tracking-widest px-10 py-5 rounded-[2rem] shadow-xl hover:scale-105 transition-transform flex items-center gap-3 active:scale-95"
            >
              <HiOutlinePlus className="w-5 h-5" />
              Nueva Reserva
            </button>
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex p-1.5 bg-surface-subtle rounded-3xl w-fit">
            {[
              { id: 'proximas',  label: 'Próximas' },
              { id: 'historial', label: 'Historial' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-brand-500 shadow-md ring-1 ring-black/[0.03]' 
                    : 'text-text-muted hover:text-brand-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
             <p className="text-xs font-black text-text-muted uppercase tracking-widest">
               Mostrando {filtered.length} resultados
             </p>
             <button onClick={loadBookings} className="w-10 h-10 rounded-xl bg-white border border-border-base flex items-center justify-center text-text-muted hover:text-brand-500 hover:shadow-md transition-all">
                <HiOutlineArrowPath className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>

        {/* ── BOOKINGS GRID ── */}
        {loading && page === 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {[...Array(4)].map((_, i) => (
               <div key={i} className="h-64 bg-surface-subtle animate-pulse rounded-[3rem]" />
             ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bento-card py-24 text-center animate-fade-up">
            <img 
              src="/empty_bookings_illustration_1778457562660.png" 
              className="w-48 h-48 mx-auto mb-8 object-contain opacity-80" 
              alt="No hay reservas" 
            />
            <h3 className="text-3xl font-black text-brand-500 mb-3 tracking-tighter">Tu agenda está libre</h3>
            <p className="text-text-secondary font-medium mb-10 max-w-xs mx-auto leading-relaxed">
              Parece que no tienes reservas en esta sección. ¿Buscas un lugar para trabajar mañana?
            </p>
            <button onClick={() => navigate('/resources')} className="btn-primary px-12 py-5 rounded-[2rem]">
              Explorar Espacios
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filtered.map((b, i) => {
              // Parseo robusto: b.fecha puede ser "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss.sssZ"
              const datePart = b.fecha.split('T')[0];
              const [y, m, d] = datePart.split('-').map(Number);
              const [h, min] = b.hora_inicio.split(':').map(Number);
              const bookingDate = new Date(y, m - 1, d, h, min);
              
              const now = new Date();
              const diffMs = bookingDate - now;
              const diffHours = diffMs / (1000 * 60 * 60);
              
              // Solo cancelable si faltan más de 24h y está en estado válido
              const canCancel = diffHours >= 24 && ['PENDIENTE', 'CONFIRMADA'].includes(b.estado);
              const isCompleted = b.estado === 'COMPLETADA';

              // Formateo de fecha profesional: "Lunes, 12 May"
              const dayName = bookingDate.toLocaleDateString('es-ES', { weekday: 'long' });
              const monthName = bookingDate.toLocaleDateString('es-ES', { month: 'short' });

              return (
                <div
                  key={b.id}
                  className="group bento-card flex flex-col justify-between hover:-translate-y-2 animate-fade-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-brand-50 rounded-[1.5rem] flex flex-col items-center justify-center shrink-0 border border-brand-100 shadow-sm transition-colors group-hover:bg-brand-500 group-hover:border-brand-500">
                          <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest group-hover:text-brand-100">
                            {monthName}
                          </span>
                          <span className="text-2xl font-black text-brand-500 leading-none mt-0.5 group-hover:text-white">
                            {bookingDate.getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-accent-500 uppercase tracking-[0.2em] mb-1 capitalize">
                            {dayName}
                          </p>
                          <h3 className="text-xl font-black text-brand-500 tracking-tight mb-2 group-hover:text-brand-600 transition-colors">
                            {b.recurso?.nombre}
                          </h3>
                          <StatusBadge estado={b.estado} />
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total</p>
                         <p className="text-2xl font-black text-brand-500">
                           {calcPrecioHoras(b.recurso?.precio_hora, b.hora_inicio, b.hora_fin)}
                         </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="flex items-center gap-3 p-4 bg-surface-subtle rounded-2xl border border-transparent group-hover:border-brand-100 transition-all">
                        <HiOutlineClock className="w-5 h-5 text-accent-500" />
                        <div>
                           <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Horario</p>
                           <p className="text-sm font-bold text-brand-500">{b.hora_inicio} – {b.hora_fin}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-surface-subtle rounded-2xl border border-transparent group-hover:border-brand-100 transition-all">
                        <HiOutlineMapPin className="w-5 h-5 text-accent-500" />
                        <div>
                           <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Ubicación</p>
                           <p className="text-sm font-bold text-brand-500 truncate">Zona Cowork</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-8 border-t border-border-base border-dashed">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="flex-1 py-4 px-6 bg-surface-subtle hover:bg-white hover:shadow-md text-brand-500 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all border border-transparent hover:border-border-base"
                    >
                      Detalles
                    </button>
                    {canCancel ? (
                      <button
                        onClick={() => requestCancel(b.id)}
                        className="flex-1 py-4 px-6 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-sm shadow-red-100"
                      >
                        Cancelar
                      </button>
                    ) : (
                      ['PENDIENTE', 'CONFIRMADA'].includes(b.estado) && (
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 bg-surface-subtle rounded-2xl opacity-60 cursor-not-allowed group/hint relative">
                           <HiOutlineInformationCircle className="w-4 h-4 text-text-muted" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">No cancelable</span>
                           <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 p-3 bg-brand-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/hint:opacity-100 transition-opacity pointer-events-none shadow-xl z-20">
                              Las reservas solo pueden cancelarse con más de 24h de antelación.
                           </div>
                        </div>
                      )
                    )}
                    {isCompleted && !b.review && (
                      <button
                        onClick={() => setReviewTarget({ type: 'reserva', id: b.id, name: b.recurso?.nombre })}
                        className="flex-1 py-4 px-6 bg-accent-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-brand"
                      >
                        Reseñar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {!loading && filtered.length > 0 && (
          <div className="mt-20 flex items-center justify-center gap-6">
            <button
              disabled={page === 1}
              onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-12 h-12 rounded-2xl bg-white border border-border-base flex items-center justify-center text-text-secondary hover:text-brand-500 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <HiOutlineChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-center gap-2">
               <span className="text-sm font-black text-brand-500">Página {page}</span>
               <span className="text-xs font-bold text-text-muted">de {hasMore ? page + 1 : page}</span>
            </div>
            <button
              disabled={!hasMore}
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-12 h-12 rounded-2xl bg-white border border-border-base flex items-center justify-center text-text-secondary hover:text-brand-500 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
            >
              <HiOutlineChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* ── DETAILS MODAL (Premium Receipt Style) ── */}
        {selectedBooking && (
          <ModalPortal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-brand-900/20 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-md w-full relative z-10 animate-fade-up overflow-hidden border border-border-base">
                
                <div className="p-10 text-center border-b border-border-base bg-surface-subtle/50 relative">
                   <button 
                    onClick={() => setSelectedBooking(null)} 
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-text-muted hover:text-red-500 transition-colors"
                   >
                      <HiOutlineXMark className="w-5 h-5" />
                   </button>
                   <div className="w-20 h-20 bg-brand-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-brand">
                      <HiOutlineTicket className="w-10 h-10 text-white" />
                   </div>
                   <h2 className="text-3xl font-black text-brand-500 tracking-tighter">Tu Ticket</h2>
                   <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mt-2">Referencia #{selectedBooking.id.toString().padStart(6, '0')}</p>
                </div>

                <div className="p-10 space-y-8">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center py-4 border-b border-border-base border-dashed">
                         <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Espacio</span>
                         <span className="text-sm font-black text-brand-500">{selectedBooking.recurso?.nombre}</span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-border-base border-dashed">
                         <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Fecha</span>
                         <span className="text-sm font-black text-brand-500">
                           {new Date(selectedBooking.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                         </span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-border-base border-dashed">
                         <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Horario</span>
                         <span className="text-sm font-black text-brand-500">{selectedBooking.hora_inicio} — {selectedBooking.hora_fin}</span>
                      </div>
                   </div>

                   <div className="bg-brand-50 text-brand-600 rounded-3xl p-6 flex justify-between items-center">
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-widest mb-1">Total Pagado</p>
                         <p className="text-3xl font-black">
                           {calcPrecioHoras(selectedBooking.recurso?.precio_hora, selectedBooking.hora_inicio, selectedBooking.hora_fin)}
                         </p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                         <HiOutlineInformationCircle className="w-6 h-6 text-brand-500" />
                      </div>
                   </div>

                   <button onClick={() => setSelectedBooking(null)} className="btn-primary w-full py-5 rounded-[2rem] text-sm">
                      Entendido
                   </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        <ConfirmModal
          open={cancelModalOpen && !!bookingToCancel}
          title="¿Cancelar reserva?"
          message="Esta acción liberará el espacio inmediatamente. Si es una reserva prepagada, la devolución se procesará según nuestra política."
          confirmLabel="Sí, cancelar ahora"
          loading={canceling}
          onConfirm={confirmCancel}
          onClose={() => setCancelModalOpen(false)}
        />

        <ReviewModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          target={reviewTarget}
          onSuccess={loadBookings}
        />
      </div>
    </PageWrapper>
  );
}
