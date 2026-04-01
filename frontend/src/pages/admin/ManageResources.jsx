import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';

const typeLabels = { MESA: '🪑 Mesa', SALA: '🏢 Sala', PUESTO: '💻 Puesto', DESPACHO: '🚪 Despacho' };

export default function ManageResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', tipo: 'MESA', descripcion: '', capacidad: 1, ubicacion: '', precio_hora: 0, equipamiento: '' });

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await api.get('/resources'); setResources(r.data.data); } catch {} finally { setLoading(false); } };
  const handleChange = (e) => { const v = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value; setForm({ ...form, [e.target.name]: v }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/resources/${editing}`, form); toast.success('Recurso actualizado'); }
      else { await api.post('/resources', form); toast.success('Recurso creado'); }
      resetForm(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (r) => { setEditing(r.id); setForm({ nombre: r.nombre, tipo: r.tipo, descripcion: r.descripcion || '', capacidad: r.capacidad, ubicacion: r.ubicacion || '', precio_hora: parseFloat(r.precio_hora), equipamiento: r.equipamiento || '' }); setShowForm(true); };
  const handleDelete = async (id) => { if (!confirm('¿Desactivar?')) return; try { await api.delete(`/resources/${id}`); toast.success('Desactivado'); load(); } catch { toast.error('Error'); } };
  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ nombre: '', tipo: 'MESA', descripcion: '', capacidad: 1, ubicacion: '', precio_hora: 0, equipamiento: '' }); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-surface-100">Gestión de Recursos</h1><p className="text-surface-400 mt-1">{resources.length} recursos</p></div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2"><HiOutlinePlus className="w-5 h-5" /> Nuevo Recurso</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-surface-200 mb-4">{editing ? 'Editar' : 'Nuevo'} Recurso</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-surface-400 mb-1">Nombre*</label><input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Tipo*</label><select name="tipo" value={form.tipo} onChange={handleChange} className="input-field"> {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)} </select></div>
            <div><label className="block text-sm text-surface-400 mb-1">Capacidad</label><input name="capacidad" type="number" min="1" value={form.capacidad} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Precio/hora (€)*</label><input name="precio_hora" type="number" step="0.01" min="0" value={form.precio_hora} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Ubicación</label><input name="ubicacion" value={form.ubicacion} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Equipamiento</label><input name="equipamiento" value={form.equipamiento} onChange={handleChange} className="input-field" /></div>
            <div className="md:col-span-2"><label className="block text-sm text-surface-400 mb-1">Descripción</label><textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="input-field" rows={2} /></div>
            <div className="md:col-span-2 flex gap-3"><button type="submit" className="btn-primary">{editing ? 'Guardar' : 'Crear'}</button><button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button></div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-surface-800">
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Nombre</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Tipo</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Capacidad</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Ubicación</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Precio/h</th>
            <th className="text-right p-4 text-sm font-semibold text-surface-400">Acciones</th>
          </tr></thead>
          <tbody className="divide-y divide-surface-800">
            {resources.map((r) => (
              <tr key={r.id} className="hover:bg-surface-800/30 transition-colors">
                <td className="p-4 font-medium text-surface-200">{r.nombre}</td>
                <td className="p-4 text-surface-400">{typeLabels[r.tipo]}</td>
                <td className="p-4 text-surface-400">{r.capacidad}</td>
                <td className="p-4 text-surface-400">{r.ubicacion || '-'}</td>
                <td className="p-4 text-surface-200 font-medium">{parseFloat(r.precio_hora).toFixed(2)}€</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(r)} className="p-2 rounded-lg hover:bg-primary-500/10 text-surface-400 hover:text-primary-400 transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-danger/10 text-surface-400 hover:text-danger transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
