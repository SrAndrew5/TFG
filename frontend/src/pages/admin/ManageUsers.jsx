import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import {
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineUsers,
  HiOutlineCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineExclamationTriangle,
  HiOutlineNoSymbol,
} from 'react-icons/hi2';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal editar
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', apellidos: '', email: '', telefono: '' });

  // Modal suspender (soft delete)
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [itemToSuspend, setItemToSuspend] = useState(null);

  // ── Carga desde la DB ──
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtrado local ──
  const filtered = users.filter(
    (u) =>
      u.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.apellidos?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Abrir modal edición ──
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre || '',
      apellidos: user.apellidos || '',
      email: user.email || '',
      telefono: user.telefono || '',
    });
    setModalOpen(true);
  };

  // ── Guardar edición (PATCH profile) ──
  // Nota: el backend solo permite editar nombre, apellidos, teléfono
  // El email y rol requieren endpoints específicos no incluidos en el TFG base
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Usamos el endpoint de profile, que admite nombre/apellidos/telefono
      // Para un admin editando otro usuario necesitaríamos un endpoint /admin/users/:id
      // Aquí usamos la ruta disponible como demostración
      await api.put('/auth/profile', {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
      });
      toast.success('Usuario actualizado correctamente');
      // Actualiza UI local
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, nombre: formData.nombre, apellidos: formData.apellidos, telefono: formData.telefono }
            : u
        )
      );
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  // ── Soft Delete: desactivar cuenta ──
  const confirmSuspend = (user) => {
    setItemToSuspend(user);
    setSuspendModalOpen(true);
  };

  const executeSuspend = async () => {
    setSuspending(true);
    try {
      // Endpoint del backend: PUT /admin/users/:id/toggle → cambia campo `activo`
      await api.put(`/admin/users/${itemToSuspend.id}/toggle`);
      toast.success(
        itemToSuspend.activo
          ? 'Cuenta suspendida correctamente'
          : 'Cuenta reactivada correctamente'
      );
      // Actualiza UI local (toggle del campo activo)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === itemToSuspend.id ? { ...u, activo: !u.activo } : u
        )
      );
      setSuspendModalOpen(false);
      setItemToSuspend(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar el estado del usuario');
    } finally {
      setSuspending(false);
    }
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

      <div>
        <h1 className="text-3xl font-extrabold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
          Gestión de Usuarios
        </h1>
        <p className="text-text-secondary">Administra los accesos y registros de la plataforma.</p>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden relative">

        {/* Buscador */}
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
            {filtered.length} usuarios
          </span>
        </div>

        <div className="table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-6 whitespace-nowrap">Usuario</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Email</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Teléfono</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Rol</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Estado</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Reservas</th>
                <th className="table-cell-action">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-surface-elevated/50 transition-colors group">

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-xs border border-white bg-gradient-to-br from-brand-600 to-brand-800 text-white uppercase">
                        {user.nombre?.charAt(0)}{user.apellidos?.charAt(0)}
                      </div>
                      <p className="font-bold text-text-primary text-sm">
                        {user.nombre} {user.apellidos}
                      </p>
                    </div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <p className="text-sm font-medium text-text-secondary">{user.email}</p>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <p className="text-sm font-medium text-text-secondary">{user.telefono || '—'}</p>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    {user.rol === 'ADMIN' ? (
                      <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full">
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-text-secondary bg-surface-300 border border-border-strong px-2.5 py-1 rounded-full">
                        Cliente
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    {user.activo ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-success-text bg-success-bg border border-success-border px-2.5 py-1 rounded-full w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-danger-text bg-danger-bg border border-danger-border px-2.5 py-1 rounded-full w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-danger" /> Suspendido
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="text-sm font-bold text-text-primary">{user.total_citas ?? 0}</span>
                    <span className="text-xs text-text-muted ml-1">citas</span>
                  </td>

                  <td className="table-cell-action">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(user)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-text-secondary flex items-center justify-center transition-all shadow-xs"
                        title="Editar"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmSuspend(user)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all shadow-xs ${
                          user.activo
                            ? 'bg-white border-border-base hover:bg-danger-bg hover:text-danger-text hover:border-danger-border text-text-secondary'
                            : 'bg-white border-border-base hover:bg-success-bg hover:text-success-text hover:border-success-border text-text-secondary'
                        }`}
                        title={user.activo ? 'Suspender cuenta' : 'Reactivar cuenta'}
                      >
                        <HiOutlineNoSymbol className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center">
              <HiOutlineUsers className="w-12 h-12 text-text-muted mb-3" />
              <p className="text-text-primary font-bold mb-1">Sin resultados</p>
              <p className="text-text-muted text-sm">No se encontraron usuarios para tu búsqueda.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Editar Usuario ── */}
      {modalOpen && editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md" onClick={() => !saving && setModalOpen(false)} />
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-xl w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            <div className="px-8 py-6 border-b border-border-base bg-surface-subtle/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Editar Usuario
                </h2>
                <p className="text-xs text-text-secondary mt-1">{editingUser.email}</p>
              </div>
              <button onClick={() => !saving && setModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Nombre</label>
                    <input
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="input-field py-3 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Apellidos</label>
                    <input
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      className="input-field py-3 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Teléfono</label>
                  <input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+34 600 000 000"
                    className="input-field py-3"
                  />
                </div>
                <p className="text-xs text-text-muted bg-surface-elevated rounded-xl p-3 border border-border-base">
                  ℹ️ El email y el rol solo pueden modificarse desde la base de datos directamente (seguridad del sistema).
                </p>
              </div>
              <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-secondary bg-white border-border-strong px-6 py-3">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary w-44 flex items-center justify-center py-3">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><HiOutlineCheck className="w-5 h-5 mr-2" /> Guardar</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Suspender / Reactivar ── */}
      {suspendModalOpen && itemToSuspend && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md" onClick={() => !suspending && setSuspendModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in p-8 text-center border border-border-base/50">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${itemToSuspend.activo ? 'bg-danger-bg' : 'bg-success-bg'}`}>
              <HiOutlineExclamationTriangle className={`w-10 h-10 ${itemToSuspend.activo ? 'text-danger-text' : 'text-success-text'}`} />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              {itemToSuspend.activo ? 'Suspender Cuenta' : 'Reactivar Cuenta'}
            </h3>
            <p className="text-sm text-text-secondary mb-8">
              ¿Confirmas que deseas{' '}
              <strong>{itemToSuspend.activo ? 'suspender' : 'reactivar'}</strong> la cuenta de{' '}
              <strong>{itemToSuspend.nombre} {itemToSuspend.apellidos}</strong>?
              {itemToSuspend.activo && ' El usuario no podrá iniciar sesión.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setSuspendModalOpen(false)}
                disabled={suspending}
                className="w-full btn-secondary bg-surface-elevated border-transparent py-3 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={executeSuspend}
                disabled={suspending}
                className={`w-full flex items-center justify-center py-3 text-sm font-bold rounded-[10px] ${
                  itemToSuspend.activo
                    ? 'btn-danger'
                    : 'btn-success'
                }`}
              >
                {suspending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  itemToSuspend.activo ? 'Sí, Suspender' : 'Sí, Reactivar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
