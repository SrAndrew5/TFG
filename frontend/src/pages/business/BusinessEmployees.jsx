import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  getMyEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getMyServices,
  getEmployeeAvailability,
  addEmployeeAvailability,
  deleteEmployeeAvailability,
  getEmployeeDetail,
  assignServiceToEmployee,
  removeServiceFromEmployee,
} from '../../services/businessService';
import ErrorState from '../../components/shared/ErrorState';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineExclamationTriangle,
  HiOutlineFaceSmile,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineWrenchScrewdriver,
} from 'react-icons/hi2';

const EMPTY_FORM = {
  nombre: '', apellidos: '', email: '', telefono: '', especialidad: '', activo: true,
};

export default function BusinessEmployees() {
  usePageTitle('Mis empleados');

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  // Modal crear/editar
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [chips, setChips]           = useState([]); // especialidades como array de chips
  const [submitting, setSubmitting] = useState(false);

  // Modal eliminar
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Modal disponibilidad
  const [availabilityTarget, setAvailabilityTarget] = useState(null);

  // Modal servicios
  const [servicesTarget, setServicesTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getMyEmployees();
      setItems(res.data.data || []);
    } catch {
      setError(true);
      toast.error('Error al cargar los empleados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setChips([]);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      nombre:    item.nombre,
      apellidos: item.apellidos,
      email:     item.email,
      telefono:  item.telefono || '',
      activo:    item.activo,
    });
    // Convertir especialidad (CSV) a chips
    setChips(
      item.especialidad
        ? item.especialidad.split(',').map((s) => s.trim()).filter(Boolean)
        : []
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setChips([]);
  };

  const handleField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim())    { toast.error('El nombre es obligatorio'); return; }
    if (!form.apellidos.trim()) { toast.error('Los apellidos son obligatorios'); return; }
    if (!form.email.trim())     { toast.error('El email es obligatorio'); return; }
    setSubmitting(true);
    try {
      const payload = {
        nombre:       form.nombre.trim(),
        apellidos:    form.apellidos.trim(),
        email:        form.email.trim(),
        telefono:     form.telefono.trim() || null,
        especialidad: chips.length > 0 ? chips.join(', ') : null,
        activo:       form.activo,
      };
      if (editTarget) {
        await updateEmployee(editTarget.id, payload);
        toast.success('Empleado actualizado');
      } else {
        await createEmployee(payload);
        toast.success('Empleado creado');
      }
      closeModal();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar el empleado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActivo = async (item) => {
    try {
      await updateEmployee(item.id, { activo: !item.activo });
      toast.success(item.activo ? 'Empleado desactivado' : 'Empleado activado');
      await load();
    } catch {
      toast.error('No se pudo cambiar el estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      toast.success('Empleado desactivado');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Header Premium */}
      <div className="profile-hero !mb-10 !p-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
             Gestión de Equipo
          </div>
          <h1 className="profile-hero-name">Mi Equipo</h1>
          <p className="profile-hero-email">Administra los profesionales de tu negocio y sus especialidades.</p>
        </div>
        <button onClick={openCreate} className="bg-white text-brand-900 font-black px-8 py-5 rounded-[2rem] shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]">
          <HiOutlinePlus className="w-5 h-5 text-accent-500" />
          Añadir Miembro
        </button>
      </div>

      {/* Contenido */}
      {error ? (
        <ErrorState message="No se pudieron cargar los empleados." onRetry={load} />
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card border-2 border-dashed border-border-strong p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted">
            <HiOutlineFaceSmile className="w-7 h-7" aria-hidden="true" />
          </div>
          <p className="font-bold text-text-primary mb-1">Aún no tienes empleados</p>
          <p className="text-sm text-text-secondary max-w-xs mx-auto mb-4">
            Añade a tu equipo para que los clientes puedan elegir profesional al reservar.
          </p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" aria-hidden="true" />
            Añadir primer empleado
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <EmployeeRow
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onToggle={() => handleToggleActivo(item)}
              onDelete={() => setDeleteTarget(item)}
              onAvailability={() => setAvailabilityTarget(item)}
              onServices={() => setServicesTarget(item)}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <EmployeeModal
          isEdit={!!editTarget}
          form={form}
          chips={chips}
          setChips={setChips}
          onField={handleField}
          onSubmit={handleSubmit}
          onClose={closeModal}
          submitting={submitting}
        />
      )}

      {/* Modal confirmar eliminación */}
      {deleteTarget && (
        <ConfirmModal
          title="Desactivar empleado"
          message={`"${deleteTarget.nombre} ${deleteTarget.apellidos}" quedará inactivo. El historial de citas se conserva.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Modal disponibilidad */}
      {availabilityTarget && (
        <AvailabilityModal
          employee={availabilityTarget}
          onClose={() => setAvailabilityTarget(null)}
        />
      )}

      {/* Modal servicios */}
      {servicesTarget && (
        <ServicesModal
          employee={servicesTarget}
          onClose={() => setServicesTarget(null)}
        />
      )}
    </div>
  );
}

/* ─── EmployeeRow ─── */

function EmployeeRow({ item, onEdit, onToggle, onDelete, onAvailability, onServices }) {
  const initials = `${item.nombre?.[0] || ''}${item.apellidos?.[0] || ''}`.toUpperCase();
  const especialidades = item.especialidad
    ? item.especialidad.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className={`profile-content-card !p-6 flex flex-col sm:flex-row sm:items-center gap-6 transition-all duration-300 ${!item.activo ? 'opacity-50 grayscale-[0.5]' : 'hover:shadow-xl hover:scale-[1.005]'}`}>

      {/* Avatar Premium */}
      <div className="w-20 h-20 rounded-[1.5rem] flex-shrink-0 overflow-hidden shadow-sm border border-brand-100">
        {item.avatar_url ? (
          <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-brand-900 flex items-center justify-center text-white font-black text-xl">
            {initials || <HiOutlineUser className="w-8 h-8" />}
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-black text-brand-500 tracking-tight">
            {item.nombre} {item.apellidos}
          </h3>
          {item.activo ? (
             <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">Activo</span>
          ) : (
             <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">Inactivo</span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
          <span className="flex items-center gap-2 text-xs font-bold text-text-secondary">
            <HiOutlineEnvelope className="w-4 h-4 text-accent-500" />
            {item.email}
          </span>
          {item.telefono && (
            <span className="flex items-center gap-2 text-xs font-bold text-text-secondary">
              <HiOutlinePhone className="w-4 h-4 text-brand-400" />
              {item.telefono}
            </span>
          )}
        </div>

        {especialidades.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {especialidades.map((esp) => (
              <span key={esp} className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-[9px] font-black uppercase tracking-widest border border-brand-100">
                {esp}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Group */}
      <div className="flex items-center gap-2 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-6 flex-wrap justify-end">
        <button onClick={onAvailability} title="Gestionar horarios" className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
          <HiOutlineClock className="w-5 h-5" />
        </button>
        <button onClick={onServices} title="Asignar servicios" className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
          <HiOutlineWrenchScrewdriver className="w-5 h-5" />
        </button>
        <button onClick={onToggle} className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-brand-100 text-brand-500 hover:bg-brand-500 hover:text-white transition-all shadow-sm">
           Estado
        </button>
        <button onClick={onEdit} className="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 hover:bg-brand-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
          <HiOutlinePencilSquare className="w-5 h-5" />
        </button>
        <button onClick={onDelete} className="w-11 h-11 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
          <HiOutlineTrash className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ─── EmployeeModal ─── */

function EmployeeModal({ isEdit, form, chips, setChips, onField, onSubmit, onClose, submitting }) {
  const [chipInput, setChipInput] = useState('');
  const chipRef = useRef(null);

  const addChip = () => {
    const val = chipInput.trim();
    if (val && !chips.includes(val) && chips.length < 10) {
      setChips([...chips, val]);
      setChipInput('');
    }
  };

  const removeChip = (idx) => setChips(chips.filter((_, i) => i !== idx));

  const handleChipKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addChip(); }
    if (e.key === 'Backspace' && chipInput === '' && chips.length > 0) {
      setChips(chips.slice(0, -1));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-[0_24px_60px_rgba(99,102,241,0.20)] max-w-lg w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            {isEdit ? 'Editar empleado' : 'Nuevo empleado'}
          </h2>
          <button onClick={onClose} disabled={submitting} aria-label="Cerrar"
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors">
            <HiOutlineXMark className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">

          {/* Nombre + Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Nombre <span className="text-danger-text">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => onField('nombre', e.target.value)}
                maxLength={100}
                placeholder="Nombre"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Apellidos <span className="text-danger-text">*</span>
              </label>
              <input
                type="text"
                value={form.apellidos}
                onChange={(e) => onField('apellidos', e.target.value)}
                maxLength={150}
                placeholder="Apellidos"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Email <span className="text-danger-text">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onField('email', e.target.value)}
              maxLength={255}
              placeholder="email@ejemplo.com"
              className="input-field"
              required
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-text-muted mt-1">El email no se puede modificar.</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Teléfono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => onField('telefono', e.target.value)}
              maxLength={20}
              placeholder="612 345 678"
              className="input-field"
            />
          </div>

          {/* Especialidades (chips) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Especialidades</label>
            <div
              className="input-field flex flex-wrap gap-1.5 p-2 min-h-[44px] cursor-text"
              onClick={() => chipRef.current?.focus()}
            >
              {chips.map((chip, i) => (
                <span key={chip} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold px-2 py-0.5 rounded-lg">
                  {chip}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeChip(i); }}
                    className="text-brand-400 hover:text-brand-700 ml-0.5 leading-none"
                    aria-label={`Quitar ${chip}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                ref={chipRef}
                type="text"
                value={chipInput}
                onChange={(e) => setChipInput(e.target.value)}
                onKeyDown={handleChipKey}
                onBlur={addChip}
                placeholder={chips.length === 0 ? 'Escribe y pulsa Enter…' : ''}
                className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm text-text-primary placeholder-text-muted"
                maxLength={50}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">Pulsa Enter para añadir. Máximo 10 especialidades.</p>
          </div>

          {/* Activo toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.activo}
              onClick={() => onField('activo', !form.activo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 ${
                form.activo ? 'bg-brand-500' : 'bg-border-strong'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-text-primary">
              {form.activo ? 'Activo (disponible para citas)' : 'Inactivo (oculto)'}
            </span>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear empleado')}
            </button>
            <button type="button" onClick={onClose} disabled={submitting} className="btn-ghost flex-1">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── ConfirmModal ─── */

function ConfirmModal({ title, message, onConfirm, onClose, loading }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-[0_24px_60px_rgba(99,102,241,0.20)] max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-danger-bg flex items-center justify-center flex-shrink-0">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-danger-text" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
              {title}
            </h2>
            <p className="text-sm text-text-secondary mt-1">{message}</p>
          </div>
          <button onClick={onClose} disabled={loading} aria-label="Cerrar"
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors">
            <HiOutlineXMark className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
          <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1">
            {loading ? 'Procesando…' : 'Confirmar'}
          </button>
          <button onClick={onClose} disabled={loading} className="btn-ghost flex-1">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── AvailabilityModal ─── */

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HORAS_DISP = Array.from({ length: 29 }, (_, i) => {
  const mins = 480 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
});

function AvailabilityModal({ employee, onClose }) {
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({ dia_semana: 0, hora_inicio: '09:00', hora_fin: '17:00' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployeeAvailability(employee.id);
      setSlots(res.data.data || []);
    } catch {
      toast.error('No se pudo cargar la disponibilidad');
    } finally {
      setLoading(false);
    }
  }, [employee.id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (form.hora_fin <= form.hora_inicio) {
      toast.error('La hora de fin debe ser posterior a la de inicio');
      return;
    }
    setSaving(true);
    try {
      await addEmployeeAvailability({ empleado_id: employee.id, ...form, dia_semana: parseInt(form.dia_semana) });
      toast.success('Horario añadido');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al añadir horario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmployeeAvailability(id);
      toast.success('Horario eliminado');
      await load();
    } catch {
      toast.error('Error al eliminar horario');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-[0_24px_60px_rgba(99,102,241,0.20)] max-w-lg w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Horarios de disponibilidad</h2>
            <p className="text-sm text-text-muted mt-0.5">{employee.nombre} {employee.apellidos}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de horarios actuales */}
        <div className="mb-5 space-y-2 min-h-[60px]">
          {loading ? (
            <div className="flex justify-center py-4"><div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">Sin horarios configurados</p>
          ) : (
            slots.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-sky-50 border border-sky-100 rounded-xl px-4 py-2.5">
                <span className="text-sm font-bold text-brand-900">{DIAS[s.dia_semana]}</span>
                <span className="text-sm text-text-secondary font-medium">{s.hora_inicio} – {s.hora_fin}</span>
                <button onClick={() => handleDelete(s.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Formulario añadir */}
        <form onSubmit={handleAdd} className="border-t border-border-base pt-5 space-y-3">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Añadir franja horaria</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Día</label>
              <select value={form.dia_semana} onChange={(e) => setForm((f) => ({ ...f, dia_semana: e.target.value }))} className="input-field text-sm py-2">
                {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Desde</label>
              <select value={form.hora_inicio} onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))} className="input-field text-sm py-2">
                {HORAS_DISP.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Hasta</label>
              <select value={form.hora_fin} onChange={(e) => setForm((f) => ({ ...f, hora_fin: e.target.value }))} className="input-field text-sm py-2">
                {HORAS_DISP.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            <HiOutlinePlus className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Añadir franja'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── ServicesModal ─── */

function ServicesModal({ employee, onClose }) {
  const [allServices, setAllServices]   = useState([]);
  const [assigned, setAssigned]         = useState(new Set());
  const [loading, setLoading]           = useState(true);
  const [toggling, setToggling]         = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getMyServices(), getEmployeeDetail(employee.id)])
      .then(([svcRes, empRes]) => {
        if (!alive) return;
        setAllServices(svcRes.data.data || []);
        const assignedIds = new Set((empRes.data.data?.servicios || []).map((s) => s.id));
        setAssigned(assignedIds);
      })
      .catch(() => toast.error('Error al cargar servicios'))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [employee.id]);

  const toggle = async (svc) => {
    if (toggling) return;
    setToggling(svc.id);
    try {
      if (assigned.has(svc.id)) {
        await removeServiceFromEmployee(employee.id, svc.id);
        setAssigned((prev) => { const s = new Set(prev); s.delete(svc.id); return s; });
        toast.success(`"${svc.nombre}" desasignado`);
      } else {
        await assignServiceToEmployee(employee.id, svc.id);
        setAssigned((prev) => new Set([...prev, svc.id]));
        toast.success(`"${svc.nombre}" asignado`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar asignación');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-[0_24px_60px_rgba(99,102,241,0.20)] max-w-lg w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Servicios asignados</h2>
            <p className="text-sm text-text-muted mt-0.5">{employee.nombre} {employee.apellidos}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : allServices.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No tienes servicios creados aún.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-text-muted mb-3">Activa o desactiva qué servicios puede realizar este empleado.</p>
            {allServices.map((svc) => {
              const isOn = assigned.has(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => toggle(svc)}
                  disabled={toggling === svc.id}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isOn ? 'bg-violet-50 border-violet-200 text-violet-800' : 'bg-white border-border-base text-text-secondary hover:border-violet-200'}`}
                >
                  <div className="text-left">
                    <p className="text-sm font-bold">{svc.nombre}</p>
                    <p className="text-xs text-text-muted">{svc.duracion_min} min · {parseFloat(svc.precio).toFixed(2)} €</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${isOn ? 'bg-violet-500' : 'bg-slate-200'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isOn ? 'left-5' : 'left-1'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button onClick={onClose} className="btn-ghost w-full mt-5">Cerrar</button>
      </div>
    </div>
  );
}
