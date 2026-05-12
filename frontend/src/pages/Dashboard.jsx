import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { HiOutlineCalendar, HiOutlineUsers, HiOutlineScissors, HiOutlineBuildingOffice2, HiOutlineClock, HiOutlineBanknotes } from 'react-icons/hi2';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Dashboard() {
  usePageTitle('Inicio');
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apptRes] = await Promise.all([
        api.get('/appointments'),
      ]);
      setAppointments(apptRes.data.data.slice(0, 5)); // últimas 5

      if (isAdmin) {
        const statsRes = await api.get('/admin/stats');
        setStats(statsRes.data.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado) => {
    const classes = {
      PENDIENTE: 'badge-pending',
      CONFIRMADA: 'badge-confirmed',
      CANCELADA: 'badge-cancelled',
      COMPLETADA: 'badge-completed',
    };
    const labels = {
      PENDIENTE: 'Pendiente',
      CONFIRMADA: 'Confirmada',
      CANCELADA: 'Cancelada',
      COMPLETADA: 'Completada',
    };
    return <span className={classes[estado]}>{labels[estado]}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-brand-500 tracking-tighter">
          Hola, {user?.nombre} 👋
        </h1>
        <p className="text-text-secondary font-medium mt-2">
          {isAdmin ? 'Panel de administración estratégica' : 'Bienvenido/a a tu panel de gestión personal'}
        </p>
      </div>

      {/* Stats cards (Admin) */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 shadow-subtle hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-brand-50">
                <HiOutlineUsers className="w-6 h-6 text-brand-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-text-primary tracking-tighter">{stats.resumen.total_usuarios}</p>
            <p className="text-xs font-black uppercase tracking-widest text-text-muted mt-1">Usuarios</p>
          </div>

          <div className="card p-6 shadow-subtle hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-brand-50">
                <HiOutlineScissors className="w-6 h-6 text-brand-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-text-primary tracking-tighter">{stats.resumen.total_servicios}</p>
            <p className="text-xs font-black uppercase tracking-widest text-text-muted mt-1">Servicios activos</p>
          </div>

          <div className="card p-6 shadow-subtle hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-brand-50">
                <HiOutlineBuildingOffice2 className="w-6 h-6 text-brand-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-text-primary tracking-tighter">{stats.resumen.total_recursos}</p>
            <p className="text-xs font-black uppercase tracking-widest text-text-muted mt-1">Espacios Coworking</p>
          </div>

          <div className="card p-6 shadow-subtle hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-accent-50">
                <HiOutlineBanknotes className="w-6 h-6 text-accent-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-text-primary tracking-tighter">{stats.ingresos.mes_actual.toFixed(2)}€</p>
            <p className="text-xs font-black uppercase tracking-widest text-text-muted mt-1">Ingresos del mes</p>
          </div>
        </div>
      )}

      {/* Today summary */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <HiOutlineClock className="w-5 h-5 text-primary-400" />
              <h3 className="font-semibold text-surface-200">Citas hoy</h3>
            </div>
            <p className="text-3xl font-bold text-surface-100">{stats.citas.hoy}</p>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-info" />
              <h3 className="font-semibold text-surface-200">Reservas coworking hoy</h3>
            </div>
            <p className="text-3xl font-bold text-surface-100">{stats.reservas.hoy}</p>
          </div>
        </div>
      )}

      {/* Recent appointments */}
      <div className="card overflow-hidden">
        <div className="p-8 border-b border-border-base bg-white">
          <h2 className="text-xl font-black text-brand-500 tracking-tighter">
            {isAdmin ? 'Últimas Citas' : 'Mis Citas Recientes'}
          </h2>
        </div>
        {appointments.length === 0 ? (
          <div className="p-16 text-center">
            <HiOutlineCalendar className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
            <p className="text-text-secondary font-bold">No tienes citas registradas todavía</p>
          </div>
        ) : (
          <div className="divide-y divide-border-base">
            {appointments.map((cita) => (
              <div key={cita.id} className="p-6 flex items-center justify-between hover:bg-surface-subtle transition-colors group">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                    <HiOutlineScissors className="w-6 h-6 text-brand-500 group-hover:text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{cita.servicio?.nombre}</p>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
                      {cita.empleado?.nombre} {cita.empleado?.apellidos} · {new Date(cita.fecha).toLocaleDateString('es-ES')} · {cita.hora_inicio}
                    </p>
                  </div>
                </div>
                <div className="scale-90 origin-right">
                  {getStatusBadge(cita.estado)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
