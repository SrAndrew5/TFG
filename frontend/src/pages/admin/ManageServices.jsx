import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlinePencilSquare, 
  HiOutlineTrash, 
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineFunnel,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Modal de Crear/Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Estados Formulario Modal
  const [formData, setFormData] = useState({ name: '', category: '', price: '', duration: '', active: true });
  
  // Estados para Modal de Borrado (Danger Modal)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Dummy data initial load
  const DUMMY_SERVICES = [
    { id: 1, name: 'Corte Clásico Masculino', category: 'Peluquería', price: '18.00', duration: 30, active: true },
    { id: 2, name: 'Puesto Flex Open Space', category: 'Coworking', price: '15.00', duration: 1440, active: true },
    { id: 3, name: 'Sala de Juntas Premium', category: 'Coworking', price: '45.00', duration: 60, active: true },
    { id: 4, name: 'Tinte + Mechas Balayage', category: 'Peluquería', price: '65.00', duration: 120, active: false }
  ];

  useEffect(() => {
    setTimeout(() => {
      setServices(DUMMY_SERVICES);
      setLoading(false);
    }, 600);
  }, []);

  // ── Helpers de Edición ──
  const openCreateModal = () => {
    setEditingService(null);
    setFormData({ name: '', category: '', price: '', duration: '', active: true });
    setModalOpen(true);
  };

  const openEditModal = (svc) => {
    setEditingService(svc);
    setFormData({ 
      name: svc.name, 
      category: svc.category.toLowerCase(), // Normaliza value del select
      price: svc.price, 
      duration: svc.duration, 
      active: svc.active 
    });
    setModalOpen(true);
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setModalOpen(false);
      toast.success(editingService ? 'Servicio actualizado' : 'Servicio creado correctamente');
      
      // Simulación de actualización de la UI
      if (editingService) {
        setServices(services.map(s => s.id === editingService.id ? { ...s, ...formData, category: formData.category === 'coworking' ? 'Coworking' : 'Peluquería' } : s));
      } else {
        const newSvc = { id: Date.now(), ...formData, category: formData.category === 'coworking' ? 'Coworking' : 'Peluquería' };
        setServices([newSvc, ...services]);
      }
    }, 1000);
  };

  // ── Helpers de Borrado ──
  const confirmDelete = (svc) => {
    setItemToDelete(svc);
    setDeleteModalOpen(true);
  };

  const executeDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      setServices(services.filter(s => s.id !== itemToDelete.id));
      setDeleting(false);
      setDeleteModalOpen(false);
      toast.success('Servicio eliminado exitosamente');
      setItemToDelete(null);
    }, 1000);
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
            Catálogo de Servicios
          </h1>
          <p className="text-text-secondary">Gestiona los espacios y ofertas disponibles.</p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="btn-primary py-3 px-6 shadow-brand hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <HiOutlinePlus className="w-5 h-5 border-2 border-white rounded-md p-0.5" />
          Nuevo Servicio
        </button>
      </div>

      {/* Tabla Pro */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">
        
        <div className="p-4 border-b border-border-base bg-surface-subtle/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-brand-200/50">
              {services.length} Total
            </span>
          </div>
          <button className="text-text-muted hover:text-brand-600 transition-colors p-2 rounded-lg hover:bg-brand-50">
            <HiOutlineFunnel className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-3 whitespace-nowrap max-w-[200px]">Servicio</th>
                <th className="font-bold py-4 px-3 w-32 whitespace-nowrap">Categoría</th>
                <th className="font-bold py-4 px-3 w-28 whitespace-nowrap">Precio Base</th>
                <th className="font-bold py-4 px-3 w-28 whitespace-nowrap">Estado</th>
                <th className="table-cell-action pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {services.map((svc) => (
                <tr key={svc.id} className="hover:bg-surface-elevated/50 transition-colors group">
                  <td className="py-4 px-3 max-w-[200px] truncate">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl shadow-xs border border-border-base ${svc.category === 'Coworking' ? 'bg-brand-50 text-brand-500' : 'bg-accent-50 text-accent-500'}`}>
                        {svc.category === 'Coworking' ? '🏢' : '✂️'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text-primary text-sm truncate" style={{ fontFamily: 'Sora, sans-serif' }}>{svc.name}</p>
                        <p className="text-xs text-text-muted font-medium mt-0.5">{svc.duration} min</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${svc.category === 'Coworking' ? 'bg-brand-100 text-brand-800' : 'bg-accent-100 text-accent-800'}`}>
                      {svc.category}
                    </span>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    <p className="font-extrabold text-text-primary text-sm">{parseFloat(svc.price).toFixed(2)}€</p>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    {svc.active ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-success-text bg-success-bg px-2.5 py-1 rounded-full w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted bg-surface-300 px-2.5 py-1 rounded-full w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span> Pausado
                      </span>
                    )}
                  </td>
                  <td className="table-cell-action pr-3">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(svc)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-text-secondary flex items-center justify-center transition-all shadow-xs"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => confirmDelete(svc)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-danger-bg hover:text-danger-text hover:border-danger-border text-text-secondary flex items-center justify-center transition-all shadow-xs"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {services.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4 text-text-muted">
                <HiOutlineSparkles className="w-8 h-8" />
              </div>
              <p className="text-text-primary font-bold mb-1">Aún no hay servicios</p>
              <p className="text-text-muted text-sm">Comienza creando tu primera oferta de negocio.</p>
            </div>
          )}
        </div>
      </div>


      {/* ── Modal de Crear/Editar Servicio ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => !saving && setModalOpen(false)}></div>
          
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-xl w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            <div className="px-8 py-6 border-b border-border-base bg-gradient-to-b from-surface-subtle/80 to-white flex justify-between items-center relative">
              <div className="bg-brand-50 w-12 h-12 rounded-2xl flex items-center justify-center border border-brand-100 shadow-sm mr-4">
                {editingService ? <HiOutlinePencilSquare className="w-6 h-6 text-brand-600" /> : <HiOutlinePlus className="w-6 h-6 text-brand-600" />}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {editingService ? 'Editar Servicio' : 'Añadir Servicio'}
                </h2>
                <p className="text-xs text-text-secondary font-medium tracking-wide mt-1">NUESTRA OFERTA DE NEGOCIO</p>
              </div>
              <button onClick={() => !saving && setModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors flex-shrink-0">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit}>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Nombre del servicio/espacio</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Corte Degradado Premium" className="input-field py-3 font-semibold text-text-primary" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Familia</label>
                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field py-3 text-text-secondary font-medium appearance-none">
                      <option value="" disabled>Selecciona...</option>
                      <option value="coworking">Coworking</option>
                      <option value="peluqueria">Peluquería</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Duración (Mins)</label>
                    <input required type="number" min="0" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="60" className="input-field py-3 font-semibold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">Precio Base (€)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">€</span>
                      <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="input-field py-3 pl-9 font-extrabold text-brand-700 bg-brand-50/50 border-brand-200 focus:ring-brand-100" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-3 cursor-pointer p-3 border border-border-base rounded-xl hover:bg-surface-subtle transition-colors">
                      <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-5 h-5 rounded border-border-strong text-brand-500 focus:ring-brand-500 transition-all" />
                      <div>
                        <span className="block text-sm font-bold text-text-primary">Activo al instante</span>
                        <span className="block text-xs text-text-muted">Visible para usuarios</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-secondary bg-white border-border-strong px-6 py-3">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary w-48 flex items-center justify-center py-3">
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><HiOutlineCheck className="w-5 h-5 mr-2" /> {editingService ? 'Actualizar' : 'Crear Servicio'} </>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Danger Modal para Confirmación de Borrado ── */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => !deleting && setDeleteModalOpen(false)}></div>
          
          <div className="inline-block bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in overflow-hidden border border-border-base/50 p-8 text-center text-left align-middle transition-all transform">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_4px_24px_rgba(239,68,68,0.25)]">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Eliminar Servicio
            </h3>
            
            <p className="text-sm text-text-secondary mb-8">
              ¿Estás seguro de que deseas eliminar <strong>"{itemToDelete.name}"</strong>? Esta acción borrará el registro y no se puede deshacer.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button 
                type="button" 
                onClick={() => setDeleteModalOpen(false)} 
                disabled={deleting} 
                className="w-full btn-secondary bg-surface-elevated hover:bg-surface-300 border-transparent py-3 text-sm font-bold"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={executeDelete} 
                disabled={deleting} 
                className="w-full btn-danger flex items-center justify-center py-3 text-sm font-bold tracking-wide transition-colors duration-200"
              >
                {deleting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
