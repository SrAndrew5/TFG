import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import {
  HiOutlineBanknotes,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineXCircle,
  HiOutlineArrowUpRight,
  HiOutlineArrowDownRight,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // ── Estado real desde la DB ──
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Modal detalles
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingReserva, setViewingReserva] = useState(null);

  // ── Carga inicial ──
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, apptRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/appointments'),
      ]);
      setStats(statsRes.data.data);
      // Mostramos solo las 5 más recientes
      setAppointments(apptRes.data.data.slice(0, 5));
    } catch (err) {
      toast.error('Error al cargar el panel de administración');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Aprobar cita (PENDIENTE → CONFIRMADA) ──
  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await api.put(`/appointments/${id}/status`, { estado: 'CONFIRMADA' });
      toast.success('Reserva confirmada exitosamente');
      // Actualiza UI localmente sin recargar todo
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, estado: 'CONFIRMADA' } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo confirmar la reserva');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (estado) => {
    const map = {
      PENDIENTE: 'badge-pending',
      CONFIRMADA: 'badge-confirmed',
      CANCELADA: 'badge-cancelled',
      COMPLETADA: 'badge-completed',
    };
    const labels = {
      PENDIENTE: 'Pdte.',
      CONFIRMADA: 'Conf.',
      CANCELADA: 'Canc.',
      COMPLETADA: 'Comp.',
    };
    return (
      <span className={`badge px-3 py-1.5 rounded-full uppercase tracking-wider text-[10px] ${map[estado]}`}>
        {labels[estado]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // KPIs derivados de stats reales
  const totalCitas = stats
    ? Object.values(stats.citas.por_estado).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Ingresos del mes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-base overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <HiOutlineBanknotes className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowUpRight className="w-3 h-3" /> Este mes
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Ingresos del Mes</p>
          <p className="text-3xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            {stats ? stats.ingresos.mes_actual.toFixed(2) : '0.00'}€
          </p>
        </div>

        {/* Total reservas */}
        <div
          onClick={() => navigate('/admin/appointments')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-border-base overflow-hidden group cursor-pointer hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-info-bg flex items-center justify-center text-info-text">
              <HiOutlineCalendar className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowUpRight className="w-3 h-3" /> Total
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Reservas Totales</p>
          <p className="text-3xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            {totalCitas}
          </p>
        </div>

        {/* Usuarios activos */}
        <div
          onClick={() => navigate('/admin/users')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-border-base overflow-hidden group cursor-pointer hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center text-accent-600">
              <HiOutlineUsers className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowUpRight className="w-3 h-3" /> Activos
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Usuarios Activos</p>
          <p className="text-3xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            {stats ? stats.resumen.total_usuarios : 0}
          </p>
        </div>

        {/* Citas hoy */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-base overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-danger-bg flex items-center justify-center text-danger-text">
              <HiOutlineXCircle className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowDownRight className="w-3 h-3" /> Hoy
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Citas para Hoy</p>
          <p className="text-3xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            {stats ? stats.citas.hoy : 0}
          </p>
        </div>
      </div>

      {/* ── Tabla de últimas citas ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border-base flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
              Últimas Reservas
            </h2>
            <p className="text-sm text-text-secondary">Las 5 citas más recientes del sistema.</p>
          </div>
          <button onClick={() => navigate('/admin/appointments')} className="btn-secondary whitespace-nowrap text-xs">
            Ver todas las reservas
          </button>
        </div>

        <div className="table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/50 text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">ID</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Usuario</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Servicio</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Fecha</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Precio</th>
                <th className="font-bold py-4 px-2 whitespace-nowrap text-xs">Estado</th>
                <th className="table-cell-action pr-2 text-xs">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {appointments.map((cita) => (
                <tr key={cita.id} className="hover:bg-surface-subtle transition-colors group">
                  <td className="py-3 px-2 font-semibold text-text-primary text-xs whitespace-nowrap">
                    #{cita.id}
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary">
                    <div className="flex items-center gap-2 max-w-[110px]">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px] uppercase">
                        {cita.usuario?.nombre?.charAt(0)}
                      </div>
                      <span className="font-medium text-text-primary truncate">
                        {cita.usuario?.nombre} {cita.usuario?.apellidos}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary max-w-[120px] truncate">
                    {cita.servicio?.nombre}
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary whitespace-nowrap">
                    {new Date(cita.fecha).toLocaleDateString('es-ES')} {cita.hora_inicio}
                  </td>
                  <td className="py-3 px-2 text-xs font-bold text-text-primary whitespace-nowrap">
                    {parseFloat(cita.servicio?.precio || 0).toFixed(2)}€
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    {getStatusBadge(cita.estado)}
                  </td>
                  <td className="table-cell-action pr-2 min-w-[100px]">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      {cita.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => handleApprove(cita.id)}
                          disabled={processingId === cita.id}
                          className="w-8 h-8 rounded-lg bg-success-bg text-success-text hover:bg-[#A7F3D0] flex items-center justify-center transition-colors"
                          title="Confirmar"
                        >
                          {processingId === cita.id ? (
                            <div className="w-4 h-4 rounded-full border-2 border-success border-t-transparent animate-spin" />
                          ) : (
                            <HiOutlineCheck className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => { setViewingReserva(cita); setDetailsModalOpen(true); }}
                        className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-300 text-text-secondary flex items-center justify-center transition-colors"
                        title="Ver detalles"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">No hay reservas recientes.</div>
          )}
        </div>
      </div>

      {/* ── Modal detalles ── */}
      {detailsModalOpen && viewingReserva && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setDetailsModalOpen(false)} />
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-md w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            <div className="px-8 py-6 border-b border-border-base bg-surface-subtle/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Detalles de Reserva
                </h2>
                <p className="text-xs text-text-secondary mt-1">#{viewingReserva.id}</p>
              </div>
              <button onClick={() => setDetailsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              {[
                ['Cliente', `${viewingReserva.usuario?.nombre} ${viewingReserva.usuario?.apellidos}`],
                ['Servicio', viewingReserva.servicio?.nombre],
                ['Empleado', `${viewingReserva.empleado?.nombre} ${viewingReserva.empleado?.apellidos}`],
                ['Fecha', `${new Date(viewingReserva.fecha).toLocaleDateString('es-ES')} – ${viewingReserva.hora_inicio}`],
                ['Precio', `${parseFloat(viewingReserva.servicio?.precio || 0).toFixed(2)}€`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center border-b border-border-base pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
                  <span className="text-sm font-semibold text-text-primary">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Estado</span>
                {getStatusBadge(viewingReserva.estado)}
              </div>
            </div>
            <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end">
              <button onClick={() => setDetailsModalOpen(false)} className="btn-secondary bg-white border-border-strong px-6 py-3">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
