import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', duracion_min: 30, precio: 0, categoria: '' });

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    try {
      const res = await api.get('/services?activo=true');
      setServices(res.data.data);
    } catch { toast.error('Error'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/services/${editing}`, form);
        toast.success('Servicio actualizado');
      } else {
        await api.post('/services', form);
        toast.success('Servicio creado');
      }
      resetForm();
      loadServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (s) => {
    setEditing(s.id);
    setForm({ nombre: s.nombre, descripcion: s.descripcion || '', duracion_min: s.duracion_min, precio: parseFloat(s.precio), categoria: s.categoria || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este servicio?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('Servicio desactivado');
      loadServices();
    } catch { toast.error('Error'); }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ nombre: '', descripcion: '', duracion_min: 30, precio: 0, categoria: '' });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-100">Gestión de Servicios</h1>
          <p className="text-surface-400 mt-1">{services.length} servicios activos</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" /> Nuevo Servicio
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-surface-200 mb-4">{editing ? 'Editar' : 'Nuevo'} Servicio</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-surface-400 mb-1">Nombre*</label><input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Categoría</label><input name="categoria" value={form.categoria} onChange={handleChange} className="input-field" /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Duración (min)*</label><input name="duracion_min" type="number" min="5" value={form.duracion_min} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Precio (€)*</label><input name="precio" type="number" step="0.01" min="0" value={form.precio} onChange={handleChange} className="input-field" required /></div>
            <div className="md:col-span-2"><label className="block text-sm text-surface-400 mb-1">Descripción</label><textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="input-field" rows={2} /></div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Guardar' : 'Crear'}</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-surface-800">
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Nombre</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Categoría</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Duración</th>
            <th className="text-left p-4 text-sm font-semibold text-surface-400">Precio</th>
            <th className="text-right p-4 text-sm font-semibold text-surface-400">Acciones</th>
          </tr></thead>
          <tbody className="divide-y divide-surface-800">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-surface-800/30 transition-colors">
                <td className="p-4 font-medium text-surface-200">{s.nombre}</td>
                <td className="p-4 text-surface-400">{s.categoria || '-'}</td>
                <td className="p-4 text-surface-400">{s.duracion_min} min</td>
                <td className="p-4 text-surface-200 font-medium">{parseFloat(s.precio).toFixed(2)}€</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(s)} className="p-2 rounded-lg hover:bg-primary-500/10 text-surface-400 hover:text-primary-400 transition-colors"><HiOutlinePencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-danger/10 text-surface-400 hover:text-danger transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
