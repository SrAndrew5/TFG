import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  HiOutlineUserPlus, 
  HiOutlinePencilSquare, 
  HiOutlineTrash, 
  HiOutlineXMark,
  HiOutlineUsers,
  HiOutlineCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineExclamationTriangle,
  HiOutlineBriefcase,
  HiOutlineSun
} from 'react-icons/hi2';

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para Modal de Crear/Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);

  // Estados Formulario Modal
  const [formData, setFormData] = useState({ name: '', email: '', specialty: 'Peluquero Senior', status: 'Activo', photoRaw: '' });
  
  // Estados para Modal de Borrado (Danger Modal)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Dummy data initial load
  const DUMMY_EMP = [
    { id: 1, name: 'David Ortega', email: 'david.ortega@gmail.com', specialty: 'Estilista Principal', status: 'Activo', photo: 'https://i.pravatar.cc/150?img=11' },
    { id: 2, name: 'Lucía Fernández', email: 'lucia.fernandez@empresa.com', specialty: 'Colorista Pro', status: 'Vacaciones', photo: 'https://i.pravatar.cc/150?img=5' },
    { id: 3, name: 'Roberto Blanco', email: 'roberto.bl@gmail.com', specialty: 'Gestor Coworking', status: 'Activo', photo: 'https://i.pravatar.cc/150?img=12' },
    { id: 4, name: 'Clara Santos', email: 'clara.santos@empresa.com', specialty: 'Recepción y Dudas', status: 'Activo', photo: 'https://i.pravatar.cc/150?img=9' }
  ];

  useEffect(() => {
    setTimeout(() => {
      setEmployees(DUMMY_EMP);
      setLoading(false);
    }, 600);
  }, []);

  // ── Lógica de Filtrado Local ──
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Helpers de Edición ──
  const openCreateModal = () => {
    setEditingEmp(null);
    setFormData({ name: '', email: '', specialty: 'Peluquero Senior', status: 'Activo', photoRaw: '' });
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingEmp(emp);
    setFormData({ 
      name: emp.name, 
      email: emp.email, 
      specialty: emp.specialty,
      status: emp.status,
      photoRaw: emp.photo 
    });
    setModalOpen(true);
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setModalOpen(false);
      toast.success(editingEmp ? 'Perfil actualizado' : 'Empleado registrado con éxito');
      
      const newPhoto = formData.photoRaw || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;

      if (editingEmp) {
        setEmployees(employees.map(u => u.id === editingEmp.id ? { ...u, ...formData, photo: newPhoto } : u));
      } else {
        const newEmp = { id: Date.now(), ...formData, photo: newPhoto };
        setEmployees([newEmp, ...employees]);
      }
    }, 1000);
  };

  // ── Helpers de Borrado Definitive (No Soft Delete, Despido Real) ──
  const confirmDelete = (emp) => {
    setItemToDelete(emp);
    setDeleteModalOpen(true);
  };

  const executeDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      setEmployees(employees.filter(u => u.id !== itemToDelete.id));
      setDeleting(false);
      setDeleteModalOpen(false);
      toast.success('Empleado removido del sistema');
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
            Nuestro Equipo
          </h1>
          <p className="text-text-secondary">Gestiona los especialistas y asigna disponibilidades.</p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="btn-primary py-3 px-6 shadow-brand hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <HiOutlineUserPlus className="w-5 h-5 border-2 border-white rounded-md p-0.5" />
          Añadir Empleado
        </button>
      </div>

      {/* Tabla Pro */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden relative">
        
        {/* Table Toolbar / Buscador */}
        <div className="p-4 border-b border-border-base bg-surface-subtle/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-80">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o especialidad..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-strong rounded-xl text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-50 outline-none transition-all placeholder-text-muted text-text-primary font-medium"
            />
          </div>
          <span className="bg-surface-elevated text-text-muted text-xs font-bold px-3 py-1.5 rounded-lg border border-border-strong">
            {filteredEmployees.length} Empleados
          </span>
        </div>

        <div className="table-container">
          <table className="table-pro">
            <thead>
              <tr className="bg-surface-subtle text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-6 whitespace-nowrap">Empleado</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Email Contacto</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Especialización</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Estado (Disponibilidad)</th>
                <th className="table-cell-action">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-surface-elevated/50 transition-colors group">
                  
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar Real Redondo */}
                      <div className="w-10 h-10 rounded-full shadow-xs border border-border-strong overflow-hidden bg-surface-300 flex-shrink-0">
                        <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="font-bold text-text-primary text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {emp.name}
                      </p>
                    </div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <p className="text-sm font-medium text-text-secondary">{emp.email}</p>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineBriefcase className="w-4 h-4 text-brand-500" />
                      <p className="text-sm font-bold text-text-primary">{emp.specialty}</p>
                    </div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    {emp.status === 'Activo' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-1.5 rounded-xl w-fit">
                        <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></div> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-warning-text bg-warning-bg border border-warning-border px-2.5 py-1.5 rounded-xl w-fit">
                        <HiOutlineSun className="w-4 h-4 text-warning" /> Vacaciones
                      </span>
                    )}
                  </td>

                  <td className="table-cell-action">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(emp)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-text-secondary flex items-center justify-center transition-all shadow-xs"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => confirmDelete(emp)}
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
          
          {filteredEmployees.length === 0 && (
            <div className="absolute inset-0 top-[140px] flex flex-col items-center justify-center bg-white/50 backdrop-blur-[2px]">
              <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4 text-text-muted">
                <HiOutlineUsers className="w-8 h-8" />
              </div>
              <p className="text-text-primary font-bold mb-1">Sin especialistas</p>
              <p className="text-text-muted text-sm">No se encontraron empleados en el equipo.</p>
            </div>
          )}
        </div>
      </div>


      {/* ── Modal de Crear/Editar Empleado ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md transition-opacity" onClick={() => !saving && setModalOpen(false)}></div>
          
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-xl w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            <div className="px-8 py-6 border-b border-border-base bg-gradient-to-b from-surface-subtle/80 to-white flex justify-between items-center relative">
              <div className="bg-brand-50 w-12 h-12 rounded-2xl flex items-center justify-center border border-brand-100 shadow-sm mr-4">
                {editingEmp ? <HiOutlinePencilSquare className="w-6 h-6 text-brand-600" /> : <HiOutlineUserPlus className="w-6 h-6 text-brand-600" />}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {editingEmp ? 'Editar Profesional' : 'Alta de Personal'}
                </h2>
                <p className="text-xs text-text-secondary font-medium tracking-wide mt-1">FICHA DE ESPECIALISTA</p>
              </div>
              <button onClick={() => !saving && setModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors flex-shrink-0">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit}>
              <div className="p-8 space-y-6">
                
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl border-4 border-surface-subtle shadow-sm bg-surface-elevated overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {formData.photoRaw ? (
                       <img src={formData.photoRaw} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                       <HiOutlineUsers className="w-8 h-8 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">URL de Fotografía (Opcional)</label>
                    <input value={formData.photoRaw} onChange={e => setFormData({...formData, photoRaw: e.target.value})} placeholder="https://..." className="input-field py-2 text-sm text-text-secondary" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Nombre del Especialista</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Roberto Blanco" className="input-field py-3 font-semibold text-text-primary" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Email Profesional</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="roberto@empresa.com" className="input-field py-3 font-semibold text-text-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Especialidad Directa</label>
                    <input required value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} placeholder="Ej: Gestor Coworking" className="input-field py-3 font-semibold text-text-primary" />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Disponibilidad Actual</label>
                  <div className="flex items-center gap-6">
                    <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border transition-colors ${formData.status === 'Activo' ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold' : 'border-border-strong text-text-secondary hover:bg-surface-subtle'}`}>
                      <input type="radio" name="status" value="Activo" checked={formData.status === 'Activo'} onChange={e => setFormData({...formData, status: e.target.value})} className="hidden" />
                      <div className={`w-2 h-2 rounded-full ${formData.status === 'Activo' ? 'bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-transparent'}`}></div> 
                      En Activo
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border transition-colors ${formData.status === 'Vacaciones' ? 'border-warning text-warning-text bg-warning-bg font-bold' : 'border-border-strong text-text-secondary hover:bg-surface-subtle'}`}>
                      <input type="radio" name="status" value="Vacaciones" checked={formData.status === 'Vacaciones'} onChange={e => setFormData({...formData, status: e.target.value})} className="hidden" />
                      <HiOutlineSun className={`w-4 h-4 ${formData.status === 'Vacaciones' ? 'text-warning' : 'hidden'}`} />
                      Vacaciones o Baja
                    </label>
                  </div>
                </div>

              </div>

              <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-secondary bg-white border-border-strong px-6 py-3">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary w-48 flex items-center justify-center py-3">
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><HiOutlineCheck className="w-5 h-5 mr-2" /> {editingEmp ? 'Actualizar Ficha' : 'Guardar Perfil'} </>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Danger Modal para Confirmación de Despido/Eliminación ── */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-center">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md transition-opacity" onClick={() => !deleting && setDeleteModalOpen(false)}></div>
          
          <div className="inline-block bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in overflow-hidden border border-border-base/50 p-8 text-center text-left align-middle transition-all transform">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_4px_24px_rgba(239,68,68,0.25)]">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Baja de Personal
            </h3>
            
            <p className="text-sm text-text-secondary mb-8">
              ¿Estás seguro de que deseas desvincular a <strong>{itemToDelete.name}</strong>? Sus citas futuras asignadas quedarán sin especialista fijo.
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
                {deleting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sí, Dar de Baja'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
