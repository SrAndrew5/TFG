import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  getMyServices,
  createService,
  updateService,
  deleteService,
} from '../../services/businessService';
import ErrorState from '../../components/shared/ErrorState';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineScissors,
  HiOutlineExclamationTriangle,
  HiOutlineFaceSmile,
} from 'react-icons/hi2';

const CATEGORIAS = ['Corte', 'Color', 'Tratamiento', 'Barba', 'Manicura', 'Otro'];
const DURACIONES = [
  { value: 15,  label: '15 min' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 hora' },
  { value: 90,  label: '1 h 30 min' },
  { value: 120, label: '2 horas' },
];

const EMPTY_FORM = {
  nombre: '', descripcion: '', precio: '', duracion_min: 30, categoria: '', activo: true,
};

export default function BusinessServices() {
  usePageTitle('Mis servicios');

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  // Modal crear/editar
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null); // null = crear
  const [form, setForm]               = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);

  // Modal eliminar
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getMyServices();
      setItems(res.data.data || []);
    } catch {
      setError(true);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      nombre:       item.nombre,
      descripcion:  item.descripcion || '',
      precio:       String(item.precio),
      duracion_min: item.duracion_min,
      categoria:    item.categoria || '',
      activo:       item.activo,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!form.precio || isNaN(Number(form.precio)) || Number(form.precio) <= 0) {
      toast.error('El precio debe ser un número positivo'); return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nombre:       form.nombre.trim(),
        descripcion:  form.descripcion.trim() || null,
        precio:       parseFloat(Number(form.precio).toFixed(2)),
        duracion_min: Number(form.duracion_min),
        categoria:    form.categoria || null,
        activo:       form.activo,
      };
      if (editTarget) {
        await updateService(editTarget.id, payload);
        toast.success('Servicio actualizado');
      } else {
        await createService(payload);
        toast.success('Servicio creado');
      }
      closeModal();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar el servicio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActivo = async (item) => {
    try {
      await updateService(item.id, { activo: !item.activo });
      toast.success(item.activo ? 'Servicio desactivado' : 'Servicio activado');
      await load();
    } catch {
      toast.error('No se pudo cambiar el estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteService(deleteTarget.id);
      toast.success('Servicio desactivado');
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
        <ErrorState message="No se pudieron cargar los servicios." onRetry={load} />
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card border-2 border-dashed border-border-strong p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted">
            <HiOutlineFaceSmile className="w-7 h-7" aria-hidden="true" />
          </div>
          <p className="font-bold text-text-primary mb-1">Aún no tienes servicios</p>
          <p className="text-sm text-text-secondary max-w-xs mx-auto mb-4">
            Crea tu primer servicio para que los clientes puedan reservar citas.
          </p>
          <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" aria-hidden="true" />
            Crear primer servicio
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <ServiceRow
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onToggle={() => handleToggleActivo(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <ServiceModal
          isEdit={!!editTarget}
          form={form}
          onField={handleField}
          onSubmit={handleSubmit}
          onClose={closeModal}
          submitting={submitting}
        />
      )}

      {/* Modal confirmar eliminación */}
      {deleteTarget && (
        <ConfirmModal
          title="Desactivar servicio"
          message={`"${deleteTarget.nombre}" quedará inactivo y no aparecerá para nuevas reservas. El historial de citas se conserva.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

/* ─── ServiceRow ─── */

function ServiceRow({ item, onEdit, onToggle, onDelete }) {
  const durLabel = DURACIONES.find((d) => d.value === item.duracion_min)?.label || `${item.duracion_min} min`;
  return (
    <div className={`profile-content-card !p-6 flex flex-col sm:flex-row sm:items-center gap-6 transition-all duration-300 ${!item.activo ? 'opacity-50 grayscale-[0.5]' : 'hover:shadow-xl hover:scale-[1.005]'}`}>

      {/* Icono Premium */}
      <div className="w-16 h-16 rounded-[1.5rem] bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 shadow-sm">
        <HiOutlineScissors className="w-8 h-8 text-brand-500" aria-hidden="true" />
      </div>

      {/* Info Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-black text-brand-500 tracking-tight">{item.nombre}</h3>
          {item.categoria && (
            <span className="px-2.5 py-1 rounded-lg bg-accent-50 text-accent-700 text-[10px] font-black uppercase tracking-widest border border-accent-100">
              {item.categoria}
            </span>
          )}
        </div>
        {item.descripcion && (
          <p className="text-sm font-medium text-text-muted line-clamp-1 mb-3 leading-relaxed">{item.descripcion}</p>
        )}
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
          <span className="text-brand-900">{parseFloat(item.precio).toFixed(2)}€</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="text-text-muted">{durLabel}</span>
        </div>
      </div>

      {/* Action Group */}
      <div className="flex items-center gap-3 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-8">
        <button
          onClick={onToggle}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
            item.activo
              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-500 hover:text-white'
          }`}
        >
          {item.activo ? 'Publicado' : 'Oculto'}
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

/* ─── ServiceModal ─── */

function ServiceModal({ isEdit, form, onField, onSubmit, onClose, submitting }) {
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
            {isEdit ? 'Editar servicio' : 'Nuevo servicio'}
          </h2>
          <button onClick={onClose} disabled={submitting} aria-label="Cerrar"
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors">
            <HiOutlineXMark className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Nombre <span className="text-danger-text">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => onField('nombre', e.target.value)}
              maxLength={150}
              placeholder="Ej: Corte de cabello"
              className="input-field"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => onField('descripcion', e.target.value.slice(0, 500))}
              rows={2}
              className="input-field resize-none"
              placeholder="Descripción opcional del servicio"
              maxLength={500}
            />
            <p className="text-xs text-text-muted text-right mt-0.5">{form.descripcion.length}/500</p>
          </div>

          {/* Precio + Duración */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Precio (€) <span className="text-danger-text">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.precio}
                onChange={(e) => onField('precio', e.target.value)}
                placeholder="0.00"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Duración <span className="text-danger-text">*</span>
              </label>
              <select
                value={form.duracion_min}
                onChange={(e) => onField('duracion_min', Number(e.target.value))}
                className="input-field cursor-pointer appearance-none"
              >
                {DURACIONES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Categoría</label>
            <select
              value={form.categoria}
              onChange={(e) => onField('categoria', e.target.value)}
              className="input-field cursor-pointer appearance-none"
            >
              <option value="">Sin categoría</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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
              {form.activo ? 'Activo (visible para clientes)' : 'Inactivo (oculto)'}
            </span>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear servicio')}
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

/* ─── ConfirmModal reutilizable ─── */

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
