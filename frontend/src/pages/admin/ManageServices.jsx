import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    duracion_min: '',
    activo: true,
    descripcion: '',
  });

  // Modal eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // ── Carga desde la DB ──
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/services');
      setServices(res.data.data);
    } catch (err) {
      toast.error('Error al cargar los servicios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Abrir modal creación ──
  const openCreateModal = () => {
    setEditingService(null);
    setFormData({ nombre: '', categoria: '', precio: '', duracion_min: '', activo: true, descripcion: '' });
    setModalOpen(true);
  };

  // ── Abrir modal edición ──
  const openEditModal = (svc) => {
    setEditingService(svc);
    setFormData({
      nombre: svc.nombre || '',
      categoria: svc.categoria || '',
      precio: svc.precio || '',
      duracion_min: svc.duracion_min || '',
      activo: svc.activo,
      descripcion: svc.descripcion || '',
    });
    setModalOpen(true);
  };

  // ── Guardar (crear o actualizar) ──
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre,
        categoria: formData.categoria || null,
        precio: parseFloat(formData.precio),
        duracion_min: parseInt(formData.duracion_min),
        activo: formData.activo,
        descripcion: formData.descripcion || null,
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
        toast.success('Servicio actualizado correctamente');
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? { ...s, ...payload } : s))
        );
      } else {
        const res = await api.post('/services', payload);
        toast.success('Servicio creado correctamente');
        setServices((prev) => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el servicio');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Soft delete ──
  const confirmDelete = (svc) => {
    setItemToDelete(svc);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/services/${itemToDelete.id}`);
      toast.success('Servicio desactivado exitosamente');
      setServices((prev) => prev.filter((s) => s.id !== itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar el servicio');
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            Catálogo de Servicios
          </h1>
          <p className="text-text-secondary">Gestiona los espacios y ofertas disponibles.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary py-3 px-6 flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">

        <div className="p-4 border-b border-border-base bg-surface-subtle/30 flex justify-between items-center">
          <span className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-brand-200/50">
            {services.length} servicios
          </span>
        </div>

        <div className="table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-3 whitespace-nowrap">Servicio</th>
                <th className="font-bold py-4 px-3 w-32 whitespace-nowrap">Categoría</th>
                <th className="font-bold py-4 px-3 w-24 whitespace-nowrap">Precio</th>
                <th className="font-bold py-4 px-3 w-24 whitespace-nowrap">Duración</th>
                <th className="font-bold py-4 px-3 w-24 whitespace-nowrap">Estado</th>
                <th className="table-cell-action pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {services.map((svc) => (
                <tr key={svc.id} className="hover:bg-surface-elevated/50 transition-colors group">

                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl border border-border-base ${svc.categoria?.toLowerCase().includes('cowork') ? 'bg-brand-50' : 'bg-accent-50'
                        }`}>
                        {svc.categoria?.toLowerCase().includes('cowork') ? '🏢' : '✂️'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text-primary text-sm truncate max-w-[180px]">
                          {svc.nombre}
                        </p>
                        {svc.descripcion && (
                          <p className="text-xs text-text-muted truncate max-w-[180px]">{svc.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-3 whitespace-nowrap">
                    {svc.categoria ? (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${svc.categoria?.toLowerCase().includes('cowork')
                          ? 'bg-brand-100 text-brand-800'
                          : 'bg-accent-100 text-accent-800'
                        }`}>
                        {svc.categoria}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>

                  <td className="py-4 px-3 whitespace-nowrap">
                    <p className="font-extrabold text-text-primary text-sm">
                      {parseFloat(svc.precio).toFixed(2)}€
                    </p>
                  </td>

                  <td className="py-4 px-3 whitespace-nowrap">
                    <p className="text-sm text-text-secondary font-medium">{svc.duracion_min} min</p>
                  </td>

                  <td className="py-4 px-3 whitespace-nowrap">
                    {svc.activo ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-success-text bg-success-bg px-2.5 py-1 rounded-full w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted bg-surface-300 px-2.5 py-1 rounded-full w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-text-muted" /> Pausado
                      </span>
                    )}
                  </td>

                  <td className="table-cell-action pr-3">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(svc)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-text-secondary flex items-center justify-center transition-all shadow-xs"
                        title="Editar"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(svc)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-danger-bg hover:text-danger-text hover:border-danger-border text-text-secondary flex items-center justify-center transition-all shadow-xs"
                        title="Desactivar"
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
            <div className="p-12 flex flex-col items-center justify-center">
              <HiOutlineSparkles className="w-12 h-12 text-text-muted mb-3" />
              <p className="text-text-primary font-bold mb-1">Sin servicios</p>
              <p className="text-text-muted text-sm">Crea tu primera oferta de negocio.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Crear/Editar ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !saving && setModalOpen(false)} />
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-xl w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50">

            <div className="px-8 py-6 border-b border-border-base bg-surface-subtle/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h2>
                <p className="text-xs text-text-secondary mt-1">CATÁLOGO DE NEGOCIO</p>
              </div>
              <button onClick={() => !saving && setModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-8 space-y-5">

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Nombre *
                  </label>
                  <input
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Corte Clásico"
                    className="input-field py-3 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción breve del servicio..."
                    className="input-field py-3"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                      Categoría
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="input-field py-3 text-text-secondary font-medium"
                    >
                      <option value="">Sin categoría</option>
                      <option value="Corte">Corte</option>
                      <option value="Color">Color</option>
                      <option value="Barbería">Barbería</option>
                      <option value="Peinado">Peinado</option>
                      <option value="Tratamiento">Tratamiento</option>
                      <option value="Coworking">Coworking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                      Duración (min) *
                    </label>
                    <input
                      required
                      type="number"
                      min="5"
                      max="480"
                      value={formData.duracion_min}
                      onChange={(e) => setFormData({ ...formData, duracion_min: e.target.value })}
                      placeholder="30"
                      className="input-field py-3 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
                      Precio (€) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">€</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        placeholder="0.00"
                        className="input-field py-3 pl-9 font-extrabold text-brand-700 bg-brand-50/50 border-brand-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer p-3 border border-border-base rounded-xl hover:bg-surface-subtle transition-colors w-full">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                        className="w-5 h-5 rounded border-border-strong text-brand-500 focus:ring-brand-500"
                      />
                      <div>
                        <span className="block text-sm font-bold text-text-primary">Activo</span>
                        <span className="block text-xs text-text-muted">Visible para clientes</span>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-secondary bg-white border-border-strong px-6 py-3">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary w-48 flex items-center justify-center py-3">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><HiOutlineCheck className="w-5 h-5 mr-2" /> {editingService ? 'Actualizar' : 'Crear'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Borrado ── */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !deleting && setDeleteModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in p-8 text-center border border-border-base/50">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Desactivar Servicio
            </h3>
            <p className="text-sm text-text-secondary mb-8">
              ¿Seguro que deseas desactivar <strong>"{itemToDelete.nombre}"</strong>? Dejará de estar visible para los clientes.
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
                  'Sí, Desactivar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}