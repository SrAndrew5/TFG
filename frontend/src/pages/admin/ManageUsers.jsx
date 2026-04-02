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
  HiOutlineNoSymbol
} from 'react-icons/hi2';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para Modal de Crear/Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Estados Formulario Modal
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Cliente' });
  
  // Estados para Modal de Borrado (Danger Modal)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Dummy data initial load
  const DUMMY_USERS = [
    { id: 1, name: 'Carlos Mendoza', email: 'carlos.mendoza@email.com', registered: '12 Mar 2026', role: 'Cliente', active: true },
    { id: 2, name: 'Elena Ramírez', email: 'elena.admin@empresa.com', registered: '01 Feb 2026', role: 'Admin', active: true },
    { id: 3, name: 'Javier Castillo', email: 'jcastillo88@email.com', registered: '22 Mar 2026', role: 'Cliente', active: true },
    { id: 4, name: 'Sofía Navarro', email: 'sofia.nav@gmail.com', registered: '05 Abr 2026', role: 'Cliente', active: true },
    { id: 5, name: 'Marcos Alonso', email: 'marcos.dev@empresa.com', registered: '14 Feb 2026', role: 'Admin', active: true }
  ];

  useEffect(() => {
    setTimeout(() => {
      setUsers(DUMMY_USERS);
      setLoading(false);
    }, 600);
  }, []);

  // ── Lógica de Filtrado Local ──
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Helpers de Edición ──
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'Cliente' });
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      role: user.role 
    });
    setModalOpen(true);
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setModalOpen(false);
      toast.success(editingUser ? 'Usuario actualizado exitosamente' : 'Usuario registrado exitosamente');
      
      // Update UI state
      if (editingUser) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
      } else {
        const newDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const newUser = { id: Date.now(), ...formData, registered: newDate, active: true };
        setUsers([newUser, ...users]);
      }
    }, 1000);
  };

  // ── Helpers de Borrado ──
  const confirmSuspend = (user) => {
    setItemToDelete(user);
    setDeleteModalOpen(true);
  };

  const executeSuspend = () => {
    setDeleting(true);
    setTimeout(() => {
      setUsers(users.map(u => u.id === itemToDelete.id ? { ...u, active: false } : u));
      setDeleting(false);
      setDeleteModalOpen(false);
      toast.success('Cuenta suspendida exitosamente');
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
            Gestión de Usuarios
          </h1>
          <p className="text-text-secondary">Administra los accesos y registros de la plataforma.</p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="btn-primary py-3 px-6 shadow-brand hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <HiOutlineUserPlus className="w-5 h-5 border-2 border-white rounded-md p-0.5" />
          Nuevo Usuario
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
              placeholder="Buscar por nombre o email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-strong rounded-xl text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-50 outline-none transition-all placeholder-text-muted text-text-primary font-medium"
            />
          </div>
          <span className="bg-surface-elevated text-text-muted text-xs font-bold px-3 py-1.5 rounded-lg border border-border-strong">
            {filteredUsers.length} Usuarios Filtrados
          </span>
        </div>

        <div className="table-container">
          <table className="table-pro">
            <thead>
              <tr className="bg-surface-subtle text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-6 whitespace-nowrap">Usuario</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Email</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Fecha Registro</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Estado</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Rol</th>
                <th className="table-cell-action">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-elevated/50 transition-colors group">
                  
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar Pequeño Circular */}
                      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-xs border border-white bg-gradient-to-br from-brand-600 to-brand-800 text-white uppercase overflow-hidden">
                        {user.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                      </div>
                      <p className="font-bold text-text-primary text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {user.name}
                      </p>
                    </div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <p className="text-sm font-medium text-text-secondary">{user.email}</p>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <p className="text-sm font-medium text-text-secondary">{user.registered}</p>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    {user.active ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-success-text bg-success-bg px-2.5 py-1 rounded-full w-fit border border-success-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-danger-text bg-danger-bg px-2.5 py-1 rounded-full w-fit border border-danger-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-danger"></span> Suspendido
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    {user.role === 'Admin' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-1 rounded-full w-fit">
                        Admin
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-text-secondary bg-surface-300 border border-border-strong px-2.5 py-1 rounded-full w-fit">
                        Cliente
                      </span>
                    )}
                  </td>

                  <td className="table-cell-action">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-text-secondary flex items-center justify-center transition-all shadow-xs"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => confirmSuspend(user)}
                        disabled={!user.active}
                        className={`w-8 h-8 rounded-lg border border-border-base flex items-center justify-center transition-all shadow-xs ${user.active ? 'bg-white hover:bg-danger-bg hover:text-danger-text hover:border-danger-border text-text-secondary' : 'bg-surface-elevated text-text-muted opacity-50 cursor-not-allowed'}`}
                        title={user.active ? 'Suspender usuario' : 'Ya suspendido'}
                      >
                        <HiOutlineNoSymbol className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="absolute inset-0 top-[140px] flex flex-col items-center justify-center bg-white/50 backdrop-blur-[2px]">
              <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4 text-text-muted">
                <HiOutlineUsers className="w-8 h-8" />
              </div>
              <p className="text-text-primary font-bold mb-1">Sin resultados</p>
              <p className="text-text-muted text-sm">No se encontraron usuarios para tu búsqueda.</p>
            </div>
          )}
        </div>
      </div>


      {/* ── Modal de Crear/Editar Usuario ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md transition-opacity" onClick={() => !saving && setModalOpen(false)}></div>
          
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-xl w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            <div className="px-8 py-6 border-b border-border-base bg-gradient-to-b from-surface-subtle/80 to-white flex justify-between items-center relative">
              <div className="bg-brand-50 w-12 h-12 rounded-2xl flex items-center justify-center border border-brand-100 shadow-sm mr-4">
                {editingUser ? <HiOutlinePencilSquare className="w-6 h-6 text-brand-600" /> : <HiOutlineUserPlus className="w-6 h-6 text-brand-600" />}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {editingUser ? 'Editar Usuario' : 'Añadir Usuario'}
                </h2>
                <p className="text-xs text-text-secondary font-medium tracking-wide mt-1">SISTEMA DE ACCESO</p>
              </div>
              <button onClick={() => !saving && setModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors flex-shrink-0">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit}>
              <div className="p-8 space-y-6">
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Nombre Completo</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Laura Gómez" className="input-field py-3 font-semibold text-text-primary" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Correo Electrónico</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="laura@empresa.com" className="input-field py-3 font-semibold text-text-primary" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Rol del Usuario</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center gap-3 cursor-pointer p-4 border rounded-xl transition-all ${formData.role === 'Cliente' ? 'border-brand-500 bg-brand-50/50 shadow-[0_4px_12px_rgba(99,102,241,0.08)]' : 'border-border-strong hover:bg-surface-subtle'}`}>
                      <input type="radio" required name="role" value="Cliente" checked={formData.role === 'Cliente'} onChange={e => setFormData({...formData, role: e.target.value})} className="w-5 h-5 rounded-full border-border-strong text-brand-500 focus:ring-brand-500" />
                      <div>
                        <span className="block text-sm font-bold text-text-primary">Cliente Neutro</span>
                        <span className="block text-xs text-text-muted font-medium mt-0.5">Acceso estándar</span>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 cursor-pointer p-4 border rounded-xl transition-all ${formData.role === 'Admin' ? 'border-brand-500 bg-brand-50/50 shadow-[0_4px_12px_rgba(99,102,241,0.08)]' : 'border-border-strong hover:bg-surface-subtle'}`}>
                      <input type="radio" required name="role" value="Admin" checked={formData.role === 'Admin'} onChange={e => setFormData({...formData, role: e.target.value})} className="w-5 h-5 rounded-full border-border-strong text-brand-500 focus:ring-brand-500" />
                      <div>
                        <span className="block text-sm font-bold text-brand-700">Administrador</span>
                        <span className="block text-xs text-brand-600/70 font-medium mt-0.5">Control total</span>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-secondary bg-white border-border-strong px-6 py-3">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary w-48 flex items-center justify-center py-3">
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><HiOutlineCheck className="w-5 h-5 mr-2" /> {editingUser ? 'Actualizar' : 'Guardar Usuario'} </>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Danger Modal para Confirmación de Borrado ── */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-center">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md transition-opacity" onClick={() => !deleting && setDeleteModalOpen(false)}></div>
          
          <div className="inline-block bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in overflow-hidden border border-border-base/50 p-8 text-center text-left align-middle transition-all transform">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_4px_24px_rgba(239,68,68,0.25)]">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Suspender cuenta
            </h3>
            
            <p className="text-sm text-text-secondary mb-8">
              ¿Seguro que deseas suspender al usuario <strong>{itemToDelete.name}</strong>? No podrá iniciar sesión en la plataforma y cualquier recurso reservado no resuelto podría quedar bloqueado.
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
                onClick={executeSuspend} 
                disabled={deleting} 
                className="w-full btn-danger flex items-center justify-center py-3 text-sm font-bold tracking-wide transition-colors duration-200"
              >
                {deleting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sí, Suspender'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
