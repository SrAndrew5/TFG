import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil } from 'react-icons/hi2';

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellidos: '', email: '', telefono: '', especialidad: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await api.get('/employees'); setEmployees(res.data.data); }
    catch { toast.error('Error'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/employees/${editing}`, form); toast.success('Empleado actualizado'); }
      else { await api.post('/employees', form); toast.success('Empleado creado'); }
      resetForm(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (emp) => {
    setEditing(emp.id);
    setForm({ nombre: emp.nombre, apellidos: emp.apellidos, email: emp.email, telefono: emp.telefono || '', especialidad: emp.especialidad || '' });
    setShowForm(true);
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ nombre: '', apellidos: '', email: '', telefono: '', especialidad: '' }); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-100">Gestión de Empleados</h1>
          <p className="text-surface-400 mt-1">{employees.length} empleados</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2"><HiOutlinePlus className="w-5 h-5" /> Nuevo Empleado</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-surface-200 mb-4">{editing ? 'Editar' : 'Nuevo'} Empleado</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-surface-400 mb-1">Nombre*</label><input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Apellidos*</label><input name="apellidos" value={form.apellidos} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Email*</label><input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required /></div>
            <div><label className="block text-sm text-surface-400 mb-1">Teléfono</label><input name="telefono" value={form.telefono} onChange={handleChange} className="input-field" /></div>
            <div className="md:col-span-2"><label className="block text-sm text-surface-400 mb-1">Especialidad</label><input name="especialidad" value={form.especialidad} onChange={handleChange} className="input-field" /></div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Guardar' : 'Crear'}</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp, i) => (
          <div key={emp.id} className="glass-card p-5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                {emp.nombre?.charAt(0)}{emp.apellidos?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-surface-200">{emp.nombre} {emp.apellidos}</p>
                <p className="text-xs text-surface-500">{emp.especialidad || 'Sin especialidad'}</p>
              </div>
              <button onClick={() => handleEdit(emp)} className="p-2 rounded-lg hover:bg-primary-500/10 text-surface-400 hover:text-primary-400 transition-colors">
                <HiOutlinePencil className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 text-sm text-surface-500">
              <p>{emp.email}</p>
              {emp.telefono && <p>{emp.telefono}</p>}
              <p className="mt-1 text-surface-600">{emp.servicios?.length || 0} servicios · {emp.total_citas || 0} citas</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
