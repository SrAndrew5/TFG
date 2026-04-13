import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineMapPin,
  HiOutlineFaceFrown,
  HiOutlineCalendar,
  HiOutlineBanknotes,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

export default function MyBookings() {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proximas');

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (location.state?.successResource) {
      toast.success('¡Reserva de espacio creada exitosamente!');
    }
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resource-bookings');
      setBookings(res.data.data);
    } catch {
      toast.error('Error al cargar tus reservas');
    } finally {
      setLoading(false);
    }
  };

  const requestCancel = (id) => {
    setBookingToCancel(id);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    setCanceling(true);
    try {
      await api.put(`/resource-bookings/${bookingToCancel}/status`, { estado: 'CANCELADA' });
      toast.success('Reserva cancelada correctamente');
      loadBookings();
    } catch {
      toast.error('Error al cancelar la reserva');
    } finally {
      setCanceling(false);
      setCancelModalOpen(false);
      setBookingToCancel(null);
    }
  };

  const getStatusBadge = (estado) => {
    const map = {
      PENDIENTE: 'badge-pending',
      CONFIRMADA: 'badge-confirmed',
      CANCELADA: 'badge-cancelled',
      COMPLETADA: 'badge-completed',
    };
    const labels = { PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', CANCELADA: 'Cancelada', COMPLETADA: 'Completada' };
    return <span className={`badge ${map[estado]}`}>{labels[estado]}</span>;
  };

  const TABS = [
    { id: 'proximas', label: 'Próximas', count: bookings.filter((b) => ['PENDIENTE', 'CONFIRMADA'].includes(b.estado)).length },
    { id: 'historial', label: 'Historial', count: bookings.filter((b) => ['COMPLETADA', 'CANCELADA'].includes(b.estado)).length },
  ];

  const filtered = bookings.filter((b) => {
    if (activeTab === 'proximas') return ['PENDIENTE', 'CONFIRMADA'].includes(b.estado);
    return ['COMPLETADA', 'CANCELADA'].includes(b.estado);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">

      {/* Header */}
      <div className="page-header border-b border-border-base pb-6">
        <h1 className="page-title text-4xl mb-2">Mis Reservas de Coworking</h1>
        <p className="page-subtitle text-base">Gestiona tus espacios reservados de escritorios, salas y despachos.</p>
      </div>

      {/* CTA si no hay reservas próximas */}
      {bookings.filter((b) => ['PENDIENTE', 'CONFIRMADA'].includes(b.estado)).length === 0 && (
        <div className="bg-gradient-to-r from-brand-50 to-brand-100/50 border border-brand-200/60 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-brand-800">¿Necesitas un espacio? ¡Reserva ahora!</p>
          </div>
          <Link to="/resources" className="btn-primary text-sm py-2 px-5 whitespace-nowrap">
            Ver espacios
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-surface-elevated p-1.5 rounded-2xl w-fit border border-border-base shadow-xs mb-8">
        {TABS.map((tab) => (
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
            <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === tab.id ? 'bg-brand-50 text-brand-600' : 'bg-surface-300 text-text-muted'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card w-full py-16 flex flex-col items-center justify-center text-center border-dashed border-2 border-border-strong bg-surface-subtle/50">
          <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4 text-text-muted shadow-sm">
            <HiOutlineFaceFrown className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            No hay reservas {activeTab === 'proximas' ? 'próximas' : 'en el historial'}
          </h3>
          <p className="text-text-secondary max-w-md mx-auto">
            {activeTab === 'proximas' ? 'Reserva un espacio de coworking cuando lo necesites.' : 'Aquí aparecerán tus reservas pasadas y canceladas.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((b, i) => {
            const dateObj = new Date(b.fecha);
            const isCancelable = ['PENDIENTE', 'CONFIRMADA'].includes(b.estado);

            return (
              <div
                key={b.id}
                className="card-hover p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-up bg-white group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex gap-5 items-start">
                  {/* Calendar widget */}
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
                        {b.recurso?.nombre || 'Espacio Coworking'}
                      </h3>
                      {getStatusBadge(b.estado)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mt-2">
                      <div className="flex items-center gap-1.5">
                        <HiOutlineClock className="w-4 h-4 text-text-muted" />
                        <span className="font-medium">{b.hora_inicio} - {b.hora_fin}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HiOutlineBuildingOffice2 className="w-4 h-4 text-text-muted" />
                        <span>{b.recurso?.tipo}</span>
                      </div>
                      {b.recurso?.ubicacion && (
                        <div className="flex items-center gap-1.5">
                          <HiOutlineMapPin className="w-4 h-4 text-text-muted" />
                          <span>{b.recurso.ubicacion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t border-border-base pt-4 md:border-none md:pt-0">
                  <span className="text-xl font-bold text-text-primary">
                    {b.recurso?.precio_hora
                      ? (() => {
                          const h = b.hora_inicio.split(':').map(Number);
                          const e = b.hora_fin.split(':').map(Number);
                          const hours = ((e[0] * 60 + e[1]) - (h[0] * 60 + h[1])) / 60;
                          return (parseFloat(b.recurso.precio_hora) * hours).toFixed(2) + '€';
                        })()
                      : '—'}
                  </span>
                  <div className="flex gap-2">
                    <button className="btn-secondary px-3 py-2 text-xs" onClick={() => setSelectedBooking(b)}>
                      <HiOutlineEye className="w-4 h-4" />
                      Detalles
                    </button>
                    {isCancelable && (
                      <button
                        onClick={() => requestCancel(b.id)}
                        className="btn-danger px-3 py-2 text-xs bg-white hover:bg-danger-bg text-danger-text opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* Modal Detalles */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
          <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(31,41,55,0.15)] max-w-lg w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base">
            <div className="p-6 border-b border-border-base bg-surface-subtle/50 flex justify-between items-start">
              <div>
                <span className="px-2.5 py-1 bg-white border border-border-base rounded-md text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  Reserva #{selectedBooking.id.toString().padStart(4, '0')}
                </span>
                <h2 className="text-2xl font-bold text-text-primary mt-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {selectedBooking.recurso?.nombre}
                </h2>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-elevated text-text-secondary hover:bg-brand-50 hover:text-brand-600 transition-colors">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-elevated p-4 rounded-2xl border border-border-base/50">
                  <div className="flex items-center gap-2 text-brand-500 mb-1">
                    <HiOutlineCalendar className="w-5 h-5" />
                    <p className="text-xs font-bold uppercase tracking-wide">Fecha</p>
                  </div>
                  <p className="text-sm font-semibold text-text-primary mt-2">
                    {new Date(selectedBooking.fecha).toLocaleDateString('es-ES', { weekday: 'short', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="bg-surface-elevated p-4 rounded-2xl border border-border-base/50">
                  <div className="flex items-center gap-2 text-brand-500 mb-1">
                    <HiOutlineClock className="w-5 h-5" />
                    <p className="text-xs font-bold uppercase tracking-wide">Horario</p>
                  </div>
                  <p className="text-sm font-semibold text-text-primary mt-2">
                    {selectedBooking.hora_inicio} — {selectedBooking.hora_fin}
                  </p>
                </div>
                {selectedBooking.recurso?.ubicacion && (
                  <div className="col-span-2 bg-surface-elevated p-4 rounded-2xl border border-border-base/50">
                    <div className="flex items-center gap-2 text-brand-500 mb-1">
                      <HiOutlineMapPin className="w-5 h-5" />
                      <p className="text-xs font-bold uppercase tracking-wide">Ubicación</p>
                    </div>
                    <p className="text-sm font-semibold text-text-primary mt-1">
                      {selectedBooking.recurso.ubicacion}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-5 bg-surface-subtle/30 border-t border-border-base">
              <div className="flex justify-between items-center mb-5">
                <span className="text-text-secondary font-medium text-sm">Total pagado</span>
                <span className="text-2xl font-extrabold text-brand-700" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {selectedBooking.recurso?.precio_hora
                    ? (() => {
                        const h = selectedBooking.hora_inicio.split(':').map(Number);
                        const e = selectedBooking.hora_fin.split(':').map(Number);
                        const hours = ((e[0] * 60 + e[1]) - (h[0] * 60 + h[1])) / 60;
                        return (parseFloat(selectedBooking.recurso.precio_hora) * hours).toFixed(2) + '€';
                      })()
                    : '—'}
                </span>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-full py-3.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-sm tracking-wide rounded-xl border border-brand-200/50 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {cancelModalOpen && bookingToCancel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-center">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md" onClick={() => !canceling && setCancelModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in p-8 border border-border-base/50">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Cancelar Reserva
            </h3>
            <p className="text-sm text-text-secondary mb-8">
              ¿Estás seguro? La reserva se cancelará y el espacio quedará libre para otros usuarios.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button disabled={canceling} onClick={() => setCancelModalOpen(false)} className="w-full btn-secondary border-transparent bg-surface-elevated py-3 text-sm font-bold">
                Cerrar
              </button>
              <button disabled={canceling} onClick={confirmCancel} className="w-full btn-danger flex items-center justify-center py-3 text-sm font-bold">
                {canceling ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sí, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
