import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineExclamationTriangle,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';

const TIPOS = ['MESA', 'SALA', 'PUESTO', 'DESPACHO'];

const TIPO_EMOJI = { MESA: '🪑', SALA: '🏢', PUESTO: '💼', DESPACHO: '🚪' };

const FORM_EMPTY = {
  nombre: '',
  tipo: 'MESA',
  descripcion: '',
  capacidad: 1,
  ubicacion: '',
  precio_hora: '',
  equipamiento: '',
  activo: true,
};

export default function ManageResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(FORM_EMPTY);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/resources');
      setResources(res.data.data);
    } catch {
      toast.error('Error al cargar los recursos');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(FORM_EMPTY);
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      nombre: r.nombre || '',
      tipo: r.tipo || 'MESA',
      descripcion: r.descripcion || '',
      capacidad: r.capacidad || 1,
      ubicacion: r.ubicacion || '',
      precio_hora: r.precio_hora || '',
      equipamiento: r.equipamiento || '',
      activo: r.activo,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion || null,
        capacidad: parseInt(form.capacidad),
        ubicacion: form.ubicacion || null,
        precio_hora: parseFloat(form.precio_hora),
        equipamiento: form.equipamiento || null,
        activo: form.activo,
      };

      if (editing) {
        await api.put(`/resources/${editing.id}`, payload);
        toast.success('Recurso actualizado');
        setResources((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...payload } : r)));
      } else {
        const res = await api.post('/resources', payload);
        toast.success('Recurso creado');
        setResources((prev) => [res.data.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (r) => { setItemToDelete(r); setDeleteModalOpen(true); };

  const executeDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/resources/${itemToDelete.id}`);
      toast.success('Recurso desactivado');
      setResources((prev) => prev.filter((r) => r.id !== itemToDelete.id));
      setDeleteModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al desactivar');
    } finally {
      setDeleting(false);
    }
  };

  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));

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
            Gestión de Recursos Coworking
          </h1>
          <p className="text-text-secondary">Administra mesas, salas de reuniones, puestos y despachos.</p>
        </div>
        <button onClick={openCreate} className="btn-primary py-3 px-6 flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" />
          Nuevo Recurso
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIPOS.map((tipo) => (
          <div key={tipo} className="bg-white rounded-2xl border border-border-base p-4 flex items-center gap-3">
            <span className="text-2xl">{TIPO_EMOJI[tipo]}</span>
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider">{tipo}</p>
              <p className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                {resources.filter((r) => r.tipo === tipo).length}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-base overflow-hidden">
        <div className="p-4 border-b border-border-base bg-surface-subtle/30 flex justify-between items-center">
          <span className="bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-brand-200/50">
            {resources.length} espacios
          </span>
        </div>

        <div className="table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle text-xs uppercase tracking-wider text-text-muted border-b border-border-base">
                <th className="font-bold py-4 px-3 whitespace-nowrap">Recurso</th>
                <th className="font-bold py-4 px-3 w-28 whitespace-nowrap">Tipo</th>
                <th className="font-bold py-4 px-3 w-24 whitespace-nowrap">Capacidad</th>
                <th className="font-bold py-4 px-3 w-28 whitespace-nowrap">€/hora</th>
                <th className="font-bold py-4 px-3 w-24 whitespace-nowrap">Estado</th>
                <th className="table-cell-action pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {resources.map((r) => (
                <tr key={r.id} className="hover:bg-surface-elevated/50 transition-colors group">
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl border border-border-base bg-brand-50">
                        {TIPO_EMOJI[r.tipo]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text-primary text-sm truncate max-w-[180px]">{r.nombre}</p>
                        {r.ubicacion && <p className="text-xs text-text-muted truncate max-w-[180px]">{r.ubicacion}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-brand-100 text-brand-800">{r.tipo}</span>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    <p className="text-sm text-text-secondary font-medium">{r.capacidad} persona{r.capacidad > 1 ? 's' : ''}</p>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    <p className="font-extrabold text-text-primary text-sm">{parseFloat(r.precio_hora).toFixed(2)}€</p>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    {r.activo ? (
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
                        onClick={() => openEdit(r)}
                        className="w-8 h-8 rounded-lg bg-white border border-border-base hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 text-text-secondary flex items-center justify-center transition-all shadow-xs"
                        title="Editar"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(r)}
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

          {resources.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center">
              <HiOutlineBuildingOffice2 className="w-12 h-12 text-text-muted mb-3" />
              <p className="text-text-primary font-bold mb-1">Sin espacios</p>
              <p className="text-text-muted text-sm">Crea tu primer recurso de coworking.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !saving && setModalOpen(false)} />
          <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-xl w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base/50 max-h-[90vh] overflow-y-auto">

            <div className="px-8 py-6 border-b border-border-base bg-surface-subtle/50 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-extrabold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {editing ? 'Editar Recurso' : 'Nuevo Recurso'}
                </h2>
                <p className="text-xs text-text-secondary mt-1">ESPACIOS COWORKING</p>
              </div>
              <button onClick={() => !saving && setModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-secondary hover:bg-danger-bg hover:text-danger-text transition-colors">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-8 space-y-5">

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Nombre *</label>
                    <input required value={form.nombre} onChange={(e) => field('nombre', e.target.value)} placeholder="Ej: Sala de Reuniones Norte" className="input-field py-3 font-semibold" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Tipo *</label>
                    <select required value={form.tipo} onChange={(e) => field('tipo', e.target.value)} className="input-field py-3 font-medium">
                      {TIPOS.map((t) => <option key={t} value={t}>{TIPO_EMOJI[t]} {t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Capacidad (personas) *</label>
                    <input required type="number" min="1" max="50" value={form.capacidad} onChange={(e) => field('capacidad', e.target.value)} className="input-field py-3 font-semibold" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">Precio/hora (€) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">€</span>
                      <input required type="number" step="0.01" min="0" value={form.precio_hora} onChange={(e) => field('precio_hora', e.target.value)} placeholder="0.00" className="input-field py-3 pl-9 font-extrabold text-brand-700 bg-brand-50/50 border-brand-200" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Ubicación</label>
                    <input value={form.ubicacion} onChange={(e) => field('ubicacion', e.target.value)} placeholder="Ej: Planta 1, Zona B" className="input-field py-3" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Descripción</label>
                    <textarea value={form.descripcion} onChange={(e) => field('descripcion', e.target.value)} placeholder="Describe el espacio..." className="input-field py-3" rows={2} />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Equipamiento</label>
                    <input value={form.equipamiento} onChange={(e) => field('equipamiento', e.target.value)} placeholder="Ej: Proyector, Pizarra, WiFi, TV 4K" className="input-field py-3" />
                  </div>

                  <div className="col-span-2 flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer p-3 border border-border-base rounded-xl hover:bg-surface-subtle transition-colors w-full">
                      <input type="checkbox" checked={form.activo} onChange={(e) => field('activo', e.target.checked)} className="w-5 h-5 rounded border-border-strong text-brand-500 focus:ring-brand-500" />
                      <div>
                        <span className="block text-sm font-bold text-text-primary">Activo</span>
                        <span className="block text-xs text-text-muted">Visible y reservable por clientes</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-surface-subtle/50 border-t border-border-base flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-secondary bg-white border-border-strong px-6 py-3">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary w-48 flex items-center justify-center py-3">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><HiOutlineCheck className="w-5 h-5 mr-2" /> {editing ? 'Actualizar' : 'Crear'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !deleting && setDeleteModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-scale-in p-8 text-center border border-border-base/50">
            <div className="w-20 h-20 bg-danger-bg rounded-full mx-auto flex items-center justify-center mb-6">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-danger-text" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Desactivar Recurso
            </h3>
            <p className="text-sm text-text-secondary mb-8">
              ¿Deseas desactivar <strong>"{itemToDelete.nombre}"</strong>? Dejará de aparecer para los clientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button disabled={deleting} onClick={() => setDeleteModalOpen(false)} className="w-full btn-secondary bg-surface-elevated border-transparent py-3 text-sm font-bold">
                Cancelar
              </button>
              <button disabled={deleting} onClick={executeDelete} className="w-full btn-danger flex items-center justify-center py-3 text-sm font-bold">
                {deleting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sí, Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
