import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { HiOutlineCalendar, HiOutlineUsers, HiOutlineScissors, HiOutlineBuildingOffice2, HiOutlineClock, HiOutlineBanknotes } from 'react-icons/hi2';

export default function Dashboard() {
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
    } catch (err) {
      console.error('Error loading dashboard:', err);
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-100">
          Hola, {user?.nombre} 👋
        </h1>
        <p className="text-surface-400 mt-1">
          {isAdmin ? 'Panel de administración' : 'Bienvenido/a a tu panel de reservas'}
        </p>
      </div>

      {/* Stats cards (Admin) */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary-500/10">
                <HiOutlineUsers className="w-6 h-6 text-primary-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-100">{stats.resumen.total_usuarios}</p>
            <p className="text-sm text-surface-400">Usuarios</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-success/10">
                <HiOutlineScissors className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-100">{stats.resumen.total_servicios}</p>
            <p className="text-sm text-surface-400">Servicios activos</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-info/10">
                <HiOutlineBuildingOffice2 className="w-6 h-6 text-info" />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-100">{stats.resumen.total_recursos}</p>
            <p className="text-sm text-surface-400">Espacios Coworking</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-warning/10">
                <HiOutlineBanknotes className="w-6 h-6 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-100">{stats.ingresos.mes_actual.toFixed(2)}€</p>
            <p className="text-sm text-surface-400">Ingresos del mes</p>
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
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-surface-200">
            {isAdmin ? 'Últimas Citas' : 'Mis Citas Recientes'}
          </h2>
        </div>
        {appointments.length === 0 ? (
          <div className="p-12 text-center">
            <HiOutlineCalendar className="w-12 h-12 text-surface-600 mx-auto mb-3" />
            <p className="text-surface-400">No tienes citas todavía</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-800">
            {appointments.map((cita) => (
              <div key={cita.id} className="p-4 flex items-center justify-between hover:bg-surface-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                    <HiOutlineScissors className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-200">{cita.servicio?.nombre}</p>
                    <p className="text-sm text-surface-500">
                      {cita.empleado?.nombre} {cita.empleado?.apellidos} · {new Date(cita.fecha).toLocaleDateString('es-ES')} · {cita.hora_inicio}
                    </p>
                  </div>
                </div>
                {getStatusBadge(cita.estado)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
