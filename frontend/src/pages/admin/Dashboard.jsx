import { useState, useEffect } from 'react';
import { 
  HiOutlineBanknotes, 
  HiOutlineCalendar, 
  HiOutlineUsers, 
  HiOutlineXCircle,
  HiOutlineArrowUpRight,
  HiOutlineArrowDownRight,
  HiOutlineEllipsisVertical,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineXMark
} from 'react-icons/hi2';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false); // Simulate loading state

  // Dummy Admin Stats para UI
  const DUMMY_STATS = {
    ingresos: { amount: '4,250.00', trend: '+12.5%', isUp: true },
    reservas: { amount: '156', trend: '+8.2%', isUp: true },
    usuarios: { amount: '2,045', trend: '+2.1%', isUp: true },
    cancelacion: { amount: '3.4%', trend: '-0.5%', isUp: true } // isUp true implies good trend here (red means bad)
  };

  const DUMMY_RESERVAS = [
    { id: '#REV-092', user: 'Ana Martínez', service: 'Corte de Pelo + Peinado', date: 'Hoy, 16:30', amount: '25.00€', status: 'PENDIENTE' },
    { id: '#REV-091', user: 'Carlos Ruiz', service: 'Sala de Juntas (Coworking)', date: 'Hoy, 12:00', amount: '45.00€', status: 'CONFIRMADA' },
    { id: '#REV-090', user: 'María López', service: 'Puesto Flex', date: 'Ayer, 09:00', amount: '15.00€', status: 'COMPLETADA' },
    { id: '#REV-089', user: 'Javier Gil', service: 'Afeitado Clásico', date: 'Ayer, 18:15', amount: '18.00€', status: 'CANCELADA' },
    { id: '#REV-088', user: 'Laura Torres', service: 'Tinte + Mechas Balayage', date: '10 May, 11:30', amount: '65.00€', status: 'CONFIRMADA' },
  ];

  const getStatusBadge = (estado) => {
    const map = { 
      PENDIENTE: 'badge-pending', 
      CONFIRMADA: 'badge-confirmed', 
      CANCELADA: 'badge-cancelled', 
      COMPLETADA: 'badge-completed' 
    };
    const labels = {
      PENDIENTE: 'Pdte.',
      CONFIRMADA: 'Conf.',
      CANCELADA: 'Canc.',
      COMPLETADA: 'Comp.'
    };
    return (
      <span className={`badge px-3 py-1.5 rounded-full uppercase tracking-wider text-[10px] ${map[estado]}`}>
        {labels[estado]} // o {estado} truncado
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* ── KPIs (Tarjetas Superiores) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-base relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <HiOutlineBanknotes className="w-24 h-24 text-brand-500" />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <HiOutlineBanknotes className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowUpRight className="w-3 h-3" /> {DUMMY_STATS.ingresos.trend}
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Ingresos de Mes</p>
          <p className="text-3xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            {DUMMY_STATS.ingresos.amount}€
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-base relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-info-bg flex items-center justify-center text-info-text">
              <HiOutlineCalendar className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowUpRight className="w-3 h-3" /> {DUMMY_STATS.reservas.trend}
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Nuevas Reservas</p>
          <p className="text-3xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            {DUMMY_STATS.reservas.amount}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-base relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center text-accent-600">
              <HiOutlineUsers className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowUpRight className="w-3 h-3" /> {DUMMY_STATS.usuarios.trend}
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Usuarios Activos</p>
          <p className="text-3xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            {DUMMY_STATS.usuarios.amount}
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-base relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-danger-bg flex items-center justify-center text-danger-text">
              <HiOutlineXCircle className="w-5 h-5" />
            </div>
            {/* Tasa bajando es bueno */}
            <span className="flex items-center gap-1 text-xs font-bold text-success-text bg-success-bg px-2 py-1 rounded-md">
              <HiOutlineArrowDownRight className="w-3 h-3" /> {DUMMY_STATS.cancelacion.trend}
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Tasa Cancelación</p>
          <p className="text-3xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            {DUMMY_STATS.cancelacion.amount}
          </p>
        </div>
      </div>

      {/* ── Tabla de Resumen ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border-base flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>Últimas Reservas</h2>
            <p className="text-sm text-text-secondary">Se muestran las 5 reservas creadas recientemente hoy.</p>
          </div>
          <button className="btn-secondary whitespace-nowrap text-xs">
            Ver todas las reservas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/50 text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-6 md:px-8">ID Reserva</th>
                <th className="font-bold py-4 px-6 md:px-8">Usuario</th>
                <th className="font-bold py-4 px-6 md:px-8">Servicio/Espacio</th>
                <th className="font-bold py-4 px-6 md:px-8">Fecha/Hora</th>
                <th className="font-bold py-4 px-6 md:px-8">Precio</th>
                <th className="font-bold py-4 px-6 md:px-8">Estado</th>
                <th className="font-bold py-4 px-6 md:px-8 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {DUMMY_RESERVAS.map((reserva, idx) => (
                <tr key={idx} className="hover:bg-surface-subtle transition-colors group">
                  <td className="py-4 px-6 md:px-8 font-semibold text-text-primary text-sm whitespace-nowrap">
                    {reserva.id}
                  </td>
                  <td className="py-4 px-6 md:px-8 text-sm text-text-secondary whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs uppercase">
                        {reserva.user.charAt(0)}
                      </div>
                      <span className="font-medium text-text-primary">{reserva.user}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 md:px-8 text-sm text-text-secondary whitespace-nowrap">
                    {reserva.service}
                  </td>
                  <td className="py-4 px-6 md:px-8 text-sm text-text-secondary whitespace-nowrap">
                    {reserva.date}
                  </td>
                  <td className="py-4 px-6 md:px-8 text-sm font-bold text-text-primary whitespace-nowrap">
                    {reserva.amount}
                  </td>
                  <td className="py-4 px-6 md:px-8 whitespace-nowrap">
                    {getStatusBadge(reserva.status)}
                  </td>
                  <td className="py-4 px-6 md:px-8 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {reserva.status === 'PENDIENTE' && (
                         <button className="w-8 h-8 rounded-lg bg-success-bg text-success-text hover:bg-[#A7F3D0] flex items-center justify-center transition-colors" title="Confirmar">
                           <HiOutlineCheck className="w-4 h-4" />
                         </button>
                      )}
                      <button className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-300 text-text-secondary flex items-center justify-center transition-colors">
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-300 text-text-secondary flex items-center justify-center transition-colors">
                        <HiOutlineEllipsisVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {DUMMY_RESERVAS.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">
              No se encontraron registros recientes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
