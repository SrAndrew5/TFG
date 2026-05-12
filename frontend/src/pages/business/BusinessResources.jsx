import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../api/client';
import ModalPortal from '../../components/shared/ModalPortal';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineBuildingOffice2,
  HiOutlineExclamationTriangle,
  HiOutlineFaceSmile,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineCurrencyEuro,
  HiOutlinePhoto,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

const TIPO_RECURSO_OPTIONS = [
  { value: 'MESA',      label: 'Mesa de trabajo' },
  { value: 'SALA',      label: 'Sala de reuniones' },
  { value: 'PUESTO',    label: 'Puesto individual' },
  { value: 'DESPACHO',  label: 'Despacho privado' },
];

const HORAS = Array.from({ length: 29 }, (_, i) => {
  const totalMinutes = 480 + i * 30; // 08:00 a 22:00 en pasos de 30min
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
});

const EMPTY_FORM = {
  nombre: '',
  tipo: 'MESA',
  descripcion: '',
  capacidad: 1,
  ubicacion: '',
  precio_hora: '',
  equipamiento: '',
  horario_apertura: '08:00',
  horario_cierre: '20:00',
  activo: true,
};

function ToggleBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
      active
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export default function BusinessResources() {
  usePageTitle('Mis Espacios');

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/businesses/resources');
      setItems(res.data.data || []);
    } catch {
      setError(true);
      toast.error('Error al cargar los espacios');
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
      nombre:           item.nombre,
      tipo:             item.tipo,
      descripcion:      item.descripcion || '',
      capacidad:        item.capacidad,
      ubicacion:        item.ubicacion || '',
      precio_hora:      String(item.precio_hora),
      equipamiento:     item.equipamiento || '',
      horario_apertura: item.horario_apertura || '08:00',
      horario_cierre:   item.horario_cierre || '20:00',
      activo:           item.activo,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!form.precio_hora || isNaN(Number(form.precio_hora)) || Number(form.precio_hora) < 0) {
      toast.error('El precio por hora debe ser un número válido');
      return;
    }
    if (form.capacidad < 1) { toast.error('La capacidad mínima es 1'); return; }

    setSubmitting(true);
    try {
      const payload = {
        nombre:           form.nombre.trim(),
        tipo:             form.tipo,
        descripcion:      form.descripcion.trim() || null,
        capacidad:        Number(form.capacidad),
        ubicacion:        form.ubicacion.trim() || null,
        precio_hora:      Number(form.precio_hora),
        equipamiento:     form.equipamiento.trim() || null,
        horario_apertura: form.horario_apertura,
        horario_cierre:   form.horario_cierre,
        activo:           form.activo,
      };

      if (editTarget) {
        await api.put(`/businesses/resources/${editTarget.id}`, payload);
        toast.success('Espacio actualizado');
      } else {
        await api.post('/businesses/resources', payload);
        toast.success('Espacio creado');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el espacio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await api.put(`/businesses/resources/${item.id}`, { activo: !item.activo });
      toast.success(`Espacio ${!item.activo ? 'activado' : 'desactivado'}`);
      load();
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/businesses/resources/${deleteTarget.id}`);
      toast.success('Espacio eliminado');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar el espacio');
    } finally {
      setDeleting(false);
    }
  };

  const upd = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="space-y-10 animate-fade-in pb-20">

      {/* Hero Header */}
      <div className="profile-hero !mb-0">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
            Gestión de Espacios
          </div>
          <h1 className="profile-hero-name">Mis Espacios &amp; Recursos</h1>
          <p className="profile-hero-email">
            {loading ? '…' : `${items.length} espacio${items.length !== 1 ? 's' : ''} registrado${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-3 bg-white text-brand-900 font-black px-8 py-4 rounded-[2rem] shadow-2xl hover:scale-105 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
        >
          <HiOutlinePlus className="w-5 h-5 text-accent-500" />
          Añadir Espacio
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="profile-content-card p-16 text-center">
          <HiOutlineExclamationTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="font-black text-red-600">Error al cargar los espacios</p>
          <button onClick={load} className="mt-4 px-6 py-3 bg-brand-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest">
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="profile-content-card py-32 text-center">
          <HiOutlineFaceSmile className="w-14 h-14 text-brand-200 mx-auto mb-6" />
          <p className="font-black text-brand-500 text-xl mb-2">Sin espacios todavía</p>
          <p className="text-text-secondary text-sm max-w-xs mx-auto mb-8">
            Crea tu primer espacio o sala para que los clientes puedan hacer reservas.
          </p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-brand-500 text-white font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-brand-600 transition-colors">
            <HiOutlinePlus className="w-4 h-4" /> Crear primer espacio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className={`profile-content-card !p-0 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${!item.activo ? 'opacity-60' : ''}`}
            >
              {/* Card Top Banner */}
              <div className="bg-gradient-to-br from-brand-900 to-brand-800 p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <HiOutlineBuildingOffice2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-lg leading-tight truncate">{item.nombre}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-400 mt-0.5">
                    {TIPO_RECURSO_OPTIONS.find(t => t.value === item.tipo)?.label || item.tipo}
                  </p>
                </div>
                <ToggleBadge active={item.activo} />
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 space-y-4">
                {item.descripcion && (
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">{item.descripcion}</p>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface-subtle rounded-2xl p-3 text-center">
                    <HiOutlineUsers className="w-4 h-4 text-brand-400 mx-auto mb-1" />
                    <p className="text-xs font-black text-brand-900">{item.capacidad}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">personas</p>
                  </div>
                  <div className="bg-surface-subtle rounded-2xl p-3 text-center">
                    <HiOutlineCurrencyEuro className="w-4 h-4 text-accent-500 mx-auto mb-1" />
                    <p className="text-xs font-black text-brand-900">{parseFloat(item.precio_hora).toFixed(0)}€</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">por hora</p>
                  </div>
                  <div className="bg-surface-subtle rounded-2xl p-3 text-center">
                    <HiOutlineClock className="w-4 h-4 text-brand-400 mx-auto mb-1" />
                    <p className="text-[9px] font-black text-brand-900">{item.horario_apertura}</p>
                    <p className="text-[9px] font-black text-brand-900">{item.horario_cierre}</p>
                  </div>
                </div>

                {item.ubicacion && (
                  <p className="text-xs font-bold text-text-muted truncate">📍 {item.ubicacion}</p>
                )}

                {item.equipamiento && (
                  <p className="text-xs text-text-secondary line-clamp-1">🔧 {item.equipamiento}</p>
                )}
              </div>

              {/* Card Actions */}
              <div className="px-6 pb-6 grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleToggle(item)}
                  title={item.activo ? 'Desactivar' : 'Activar'}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    item.activo
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {item.activo ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  {item.activo ? 'Ocultar' : 'Activar'}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="flex items-center justify-center gap-2 py-3 bg-brand-50 text-brand-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-100 transition-all"
                >
                  <HiOutlinePencilSquare className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR ── */}
      {modalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div onClick={() => setModalOpen(false)} className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm" />
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
              
              <div className="bg-gradient-to-br from-brand-900 to-brand-800 rounded-t-[2.5rem] p-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-400 mb-1">
                    {editTarget ? 'Editar Espacio' : 'Nuevo Espacio'}
                  </p>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {editTarget ? editTarget.nombre : 'Crear Espacio'}
                  </h3>
                </div>
                <button onClick={() => setModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                  <HiOutlineXMark className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                
                {/* Nombre + Tipo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Nombre del espacio *</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={e => upd('nombre', e.target.value)}
                      className="input-field !rounded-2xl py-4"
                      placeholder="Sala A / Mesa 1..."
                      maxLength={150}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Tipo de espacio *</label>
                    <select
                      value={form.tipo}
                      onChange={e => upd('tipo', e.target.value)}
                      className="input-field !rounded-2xl py-4"
                    >
                      {TIPO_RECURSO_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={e => upd('descripcion', e.target.value)}
                    className="input-field !rounded-2xl py-4 resize-none"
                    rows={3}
                    placeholder="Describe el espacio, sus características..."
                    maxLength={500}
                  />
                </div>

                {/* Capacidad + Precio */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Capacidad (personas) *</label>
                    <div className="relative">
                      <HiOutlineUsers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                      <input
                        type="number"
                        value={form.capacidad}
                        onChange={e => upd('capacidad', Math.max(1, parseInt(e.target.value) || 1))}
                        className="input-field !rounded-2xl py-4 pl-12"
                        min={1}
                        max={500}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Precio por hora (€) *</label>
                    <div className="relative">
                      <HiOutlineCurrencyEuro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-500" />
                      <input
                        type="number"
                        value={form.precio_hora}
                        onChange={e => upd('precio_hora', e.target.value)}
                        className="input-field !rounded-2xl py-4 pl-12"
                        min={0}
                        step={0.5}
                        placeholder="15.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Horario apertura / cierre */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Horario de disponibilidad</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1.5 px-1">Apertura</label>
                      <div className="relative">
                        <HiOutlineClock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                        <select
                          value={form.horario_apertura}
                          onChange={e => upd('horario_apertura', e.target.value)}
                          className="input-field !rounded-2xl py-4 pl-12"
                        >
                          {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted mb-1.5 px-1">Cierre</label>
                      <div className="relative">
                        <HiOutlineClock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                        <select
                          value={form.horario_cierre}
                          onChange={e => upd('horario_cierre', e.target.value)}
                          className="input-field !rounded-2xl py-4 pl-12"
                        >
                          {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Ubicación interna</label>
                  <input
                    type="text"
                    value={form.ubicacion}
                    onChange={e => upd('ubicacion', e.target.value)}
                    className="input-field !rounded-2xl py-4"
                    placeholder="Planta 2 / Edificio A..."
                    maxLength={200}
                  />
                </div>

                {/* Equipamiento */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Equipamiento incluido</label>
                  <textarea
                    value={form.equipamiento}
                    onChange={e => upd('equipamiento', e.target.value)}
                    className="input-field !rounded-2xl py-4 resize-none"
                    rows={2}
                    placeholder="TV, pizarra, proyector, WiFi..."
                    maxLength={500}
                  />
                </div>

                {/* Activo toggle */}
                <div className="flex items-center justify-between bg-surface-subtle p-5 rounded-2xl">
                  <div>
                    <p className="font-black text-brand-900 text-sm">Estado del espacio</p>
                    <p className="text-xs text-text-secondary mt-0.5">Si está inactivo, los clientes no podrán reservarlo</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => upd('activo', !form.activo)}
                    className={`w-14 h-7 rounded-full transition-colors duration-300 relative ${form.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${form.activo ? 'translate-x-7' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Nota fotos */}
                <div className="flex items-start gap-3 p-4 bg-brand-50 rounded-2xl border border-brand-100">
                  <HiOutlinePhoto className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-brand-700 font-medium">
                    Las fotos del negocio se gestionan desde <strong>Mi Perfil → Fotos</strong>. Cada espacio hereda las fotos del negocio.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl bg-surface-subtle text-brand-900 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 rounded-2xl bg-brand-500 text-white font-black text-xs uppercase tracking-widest hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiOutlineCheckCircle className="w-4 h-4" />
                    )}
                    {editTarget ? 'Guardar cambios' : 'Crear espacio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── MODAL ELIMINAR ── */}
      {deleteTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm" />
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md animate-fade-in p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <HiOutlineExclamationTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-brand-900 mb-2">¿Eliminar espacio?</h3>
              <p className="text-text-secondary text-sm mb-2">
                Vas a eliminar <strong>{deleteTarget.nombre}</strong>.
              </p>
              <p className="text-text-secondary text-sm mb-8">
                Las reservas existentes no se verán afectadas, pero no se podrán crear nuevas.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-4 rounded-2xl bg-surface-subtle text-brand-900 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineTrash className="w-4 h-4" />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
