import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  HiOutlinePencilSquare, 
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineBuildingOffice2,
  HiOutlineExclamationTriangle,
  HiOutlineNoSymbol,
  HiOutlineEye
} from 'react-icons/hi2';

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab Filter State
  const [activeTab, setActiveTab] = useState('Todas');
  const tabs = ['Todas', 'Pendientes', 'Confirmadas', 'Canceladas'];
  
  // Action States
  const [processingId, setProcessingId] = useState(null); // Para el botón Aprobar en vivo

  // Estados Modal Editar
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingApt, setEditingApt] = useState(null);
  const [formData, setFormData] = useState({ specialist: '', date: '', time: '' });

  // Estados Danger Modal (Cancelar reserva)
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelingApt, setCancelingApt] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null);

  // Modal Detalles Visual (Ojo)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingApt, setViewingApt] = useState(null);

  // Lista simulada de Especialistas para el selector del Modal
  const SPECIALISTS = ['David Ortega', 'Lucía Fernández', 'Roberto Blanco', 'Clara Santos', 'Sin asignar'];

  // Dummy data inicial
  const DUMMY_APTS = [
    { id: 'RES-001', client: 'Carlos Mendoza', serviceType: 'Peluquería', serviceName: 'Corte Clásico Masculino', specialist: 'David Ortega', date: '2026-04-15', time: '10:00', status: 'PENDIENTE' },
    { id: 'RES-002', client: 'Sofía Navarro', serviceType: 'Peluquería', serviceName: 'Tinte + Mechas Balayage', specialist: 'Lucía Fernández', date: '2026-04-15', time: '12:30', status: 'CONFIRMADA' },
    { id: 'RES-003', client: 'Elena Ramírez', serviceType: 'Coworking', serviceName: 'Sala de Juntas Premium', specialist: 'Roberto Blanco', date: '2026-04-16', time: '09:00', status: 'COMPLETADA' },
    { id: 'RES-004', client: 'Javier Castillo', serviceType: 'Coworking', serviceName: 'Puesto Flex Open Space', specialist: 'Clara Santos', date: '2026-04-17', time: '16:00', status: 'PENDIENTE' },
    { id: 'RES-005', client: 'Marcos Alonso', serviceType: 'Peluquería', serviceName: 'Arreglo de Barba', specialist: 'David Ortega', date: '2026-04-12', time: '11:00', status: 'CANCELADA' },
  ];

  useEffect(() => {
    setTimeout(() => {
      setAppointments(DUMMY_APTS);
      setLoading(false);
    }, 700);
  }, []);

  // ── Lógica de Filtrado por Pestañas ──
  const filteredApts = appointments.filter(apt => {
    if (activeTab === 'Todas') return true;
    if (activeTab === 'Pendientes') return apt.status === 'PENDIENTE';
    if (activeTab === 'Confirmadas') return apt.status === 'CONFIRMADA';
    if (activeTab === 'Canceladas') return apt.status === 'CANCELADA';
    return true;
  });

  // ── Badges de Estado ──
  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDIENTE':
        return <span className="flex items-center gap-1.5 text-xs font-bold text-warning-text bg-warning-bg border border-warning-border px-2.5 py-1 rounded-full w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></div> Pendiente
        </span>;
      case 'CONFIRMADA':
        return <span className="flex items-center gap-1.5 text-xs font-bold text-success-text bg-success-bg border border-success-border px-2.5 py-1 rounded-full w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-success"></div> Confirmada
        </span>;
      case 'COMPLETADA':
        return <span className="flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-1 rounded-full w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div> Completada
        </span>;
      case 'CANCELADA':
        return <span className="flex items-center gap-1.5 text-xs font-bold text-danger-text bg-danger-bg border border-danger-border px-2.5 py-1 rounded-full w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-danger"></div> Cancelada
        </span>;
      default:
        return null;
    }
  };

  // ── Acciones Inline (Aprobar/Completar) ──
  const handleApprove = (id) => {
    setProcessingId(id);
    setTimeout(() => {
      setAppointments(appointments.map(apt => apt.id === id ? { ...apt, status: 'CONFIRMADA' } : apt));
      setProcessingId(null);
      toast.success('Reserva confirmada exitosamente');
    }, 800);
  };

  const handleComplete = (id) => {
    setProcessingId(id);
    setTimeout(() => {
      setAppointments(appointments.map(apt => apt.id === id ? { ...apt, status: 'COMPLETADA' } : apt));
      setProcessingId(null);
      toast.success('Servicio completado exitosamente');
    }, 800);
  };

  // ── Modales de Edición ──
  const openEditModal = (apt) => {
    setEditingApt(apt);
    setFormData({ specialist: apt.specialist, date: apt.date, time: apt.time });
    setEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setTimeout(() => {
      setAppointments(appointments.map(apt => apt.id === editingApt.id ? { ...apt, ...formData } : apt));
      setSavingEdit(false);
      setEditModalOpen(false);
      toast.success('Datos de la reserva actualizados');
    }, 1000);
  };

  // ── Modales de Cancelación (Soft Delete) ──
  const RequestCancel = (apt) => {
    setItemToCancel(apt);
    setCancelModalOpen(true);
  };

  const executeCancel = () => {
    setCancelingApt(true);
    setTimeout(() => {
      setAppointments(appointments.map(apt => apt.id === itemToCancel.id ? { ...apt, status: 'CANCELADA' } : apt));
      setCancelingApt(false);
      setCancelModalOpen(false);
      toast.success('Reserva cancelada correctamente');
      setItemToCancel(null);
    }, 1000);
  };

  const handleOpenDetails = (apt) => {
    setViewingApt(apt);
    setDetailsModalOpen(true);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            Gestión de Reservas
          </h1>
          <p className="text-text-secondary">Controla el flujo de citas y coworking en tiempo real.</p>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">
        
        {/* Pestañas (Tabs) Navbar */}
        <div className="border-b border-border-base px-4 flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 whitespace-nowrap text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-brand-500 text-brand-600' 
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-surface-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="table-wrapper relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/50 text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-2 w-16 whitespace-nowrap text-xs">ID</th>
                <th className="font-bold py-4 px-2 w-28 whitespace-nowrap text-xs">Cliente</th>
                <th className="font-bold py-4 px-2 w-36 whitespace-nowrap text-xs">Servicio</th>
                <th className="font-bold py-4 px-2 w-28 whitespace-nowrap text-xs">Especialista</th>
                <th className="font-bold py-4 px-2 w-28 whitespace-nowrap text-xs">Fecha/Hora</th>
                <th className="font-bold py-4 px-2 w-20 whitespace-nowrap text-xs">Estado</th>
                <th className="font-bold py-4 px-2 text-right whitespace-nowrap min-w-[150px] text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredApts.map((apt) => (
                <tr key={apt.id} className="hover:bg-surface-elevated/50 transition-colors group">
                  
                  {/* ID Reserva */}
                  <td className="py-3 px-2 whitespace-nowrap">
                    <p className="font-extrabold text-text-primary text-xs tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {apt.id}
                    </p>
                  </td>

                  {/* Cliente */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2 max-w-[120px]">
                       <div className="w-6 h-6 shrink-0 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-[10px] border border-brand-100">
                         {apt.client.charAt(0)}
                       </div>
                       <p className="font-semibold text-text-secondary text-xs truncate leading-tight">{apt.client}</p>
                    </div>
                  </td>

                  {/* Servicio */}
                  <td className="py-3 px-2 max-w-[140px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className={`shrink-0 p-1 rounded-md ${apt.serviceType === 'Coworking' ? 'bg-brand-50 text-brand-500' : 'bg-accent-50 text-accent-500'}`}>
                        {apt.serviceType === 'Coworking' ? <HiOutlineBuildingOffice2 className="w-3.5 h-3.5"/> : <HiOutlineUser className="w-3.5 h-3.5"/>}
                      </div>
                      <p className="font-semibold text-text-primary text-[11px] truncate leading-tight">{apt.serviceName}</p>
                    </div>
                  </td>

                  {/* Especialista */}
                  <td className="py-3 px-2 max-w-[110px]">
                    <p className="text-xs font-medium text-text-muted truncate leading-tight">{apt.specialist}</p>
                  </td>

                  {/* Fecha / Hora */}
                  <td className="py-3 px-2 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                       <span className="flex items-center text-xs text-text-secondary font-semibold">
                         <HiOutlineCalendar className="w-3 h-3 mr-1 text-text-muted shrink-0" />
                         {new Date(apt.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                       </span>
                       <span className="flex items-center text-[11px] text-text-muted font-medium">
                         <HiOutlineClock className="w-3 h-3 mr-1 shrink-0" />
                         {apt.time}
                       </span>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-2 whitespace-nowrap">
                    {getStatusBadge(apt.status)}
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-2 text-right whitespace-nowrap min-w-[150px]">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                      
                      {/* Botón Aprobar */}
                      {apt.status === 'PENDIENTE' && (
                        <button 
                          onClick={() => handleApprove(apt.id)}
                          disabled={processingId === apt.id}
                          className="w-8 h-8 rounded-lg bg-success-bg text-success-text hover:bg-[#A7F3D0] flex items-center justify-center transition-all" 
                          title="Aprobar reserva"
                        >
                          {processingId === apt.id ? <div className="w-4 h-4 rounded-full border-2 border-success border-t-transparent animate-spin" /> : <HiOutlineCheck className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Botón Completar (Tick índigo para confirmadas) */}
                      {apt.status === 'CONFIRMADA' && (
                        <button 
                          onClick={() => handleComplete(apt.id)}
                          disabled={processingId === apt.id}
                          className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 flex items-center justify-center transition-all" 
                          title="Marcar como Completada"
                        >
                          {processingId === apt.id ? <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /> : <HiOutlineCheck className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Botón Detalles Visual (Ojo) */}
                      <button 
                        onClick={() => handleOpenDetails(apt)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-surface-elevated text-text-secondary flex items-center justify-center transition-all shadow-xs" 
                        title="Ver detalles"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>

                      {/* Botón Editar (Solo Confirmadas) */}
                      {apt.status === 'CONFIRMADA' && (
                        <button 
                          onClick={() => openEditModal(apt)}
                          className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-text-secondary flex items-center justify-center transition-all shadow-xs"
                          title="Reasignar o Cambiar Fecha"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                      )}

                      {/* Botón Cancelar */}
                      {(apt.status === 'PENDIENTE' || apt.status === 'CONFIRMADA') && (
                        <button 
                          onClick={() => RequestCancel(apt)}
                          className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-danger-bg hover:text-danger-text hover:border-danger-border text-text-secondary flex items-center justify-center transition-all shadow-xs"
                          title="Cancelar reserva"
                        >
                          <HiOutlineXMark className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredApts.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4 text-text-muted">
                <HiOutlineCalendar className="w-8 h-8" />
              </div>
              <p className="text-text-primary font-bold mb-1">Cero resultados</p>
              <p className="text-text-muted text-sm">No existen reservas bajo este filtro o estado.</p>
            </div>
          )}
        </div>
      </div>


      {/* ── Modal de Edición (Reasignar y Reprogramar) ── */}
      {editModalOpen && editingApt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => !savingEdit && setEditModalOpen(false)}></div>
          
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-xl w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            
            <div className="px-8 py-6 border-b border-border-base bg-gradient-to-b from-surface-subtle/80 to-white flex justify-between items-center relative">
               <div>
                <h2 className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Ajustes de Reserva
                </h2>
                <p className="text-xs text-text-secondary font-medium tracking-wide mt-1">REASIGNAR O REPROGRAMAR</p>
              </div>
              <button onClick={() => !savingEdit && setEditModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors flex-shrink-0">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-8 space-y-6">

                {/* Info no editable de contexto */}
                <div className="bg-surface-elevated p-4 rounded-xl border border-border-base/50">
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-2">Detalles del Servicio</p>
                  <p className="text-sm font-bold text-text-primary">{editingApt.serviceName}</p>
                  <p className="text-xs text-text-secondary mt-1">Cliente: {editingApt.client} • {editingApt.id}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Especialista Asignado</label>
                  <select required value={formData.specialist} onChange={e => setFormData({...formData, specialist: e.target.value})} className="input-field py-3 text-text-primary font-medium appearance-none">
                    {SPECIALISTS.map(spec => (
                       <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Fecha</label>
                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-field py-3 font-semibold text-text-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Hora</label>
                    <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="input-field py-3 font-semibold text-text-primary" />
                  </div>
                </div>

              </div>

              <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end gap-3">
                <button type="button" onClick={() => setEditModalOpen(false)} disabled={savingEdit} className="btn-secondary bg-white border-border-strong px-6 py-3">Volver</button>
                <button type="submit" disabled={savingEdit} className="btn-primary flex items-center justify-center py-3 px-8">
                  {savingEdit ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><HiOutlineCheck className="w-5 h-5 mr-2" /> Actualizar Cita </>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Danger Modal para Confirmación de Cancelación ── */}
      {cancelModalOpen && itemToCancel && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => !cancelingApt && setCancelModalOpen(false)}></div>
          
          <div className="inline-block bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in overflow-hidden border border-border-base/50 p-8 text-center text-left align-middle transition-all transform">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_4px_24px_rgba(239,68,68,0.25)]">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Cancelar Reserva
            </h3>
            
            <p className="text-sm text-text-secondary mb-8">
              ¿Seguro que deseas cancelar la reserva de <strong>{itemToCancel.client}</strong>? La cita pasará a estar inactiva y se enviará una notificación automática al usuario por email.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button 
                type="button" 
                onClick={() => setCancelModalOpen(false)} 
                disabled={cancelingApt} 
                className="w-full btn-secondary bg-surface-elevated hover:bg-surface-300 border-transparent py-3 text-sm font-bold"
              >
                Cerrar
              </button>
              <button 
                type="button" 
                onClick={executeCancel} 
                disabled={cancelingApt} 
                className="w-full btn-danger flex items-center justify-center py-3 text-sm font-bold tracking-wide transition-colors duration-200"
              >
                {cancelingApt ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sí, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Modal de Detalles Visual (Ojo) ── */}
      {detailsModalOpen && viewingApt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setDetailsModalOpen(false)}></div>
          
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-md w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            <div className="px-8 py-6 border-b border-border-base bg-gradient-to-b from-surface-subtle/80 to-white flex justify-between items-center relative">
               <div>
                <h2 className="text-xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Detalles de la Cita
                </h2>
                <p className="text-xs text-text-secondary font-medium tracking-wide mt-1">{viewingApt.id}</p>
              </div>
              <button onClick={() => setDetailsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors flex-shrink-0">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <div className="flex justify-between items-center border-b border-border-base pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Cliente</span>
                <span className="text-sm font-semibold text-text-primary">{viewingApt.client}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border-base pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Servicio ({viewingApt.serviceType})</span>
                <span className="text-sm font-semibold text-text-primary">{viewingApt.serviceName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border-base pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Especialista / Sala</span>
                <span className="text-sm font-semibold text-text-primary">{viewingApt.specialist}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border-base">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Cuándo</span>
                <div className="text-right">
                  <span className="block text-sm font-semibold text-text-primary">{new Date(viewingApt.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="block text-xs font-medium text-text-muted">{viewingApt.time}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Estado actual</span>
                {getStatusBadge(viewingApt.status)}
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
