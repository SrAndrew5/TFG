import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const r = await api.get('/appointments'); setAppointments(r.data.data); }
    catch { toast.error('Error'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, estado) => {
    try {
      await api.put(`/appointments/${id}/status`, { estado });
      toast.success(`Cita ${estado.toLowerCase()}`);
      load();
    } catch { toast.error('Error'); }
  };

  const getStatusBadge = (estado) => {
    const map = { PENDIENTE: 'badge-pending', CONFIRMADA: 'badge-confirmed', CANCELADA: 'badge-cancelled', COMPLETADA: 'badge-completed' };
    return <span className={map[estado]}>{estado}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-surface-100">Gestión de Citas</h1><p className="text-surface-400 mt-1">{appointments.length} citas totales</p></div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-surface-800">
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Cliente</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Servicio</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Empleado</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Fecha</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Hora</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Estado</th>
            <th className="text-right p-4 text-sm font-semibold text-surface-400">Acciones</th>
          </tr></thead>
          <tbody className="divide-y divide-surface-800">
            {appointments.map((c) => (
              <tr key={c.id} className="hover:bg-surface-800/30 transition-colors">
                <td className="p-4 text-surface-200">{c.usuario?.nombre} {c.usuario?.apellidos}</td>
                <td className="p-4 text-surface-400">{c.servicio?.nombre}</td>
                <td className="p-4 text-surface-400">{c.empleado?.nombre}</td>
                <td className="p-4 text-surface-400">{new Date(c.fecha).toLocaleDateString('es-ES')}</td>
                <td className="p-4 text-surface-400">{c.hora_inicio}-{c.hora_fin}</td>
                <td className="p-4">{getStatusBadge(c.estado)}</td>
                <td className="p-4 text-right space-x-1">
                  {c.estado === 'PENDIENTE' && <>
                    <button onClick={() => updateStatus(c.id, 'CONFIRMADA')} className="btn-success text-xs py-1 px-3">Confirmar</button>
                    <button onClick={() => updateStatus(c.id, 'CANCELADA')} className="btn-danger text-xs py-1 px-3">Cancelar</button>
                  </>}
                  {c.estado === 'CONFIRMADA' && <button onClick={() => updateStatus(c.id, 'COMPLETADA')} className="btn-primary text-xs py-1 px-3">Completar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
