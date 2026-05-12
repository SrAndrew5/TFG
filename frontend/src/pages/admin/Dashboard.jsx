import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollLock } from '../../hooks/useScrollLock';
import { usePageTitle } from '../../hooks/usePageTitle';
import toast from 'react-hot-toast';
import api from '../../api/client';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDate, formatDateLong } from '../../utils/dateUtils';
import {
  HiOutlineBanknotes,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineArrowUpRight,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';

export default function AdminDashboard() {
  usePageTitle('Panel Admin');
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [resourceBookings, setResourceBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingReserva, setViewingReserva] = useState(null);

  useScrollLock(detailsModalOpen);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, rbRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/resource-bookings'),
      ]);
      setStats(statsRes.data.data);
      setResourceBookings(rbRes.data.data.slice(0, 8));
    } catch {
      toast.error('Error al cargar el panel de administración');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalReservas = stats
    ? Object.values(stats.reservas.por_estado).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-base">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <HiOutlineBanknotes className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowUpRight className="w-3 h-3" /> Este mes
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Ingresos del Mes</p>
          <p className="text-3xl font-extrabold text-text-primary">
            {stats ? stats.ingresos.mes_actual.toFixed(2) : '0.00'}€
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/resources')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-border-base cursor-pointer hover:border-brand-300 hover:shadow-md transition-all"
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
          <p className="text-3xl font-extrabold text-text-primary">{totalReservas}</p>
        </div>

        <div
          onClick={() => navigate('/admin/users')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-border-base cursor-pointer hover:border-brand-300 hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center text-accent-600">
              <HiOutlineUsers className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowUpRight className="w-3 h-3" /> Activos
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Usuarios Registrados</p>
          <p className="text-3xl font-extrabold text-text-primary">
            {stats ? stats.resumen.total_usuarios : 0}
          </p>
        </div>
      </div>

      {/* ── Tabla de últimas reservas ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border-base flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-1">Últimas Reservas de Coworking</h2>
            <p className="text-sm text-text-secondary">Las reservas de espacios más recientes del sistema.</p>
          </div>
          <button onClick={() => navigate('/admin/resources')} className="btn-secondary whitespace-nowrap text-xs">
            Gestionar recursos
          </button>
        </div>

        <div className="table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/50 text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-2 text-xs">ID</th>
                <th className="font-bold py-4 px-2 text-xs">Usuario</th>
                <th className="font-bold py-4 px-2 text-xs">Recurso</th>
                <th className="font-bold py-4 px-2 text-xs">Fecha</th>
                <th className="font-bold py-4 px-2 text-xs">Horario</th>
                <th className="font-bold py-4 px-2 text-xs">Precio</th>
                <th className="font-bold py-4 px-2 text-xs">Estado</th>
                <th className="table-cell-action pr-2 text-xs">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {resourceBookings.map((rb) => (
                <tr key={rb.id} className="hover:bg-surface-elevated/50 transition-colors">
                  <td className="py-3 px-2 text-xs font-extrabold text-text-primary">#{rb.id}</td>
                  <td className="py-3 px-2 text-xs text-text-secondary">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px] uppercase">
                        {rb.usuario?.nombre?.charAt(0)}
                      </div>
                      <span className="font-medium text-text-primary">
                        {rb.usuario?.nombre} {rb.usuario?.apellidos}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs font-semibold text-text-primary truncate max-w-[130px]">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      {rb.recurso?.nombre}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary whitespace-nowrap">
                    {formatDate(rb.fecha)}
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary whitespace-nowrap">
                    {rb.hora_inicio} – {rb.hora_fin}
                  </td>
                  <td className="py-3 px-2 text-xs font-bold text-text-primary whitespace-nowrap">
                    {parseFloat(rb.precio_pagado ?? 0).toFixed(2)}€
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge estado={rb.estado} />
                  </td>
                  <td className="table-cell-action pr-2">
                    <button
                      onClick={() => { setViewingReserva(rb); setDetailsModalOpen(true); }}
                      className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-300 text-text-secondary flex items-center justify-center transition-colors"
                      title="Ver detalles"
                    >
                      <HiOutlineEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resourceBookings.length === 0 && (
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
                <h2 className="text-xl font-extrabold text-text-primary">Detalle de Reserva</h2>
                <p className="text-xs text-text-secondary mt-1">#{viewingReserva.id}</p>
              </div>
              <button onClick={() => setDetailsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              {[
                ['Cliente', `${viewingReserva.usuario?.nombre} ${viewingReserva.usuario?.apellidos}`],
                ['Espacio', viewingReserva.recurso?.nombre],
                ['Fecha', formatDateLong(viewingReserva.fecha)],
                ['Horario', `${viewingReserva.hora_inicio} – ${viewingReserva.hora_fin}`],
                ['Precio pagado', `${parseFloat(viewingReserva.precio_pagado ?? 0).toFixed(2)}€`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center border-b border-border-base pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
                  <span className="text-sm font-semibold text-text-primary">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Estado</span>
                <StatusBadge estado={viewingReserva.estado} />
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
