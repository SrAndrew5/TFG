import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
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
  HiOutlineSun,
} from 'react-icons/hi2';

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    especialidad: '',
  });

  // Modal eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // ── Carga desde la DB ──
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      // El endpoint GET /employees?activo=true devuelve activos, sin param devuelve todos
      const res = await api.get('/employees?activo=true');
      setEmployees(res.data.data);
    } catch (err) {
      toast.error('Error al cargar los empleados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtrado local ──
  const filtered = employees.filter(
    (emp) =>
      emp.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.apellidos?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.especialidad?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Abrir modal creación ──
  const openCreateModal = () => {
    setEditingEmp(null);
    setFormData({ nombre: '', apellidos: '', email: '', telefono: '', especialidad: '' });
    setModalOpen(true);
  };

  // ── Abrir modal edición ──
  const openEditModal = (emp) => {
    setEditingEmp(emp);
    setFormData({
      nombre: emp.nombre || '',
      apellidos: emp.apellidos || '',
      email: emp.email || '',
      telefono: emp.telefono || '',
      especialidad: emp.especialidad || '',
    });
    setModalOpen(true);
  };

  // ── Guardar (crear o actualizar) ──
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingEmp) {
        // PUT /employees/:id
        await api.put(`/employees/${editingEmp.id}`, formData);
        toast.success('Empleado actualizado correctamente');
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === editingEmp.id ? { ...emp, ...formData } : emp))
        );
      } else {
        // POST /employees
        const res = await api.post('/employees', formData);
        toast.success('Empleado registrado con éxito');
        setEmployees((prev) => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el empleado');
    } finally {
      setSaving(false);
    }
  };

  // ── Soft delete: desactivar empleado ──
  // PUT /employees/:id con { activo: false }
  const confirmDelete = (emp) => {
    setItemToDelete(emp);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    setDeleting(true);
    try {
      await api.put(`/employees/${itemToDelete.id}`, { activo: false });
      toast.success('Empleado desactivado del sistema');
      // Lo quitamos de la lista ya que cargamos solo activos
      setEmployees((prev) => prev.filter((emp) => emp.id !== itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al desactivar el empleado');
    } finally {
      setDeleting(false);
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            Nuestro Equipo
          </h1>
          <p className="text-text-secondary">Gestiona los especialistas y sus disponibilidades.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary py-3 px-6 flex items-center gap-2"
        >
          <HiOutlineUserPlus className="w-5 h-5" />
          Añadir Empleado
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden relative">

        {/* Buscador */}
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
            {filtered.length} empleados
          </span>
        </div>

        <div className="table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-6 whitespace-nowrap">Empleado</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Email</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Especialidad</th>
                <th className="font-bold py-4 px-6 whitespace-nowrap">Servicios</th>
                <th className="table-cell-action">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-surface-elevated/50 transition-colors group">

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {emp.nombre?.charAt(0)}{emp.apellidos?.charAt(0)}
                      </div>
                      <p className="font-bold text-text-primary text-sm">
                        {emp.nombre} {emp.apellidos}
                      </p>
                    </div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <p className="text-sm font-medium text-text-secondary">{emp.email}</p>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineBriefcase className="w-4 h-4 text-brand-500" />
                      <p className="text-sm font-bold text-text-primary">{emp.especialidad || '—'}</p>
                    </div>
                  </td>

                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="text-sm font-bold text-text-primary">
                      {emp.servicios?.length ?? 0}
                    </span>
                    <span className="text-xs text-text-muted ml-1">servicios</span>
                  </td>

                  <td className="table-cell-action">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-text-secondary flex items-center justify-center transition-all shadow-xs"
                        title="Editar"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(emp)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-danger-bg hover:text-danger-text hover:border-danger-border text-text-secondary flex items-center justify-center transition-all shadow-xs"
                        title="Desactivar empleado"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
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
              <p className="text-text-primary font-bold mb-1">Sin empleados</p>
              <p className="text-text-muted text-sm">Añade el primer miembro del equipo.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Crear/Editar ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md" onClick={() => !saving && setModalOpen(false)} />
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-xl w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">
            <div className="px-8 py-6 border-b border-border-base bg-surface-subtle/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {editingEmp ? 'Editar Empleado' : 'Nuevo Empleado'}
                </h2>
                <p className="text-xs text-text-secondary mt-1">FICHA DE ESPECIALISTA</p>
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
                      placeholder="Ana"
                      className="input-field py-3 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Apellidos</label>
                    <input
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      placeholder="Rodríguez"
                      className="input-field py-3 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Email profesional</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ana@empresa.com"
                    className="input-field py-3 font-semibold"
                    disabled={!!editingEmp} // no permitir cambiar email en edición
                  />
                  {editingEmp && (
                    <p className="text-xs text-text-muted mt-1">El email no puede modificarse.</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Teléfono</label>
                    <input
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+34 600 000 000"
                      className="input-field py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Especialidad</label>
                    <input
                      value={formData.especialidad}
                      onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                      placeholder="Coloración y Mechas"
                      className="input-field py-3 font-semibold"
                    />
                  </div>
                </div>
              </div>
              <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-secondary bg-white border-border-strong px-6 py-3">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary w-44 flex items-center justify-center py-3">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><HiOutlineCheck className="w-5 h-5 mr-2" /> {editingEmp ? 'Actualizar' : 'Guardar'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Desactivar ── */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-md" onClick={() => !deleting && setDeleteModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in p-8 text-center border border-border-base/50">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Dar de Baja
            </h3>
            <p className="text-sm text-text-secondary mb-8">
              ¿Seguro que deseas desactivar a{' '}
              <strong>{itemToDelete.nombre} {itemToDelete.apellidos}</strong>? Sus citas futuras quedarán sin especialista asignado.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="w-full btn-secondary bg-surface-elevated border-transparent py-3 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="w-full btn-danger flex items-center justify-center py-3 text-sm font-bold"
              >
                {deleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Sí, Dar de Baja'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
