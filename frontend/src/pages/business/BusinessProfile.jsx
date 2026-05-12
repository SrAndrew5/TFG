import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  updateMyBusiness,
  uploadBusinessLogo,
  uploadBusinessPhoto,
  deleteBusinessPhoto,
  TIPO_NEGOCIO_OPTIONS,
} from '../../services/businessService';
import {
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineCamera,
  HiOutlinePhoto,
  HiOutlineTrash,
  HiOutlineArrowUpTray,
} from 'react-icons/hi2';
import BusinessScheduleForm from '../../components/business/BusinessScheduleForm';

const DIAS = [
  { id: 'lunes',     label: 'Lunes' },
  { id: 'martes',    label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves',    label: 'Jueves' },
  { id: 'viernes',   label: 'Viernes' },
  { id: 'sabado',    label: 'Sábado' },
  { id: 'domingo',   label: 'Domingo' },
];

function Section({ title, icon: Icon, children }) {
  return (
    <div className="profile-content-card !p-8 md:!p-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center shadow-sm">
           <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-black text-brand-500 tracking-tight">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function ReadOnlyField({ label, value, mono = false }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">
        {label}
      </label>
      <div className={`w-full p-5 rounded-2xl bg-surface-subtle border border-slate-100 text-sm font-bold text-brand-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}

export default function BusinessProfile() {
  usePageTitle('Perfil Operativo');
  const { business, loadingBiz, setBusiness } = useOutletContext();

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (business && !form) {
      setForm({
        nombre:        business.nombre || '',
        tipo:          business.tipo || 'OTRO',
        descripcion:   business.descripcion || '',
        direccion:     business.direccion || '',
        ciudad:        business.ciudad || '',
        codigo_postal: business.codigo_postal || '',
        telefono:      business.telefono || '',
        web:           business.web || '',
        horario:       business.horario || {},
        festivos:      business.festivos || [],
      });
    }
  }, [business, form]);

  if (loadingBiz) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!business || !form) {
    return (
      <div className="bg-surface-subtle border-2 border-dashed border-border-base rounded-[3rem] py-32 px-6 text-center animate-fade-in">
        No se pudo cargar la información operativa.
      </div>
    );
  }

  const tipoLabel = TIPO_NEGOCIO_OPTIONS.find((t) => t.value === business.tipo)?.label || business.tipo;

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const updateHorario = (newHorario) => {
    setForm((prev) => ({ ...prev, horario: newHorario }));
    setDirty(true);
  };

  const updateFestivos = (newFestivos) => {
    setForm((prev) => ({ ...prev, festivos: newFestivos }));
    setDirty(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await uploadBusinessLogo(file);
      setBusiness((prev) => ({ ...prev, logo_url: res.data.data.logo_url }));
      toast.success('Logo actualizado');
    } catch {
      toast.error('Error al subir el logo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handlePhotoAdd = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const currentCount = Array.isArray(business.fotos_urls) ? business.fotos_urls.length : 0;
    if (currentCount >= 10) {
      toast.error('Máximo 10 fotos por negocio');
      return;
    }
    setUploadingPhoto(true);
    try {
      const res = await uploadBusinessPhoto(file);
      setBusiness((prev) => ({ ...prev, fotos_urls: res.data.data.fotos_urls }));
      toast.success('Foto añadida');
    } catch {
      toast.error('Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handlePhotoDelete = async (url) => {
    setUploadingPhoto(true);
    try {
      const res = await deleteBusinessPhoto(url);
      setBusiness((prev) => ({ ...prev, fotos_urls: res.data.data.fotos_urls }));
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dirty) return;

    if (form.nombre.trim().length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return;
    }
    if (form.direccion.trim().length < 5) {
      toast.error('La dirección debe tener al menos 5 caracteres');
      return;
    }
    if (!/^\d{5}$/.test(form.codigo_postal)) {
      toast.error('El código postal debe ser de 5 dígitos');
      return;
    }
    if (form.telefono.trim().length < 9) {
      toast.error('El teléfono debe tener al menos 9 dígitos');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre:        form.nombre.trim(),
        tipo:          form.tipo,
        descripcion:   form.descripcion.trim() || null,
        direccion:     form.direccion.trim(),
        ciudad:        form.ciudad.trim(),
        codigo_postal: form.codigo_postal.trim(),
        telefono:      form.telefono.trim(),
        web:           form.web.trim() || null,
        horario:       form.horario,
        festivos:      form.festivos,
      };

      const res = await updateMyBusiness(payload);
      setBusiness(res.data.data);
      setDirty(false);
      toast.success('Perfil operativo actualizado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in pb-20 max-w-5xl">

      {/* Header Premium */}
      <div className="profile-hero !mb-0 !p-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
             Configuración Operativa
          </div>
          <h1 className="profile-hero-name">Perfil de Negocio</h1>
          <p className="profile-hero-email">Administra la identidad y los parámetros operativos de tu empresa.</p>
        </div>
        <button
          type="submit"
          disabled={!dirty || saving}
          className={`bg-white text-brand-900 font-black px-10 py-5 rounded-[2rem] shadow-2xl transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px] ${
            !dirty ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105'
          }`}
        >
          <HiOutlineCheckCircle className="w-6 h-6 text-accent-500" />
          {saving ? 'Sincronizando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          <Section title="Identidad Corporativa" icon={HiOutlineBuildingOffice2}>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">Nombre Comercial</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => update('nombre', e.target.value)}
                className="input-field !rounded-2xl py-4"
                maxLength={150}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">Tipo de Negocio</label>
                <select
                  value={form.tipo}
                  onChange={(e) => update('tipo', e.target.value)}
                  className="input-field !rounded-2xl py-4 appearance-none"
                >
                  {TIPO_NEGOCIO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <ReadOnlyField label="CIF/NIF" value={business.cif_nif} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">Descripción del Negocio</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                className="input-field !rounded-3xl py-4 resize-none"
                rows={4}
                maxLength={500}
                placeholder="Describe tu propuesta de valor..."
              />
              <p className="text-[10px] font-bold text-text-muted text-right mt-2">{form.descripcion.length}/500</p>
            </div>
          </Section>

          <Section title="Contacto y Redes" icon={HiOutlineGlobeAlt}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">Línea Telefónica</label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => update('telefono', e.target.value)}
                    className="input-field !rounded-2xl py-4 pl-14"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">Sitio Web Oficial</label>
                <div className="relative">
                  <HiOutlineGlobeAlt className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                  <input
                    type="url"
                    value={form.web}
                    onChange={(e) => update('web', e.target.value)}
                    className="input-field !rounded-2xl py-4 pl-14"
                    placeholder="https://tuempresa.com"
                  />
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-10">
          <Section title="Ubicación Física" icon={HiOutlineMapPin}>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">Dirección Postal</label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => update('direccion', e.target.value)}
                className="input-field !rounded-2xl py-4"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">Ciudad</label>
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={(e) => update('ciudad', e.target.value)}
                  className="input-field !rounded-2xl py-4"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">C. Postal</label>
                <input
                  type="text"
                  value={form.codigo_postal}
                  onChange={(e) => update('codigo_postal', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="input-field !rounded-2xl py-4 font-mono"
                />
              </div>
            </div>
          </Section>

          <Section title="Horarios y Operativa" icon={HiOutlineCalendar}>
            <BusinessScheduleForm
              horario={form.horario}
              festivos={form.festivos}
              onChangeHorario={updateHorario}
              onChangeFestivos={updateFestivos}
            />
          </Section>
        </div>
      </div>

      {/* ── Galería & Logo ── */}
      <div className="profile-content-card !p-8 md:!p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center shadow-sm">
            <HiOutlinePhoto className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-brand-500 tracking-tight">Imágenes del Negocio</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
          {/* Logo */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 px-1">Logo</label>
            <div className="relative group w-40 h-40">
              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-surface-subtle border-2 border-dashed border-border-base flex items-center justify-center">
                {business.logo_url ? (
                  <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-brand-500">
                    {business.nombre?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-[2rem] bg-brand-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[10px] font-black uppercase tracking-widest"
              >
                <HiOutlineCamera className="w-5 h-5" />
                Cambiar
              </button>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>

          {/* Gallery */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted px-1">
                Galería ({Array.isArray(business.fotos_urls) ? business.fotos_urls.length : 0}/10)
              </label>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {(Array.isArray(business.fotos_urls) ? business.fotos_urls : []).map((url) => (
                <div key={url} className="relative group aspect-square rounded-2xl overflow-hidden bg-surface-subtle">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handlePhotoDelete(url)}
                    disabled={uploadingPhoto}
                    className="absolute inset-0 bg-brand-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 hover:text-red-300"
                    aria-label="Eliminar foto"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {(!Array.isArray(business.fotos_urls) || business.fotos_urls.length < 10) && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="aspect-square rounded-2xl border-2 border-dashed border-border-base bg-surface-subtle hover:border-brand-500 hover:bg-brand-50 transition-all flex flex-col items-center justify-center gap-2 text-text-muted hover:text-brand-500"
                >
                  {uploadingPhoto
                    ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <HiOutlineArrowUpTray className="w-5 h-5" />}
                  <span className="text-[9px] font-black uppercase tracking-widest">Añadir</span>
                </button>
              )}
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoAdd} />
          </div>
        </div>
      </div>
    </form>
  );
}
