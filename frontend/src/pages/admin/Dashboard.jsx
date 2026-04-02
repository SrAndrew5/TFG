import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Estados de interactividad interactividad
  const [reservas, setReservas] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  
  // Modal Detalles
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingReserva, setViewingReserva] = useState(null);

  // Dummy Admin Stats para UI
  const DUMMY_STATS = {
    ingresos: { amount: '4,250.00', trend: '+12.5%', isUp: true },
    reservas: { amount: '156', trend: '+8.2%', isUp: true },
    usuarios: { amount: '2,045', trend: '+2.1%', isUp: true },
    cancelacion: { amount: '3.4%', trend: '-0.5%', isUp: true } // isUp true implies good trend here (red means bad)
  };

  const DUMMY_RESERVAS = [
    { id: '#REV-092', user: 'Ana Martínez', service: 'Corte de Pelo + Peinado', date: 'Hoy, 16:30', amount: '25.00€', status: 'PENDIENTE', employee: 'David Ortega' },
    { id: '#REV-091', user: 'Carlos Ruiz', service: 'Sala de Juntas (Coworking)', date: 'Hoy, 12:00', amount: '45.00€', status: 'CONFIRMADA', employee: 'Sin asignar' },
    { id: '#REV-090', user: 'María López', service: 'Puesto Flex', date: 'Ayer, 09:00', amount: '15.00€', status: 'COMPLETADA', employee: 'Sin asignar' },
    { id: '#REV-089', user: 'Javier Gil', service: 'Afeitado Clásico', date: 'Ayer, 18:15', amount: '18.00€', status: 'CANCELADA', employee: 'Lucía Fernández' },
    { id: '#REV-088', user: 'Laura Torres', service: 'Tinte + Mechas Balayage', date: '10 May, 11:30', amount: '65.00€', status: 'CONFIRMADA', employee: 'Clara Santos' },
  ];

  useEffect(() => {
    setReservas(DUMMY_RESERVAS);
  }, []);

  const handleApprove = (id) => {
    setProcessingId(id);
    setTimeout(() => {
      setReservas(reservas.map(res => res.id === id ? { ...res, status: 'CONFIRMADA' } : res));
      setProcessingId(null);
      toast.success('Reserva confirmada exitosamente');
    }, 500);
  };

  const handleOpenDetails = (reserva) => {
    setViewingReserva(reserva);
    setDetailsModalOpen(true);
  };

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

        {/* KPI 2 - ENLACE A RESERVAS */}
        <div onClick={() => navigate('/admin/appointments')} className="bg-white p-6 rounded-2xl shadow-sm border border-border-base relative overflow-hidden group cursor-pointer hover:border-brand-300 hover:shadow-md transition-all">
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

        {/* KPI 3 - ENLACE A USUARIOS */}
        <div onClick={() => navigate('/admin/users')} className="bg-white p-6 rounded-2xl shadow-sm border border-border-base relative overflow-hidden group cursor-pointer hover:border-brand-300 hover:shadow-md transition-all">
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
          <button onClick={() => navigate('/admin/appointments')} className="btn-secondary whitespace-nowrap text-xs">
            Ver todas las reservas
          </button>
        </div>

        <div className="table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/50 text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-2 w-16 whitespace-nowrap text-xs">ID</th>
                <th className="font-bold py-4 px-2 w-28 whitespace-nowrap text-xs">Usuario</th>
                <th className="font-bold py-4 px-2 w-32 whitespace-nowrap text-xs">Servicio/Espacio</th>
                <th className="font-bold py-4 px-2 w-28 whitespace-nowrap text-xs">Fecha/Hora</th>
                <th className="font-bold py-4 px-2 w-20 whitespace-nowrap text-xs">Precio</th>
                <th className="font-bold py-4 px-2 w-20 whitespace-nowrap text-xs">Estado</th>
                <th className="table-cell-action pr-2 text-xs">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {reservas.map((reserva, idx) => (
                <tr key={idx} className="hover:bg-surface-subtle transition-colors group">
                  <td className="py-3 px-2 font-semibold text-text-primary text-xs whitespace-nowrap">
                    {reserva.id}
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary">
                    <div className="flex items-center gap-2 max-w-[110px]">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[10px] uppercase">
                        {reserva.user.charAt(0)}
                      </div>
                      <span className="font-medium text-text-primary truncate">{reserva.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary max-w-[120px] truncate leading-tight">
                    {reserva.service}
                  </td>
                  <td className="py-3 px-2 text-xs text-text-secondary whitespace-nowrap">
                    {reserva.date}
                  </td>
                  <td className="py-3 px-2 text-xs font-bold text-text-primary whitespace-nowrap">
                    {reserva.amount}
                  </td>
                  <td className="py-3 px-2 whitespace-nowrap">
                    {getStatusBadge(reserva.status)}
                  </td>
                  <td className="table-cell-action pr-2 min-w-[100px]">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                      {reserva.status === 'PENDIENTE' && (
                         <button 
                           onClick={() => handleApprove(reserva.id)}
                           disabled={processingId === reserva.id}
                           className="w-8 h-8 rounded-lg bg-success-bg text-success-text hover:bg-[#A7F3D0] flex items-center justify-center transition-colors" 
                           title="Confirmar"
                         >
                           {processingId === reserva.id ? (
                             <div className="w-4 h-4 rounded-full border-2 border-success border-t-transparent animate-spin" />
                           ) : (
                             <HiOutlineCheck className="w-4 h-4" />
                           )}
                         </button>
                      )}
                      <button onClick={() => handleOpenDetails(reserva)} className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-300 text-text-secondary flex items-center justify-center transition-colors" title="Ver detalles">
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {reservas.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">
              No se encontraron registros recientes.
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de Detalles Visual (Ojo) ── */}
      {detailsModalOpen && viewingReserva && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setDetailsModalOpen(false)}></div>
          
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-md w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            <div className="px-8 py-6 border-b border-border-base bg-gradient-to-b from-surface-subtle/80 to-white flex justify-between items-center relative">
               <div>
                <h2 className="text-xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Detalles de la Reserva
                </h2>
                <p className="text-xs text-text-secondary font-medium tracking-wide mt-1">{viewingReserva.id}</p>
              </div>
              <button onClick={() => setDetailsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors flex-shrink-0">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <div className="flex justify-between items-center border-b border-border-base pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Cliente</span>
                <span className="text-sm font-semibold text-text-primary">{viewingReserva.user}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border-base pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Servicio</span>
                <span className="text-sm font-semibold text-text-primary">{viewingReserva.service}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border-base pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Especialista</span>
                <span className="text-sm font-semibold text-text-primary">{viewingReserva.employee || 'Sin asignar'}</span>
              </div>
              <div className="flex justify-between items-center pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Estado actual</span>
                {getStatusBadge(viewingReserva.status)}
              </div>
            </div>

            <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end">
              <button type="button" onClick={() => setDetailsModalOpen(false)} className="btn-secondary bg-white border-border-strong px-6 py-3">
                Cerrar panel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
