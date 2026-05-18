import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { registerBusiness, TIPO_NEGOCIO_OPTIONS } from '../services/businessService';
import {
  HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone,
  HiOutlineBuildingOffice2, HiOutlineMapPin, HiOutlineGlobeAlt, HiOutlineDocumentText,
  HiOutlineEye, HiOutlineEyeSlash, HiOutlineArrowRight, HiOutlineArrowLeft,
  HiOutlineCheckCircle, HiOutlineCalendar, HiOutlineExclamationCircle,
  HiOutlineShieldCheck, HiOutlineRocketLaunch, HiOutlineStar,
} from 'react-icons/hi2';

const STEPS = ['Responsable', 'Negocio', 'Confirmación'];

const DIAS = [
  { id: 'lunes',     label: 'Lun' },
  { id: 'martes',    label: 'Mar' },
  { id: 'miercoles', label: 'Mié' },
  { id: 'jueves',    label: 'Jue' },
  { id: 'viernes',   label: 'Vie' },
  { id: 'sabado',    label: 'Sáb' },
  { id: 'domingo',   label: 'Dom' },
];

const HORARIO_DEFAULT = {
  lunes:     { abre: '09:00', cierra: '20:00', cerrado: false },
  martes:    { abre: '09:00', cierra: '20:00', cerrado: false },
  miercoles: { abre: '09:00', cierra: '20:00', cerrado: false },
  jueves:    { abre: '09:00', cierra: '20:00', cerrado: false },
  viernes:   { abre: '09:00', cierra: '20:00', cerrado: false },
  sabado:    { abre: '10:00', cierra: '14:00', cerrado: false },
  domingo:   { cerrado: true },
};

const BENEFITS = [
  { icon: HiOutlineRocketLaunch, text: 'Activo en menos de 48h' },
  { icon: HiOutlineShieldCheck,  text: 'Plataforma segura y verificada' },
  { icon: HiOutlineStar,         text: 'Panel de gestión completo' },
  { icon: HiOutlineCheckCircle,  text: 'Sin permanencia ni costes ocultos' },
];

export default function BusinessRegisterPage() {
  usePageTitle('Registro de empresa');
  const navigate = useNavigate();

  const [step, setStep]             = useState(0);
  const [showPassword, setShowP]    = useState(false);
  const [showConfirm, setShowC]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nombre_responsable: '', apellidos_responsable: '',
    email: '', password: '', confirmPassword: '', telefono_responsable: '',
    nombre: '', tipo: 'PELUQUERIA', cif_nif: '', descripcion: '',
    direccion: '', ciudad: '', codigo_postal: '', telefono: '', web: '',
    horario: HORARIO_DEFAULT,
    acepta_terminos: false, acepta_privacidad: false,
  });

  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const setHorarioDia = (dia, patch) => {
    setForm((f) => ({ ...f, horario: { ...f.horario, [dia]: { ...f.horario[dia], ...patch } } }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.nombre_responsable.trim()) e.nombre_responsable = 'Nombre obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    if (!form.telefono_responsable.trim() || form.telefono_responsable.trim().length < 9) e.telefono_responsable = 'Teléfono inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'Nombre del negocio obligatorio';
    if (!/^[A-Z0-9]{8,9}$/i.test(form.cif_nif.trim())) e.cif_nif = 'CIF/NIF inválido (8-9 alfanuméricos)';
    if (!form.direccion.trim()) e.direccion = 'Dirección obligatoria';
    if (!form.ciudad.trim()) e.ciudad = 'Ciudad obligatoria';
    if (!/^\d{5}$/.test(form.codigo_postal)) e.codigo_postal = 'Código postal inválido (5 dígitos)';
    if (!form.telefono.trim() || form.telefono.trim().length < 9) e.telefono = 'Teléfono inválido';
    if (form.descripcion && form.descripcion.length > 500) e.descripcion = 'Máximo 500 caracteres';
    if (form.web && !/^https?:\/\/.+\..+/.test(form.web)) e.web = 'URL inválida (debe empezar por http:// o https://)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!form.acepta_terminos) e.acepta_terminos = 'Debes aceptar los términos';
    if (!form.acepta_privacidad) e.acepta_privacidad = 'Debes aceptar la política de privacidad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prev = () => { setErrors({}); setStep((s) => Math.max(0, s - 1)); };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSubmitting(true);
    try {
      const payload = {
        nombre_responsable:    form.nombre_responsable.trim(),
        apellidos_responsable: form.apellidos_responsable.trim() || form.nombre_responsable.trim(),
        email:                 form.email.trim().toLowerCase(),
        password:              form.password,
        telefono_responsable:  form.telefono_responsable.trim(),
        nombre:                form.nombre.trim(),
        tipo:                  form.tipo,
        cif_nif:               form.cif_nif.trim().toUpperCase(),
        descripcion:           form.descripcion.trim() || null,
        direccion:             form.direccion.trim(),
        ciudad:                form.ciudad.trim(),
        codigo_postal:         form.codigo_postal.trim(),
        telefono:              form.telefono.trim(),
        web:                   form.web.trim() || null,
        horario:               form.horario,
        acepta_terminos:       form.acepta_terminos,
        acepta_privacidad:     form.acepta_privacidad,
      };
      await registerBusiness(payload);
      toast.success('Solicitud enviada correctamente');
      navigate('/registro-empresa/pendiente');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Panel Izquierdo (sticky) ── */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-brand-900 flex-col justify-between p-14 sticky top-0 h-screen overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-700/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">RESERVAS TFG</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-black leading-[0.95] tracking-tighter text-white mb-4">
              Registra tu <br />
              <span className="text-accent-500">negocio</span> y <br />
              crece online.
            </h2>
            <p className="text-brand-100/70 font-medium leading-relaxed">
              Únete a la plataforma y empieza a recibir reservas de clientes en minutos.
            </p>
          </div>

          <div className="space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-accent-500" />
                </div>
                <span className="text-sm font-bold text-brand-200">{text}</span>
              </div>
            ))}
          </div>

          {/* Stepper lateral */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            {STEPS.map((label, i) => {
              const done   = i < step;
              const active = i === step;
              return (
                <div key={label} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
                    done   ? 'bg-success-bg text-success-text' :
                    active ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30' :
                             'bg-white/10 text-brand-400'
                  }`}>
                    {done ? <HiOutlineCheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-black tracking-tight ${active ? 'text-white' : done ? 'text-brand-300' : 'text-brand-500'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative z-10 text-xs text-brand-500 font-bold">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-accent-500 hover:underline">Inicia sesión</Link>
        </p>
      </div>

      {/* ── Panel Derecho (formulario) ── */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="max-w-2xl mx-auto px-6 sm:px-10 py-12">

          {/* Stepper móvil */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            {STEPS.map((label, i) => {
              const done   = i < step;
              const active = i === step;
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    done ? 'bg-success-bg text-success-text' :
                    active ? 'bg-accent-500 text-white' : 'bg-white border border-border-base text-text-muted'
                  }`}>
                    {done ? <HiOutlineCheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-black hidden sm:block ${active ? 'text-brand-500' : 'text-text-muted'}`}>{label}</span>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-accent-500' : 'bg-border-base'}`} />}
                </div>
              );
            })}
          </div>

          <div className="animate-fade-up">
            {step === 0 && <Step1 form={form} errors={errors} setField={setField} showPassword={showPassword} setShowP={setShowP} showConfirm={showConfirm} setShowC={setShowC} />}
            {step === 1 && <Step2 form={form} errors={errors} setField={setField} setHorarioDia={setHorarioDia} />}
            {step === 2 && <Step3 form={form} errors={errors} setField={setField} />}

            {/* Navegación */}
            <div className="flex flex-col sm:flex-row-reverse gap-3 pt-8 mt-8 border-t border-border-base">
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} className="btn-primary">
                  Siguiente <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary disabled:opacity-50">
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><HiOutlineCheckCircle className="w-4 h-4" /> Enviar solicitud</>
                  )}
                </button>
              )}
              {step > 0 && (
                <button type="button" onClick={prev} disabled={submitting} className="btn-secondary">
                  <HiOutlineArrowLeft className="w-4 h-4" /> Atrás
                </button>
              )}
            </div>

            <p className="text-center mt-6 text-sm text-text-muted lg:hidden">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-brand-500 font-black hover:underline">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1 ─── */
function Step1({ form, errors, setField, showPassword, setShowP, showConfirm, setShowC }) {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-2">Datos del responsable</h1>
        <p className="text-text-secondary font-medium">La persona que gestionará el panel de negocio.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Nombre" error={errors.nombre_responsable} required icon={HiOutlineUser}>
          <input type="text" value={form.nombre_responsable} onChange={(e) => setField('nombre_responsable', e.target.value)}
            className="input-field pl-12" placeholder="Tu nombre" autoComplete="given-name" />
        </Field>
        <Field label="Apellidos" icon={HiOutlineUser}>
          <input type="text" value={form.apellidos_responsable} onChange={(e) => setField('apellidos_responsable', e.target.value)}
            className="input-field pl-12" placeholder="Tus apellidos" autoComplete="family-name" />
        </Field>
      </div>

      <Field label="Email" error={errors.email} required icon={HiOutlineEnvelope}>
        <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
          className="input-field pl-12" placeholder="tu@email.com" autoComplete="email" />
      </Field>

      <Field label="Contraseña" error={errors.password} required icon={HiOutlineLockClosed}>
        <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setField('password', e.target.value)}
          className="input-field pl-12 pr-12" placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
        <button type="button" onClick={() => setShowP((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-500 transition-colors">
          {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
        </button>
      </Field>

      <Field label="Confirmar contraseña" error={errors.confirmPassword} required icon={HiOutlineLockClosed}>
        <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)}
          className="input-field pl-12 pr-12" placeholder="Repite tu contraseña" autoComplete="new-password" />
        <button type="button" onClick={() => setShowC((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-500 transition-colors">
          {showConfirm ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
        </button>
      </Field>

      <Field label="Teléfono de contacto" error={errors.telefono_responsable} required icon={HiOutlinePhone}>
        <input type="tel" value={form.telefono_responsable} onChange={(e) => setField('telefono_responsable', e.target.value)}
          className="input-field pl-12" placeholder="+34 600 000 000" autoComplete="tel" />
      </Field>
    </div>
  );
}

/* ─── Step 2 ─── */
function Step2({ form, errors, setField, setHorarioDia }) {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-2">Datos del negocio</h1>
        <p className="text-text-secondary font-medium">Información que verán tus clientes en el perfil público.</p>
      </div>

      <Field label="Nombre del negocio" error={errors.nombre} required icon={HiOutlineBuildingOffice2}>
        <input type="text" value={form.nombre} onChange={(e) => setField('nombre', e.target.value)}
          className="input-field pl-12" placeholder="Ej: Peluquería Ana" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-sm font-bold text-brand-500 px-1">Tipo <span className="text-red-500">*</span></label>
          <select value={form.tipo} onChange={(e) => setField('tipo', e.target.value)}
            className="input-field cursor-pointer">
            {TIPO_NEGOCIO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <Field label="CIF/NIF" error={errors.cif_nif} required icon={HiOutlineDocumentText}>
          <input type="text" value={form.cif_nif} onChange={(e) => setField('cif_nif', e.target.value.toUpperCase())}
            className="input-field pl-12 uppercase" placeholder="B12345678" maxLength={9} />
        </Field>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-brand-500 px-1">Descripción</label>
        <textarea value={form.descripcion} onChange={(e) => setField('descripcion', e.target.value.slice(0, 500))}
          className="input-field resize-none" rows={3} placeholder="Describe brevemente tu negocio (opcional)" />
        <p className="text-right text-xs text-text-muted pr-1">{form.descripcion.length}/500</p>
        {errors.descripcion && <p className="text-xs text-danger-text flex items-center gap-1"><HiOutlineExclamationCircle className="w-3.5 h-3.5" />{errors.descripcion}</p>}
      </div>

      <Field label="Dirección" error={errors.direccion} required icon={HiOutlineMapPin}>
        <input type="text" value={form.direccion} onChange={(e) => setField('direccion', e.target.value)}
          className="input-field pl-12" placeholder="Calle Mayor, 1" />
      </Field>

      <div className="grid grid-cols-2 gap-5">
        <Field label="Ciudad" error={errors.ciudad} required>
          <input type="text" value={form.ciudad} onChange={(e) => setField('ciudad', e.target.value)}
            className="input-field" placeholder="Madrid" />
        </Field>
        <Field label="Código postal" error={errors.codigo_postal} required>
          <input type="text" value={form.codigo_postal} onChange={(e) => setField('codigo_postal', e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="input-field" placeholder="28013" inputMode="numeric" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Teléfono del negocio" error={errors.telefono} required icon={HiOutlinePhone}>
          <input type="tel" value={form.telefono} onChange={(e) => setField('telefono', e.target.value)}
            className="input-field pl-12" placeholder="+34 911 234 567" />
        </Field>
        <Field label="Web (opcional)" error={errors.web} icon={HiOutlineGlobeAlt}>
          <input type="url" value={form.web} onChange={(e) => setField('web', e.target.value)}
            className="input-field pl-12" placeholder="https://tunegocio.es" />
        </Field>
      </div>

      {/* Horario */}
      <div className="bg-white border border-border-base rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <HiOutlineCalendar className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-black text-brand-500 uppercase tracking-widest">Horario de apertura</p>
            <p className="text-xs text-text-muted font-medium">Marca "Cerrado" los días que no abres</p>
          </div>
        </div>
        <div className="space-y-3">
          {DIAS.map((d) => {
            const dia = form.horario[d.id] || { cerrado: true };
            return (
              <div key={d.id} className="flex items-center gap-3 bg-surface-subtle rounded-2xl px-4 py-3">
                <span className="w-8 text-xs font-black text-brand-500 uppercase tracking-widest flex-shrink-0">{d.label}</span>
                <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                  <input type="checkbox" checked={!!dia.cerrado}
                    onChange={(e) => setHorarioDia(d.id, e.target.checked
                      ? { cerrado: true, abre: undefined, cierra: undefined }
                      : { cerrado: false, abre: '09:00', cierra: '20:00' })}
                    className="rounded" />
                  <span className="text-xs font-bold text-text-secondary">Cerrado</span>
                </label>
                <input type="time" disabled={dia.cerrado} value={dia.abre || ''} onChange={(e) => setHorarioDia(d.id, { abre: e.target.value })}
                  className="flex-1 input-field py-2 text-xs disabled:opacity-30 min-w-0" />
                <span className="text-xs text-text-muted font-bold flex-shrink-0">—</span>
                <input type="time" disabled={dia.cerrado} value={dia.cierra || ''} onChange={(e) => setHorarioDia(d.id, { cierra: e.target.value })}
                  className="flex-1 input-field py-2 text-xs disabled:opacity-30 min-w-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3 ─── */
function Step3({ form, errors, setField }) {
  const tipoLabel = TIPO_NEGOCIO_OPTIONS.find((t) => t.value === form.tipo)?.label;
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-2">Revisa y confirma</h1>
        <p className="text-text-secondary font-medium">Comprueba que todo está correcto antes de enviar.</p>
      </div>

      <div className="space-y-4">
        <SummarySection title="Responsable" icon={HiOutlineUser}>
          <SummaryRow label="Nombre"   value={`${form.nombre_responsable} ${form.apellidos_responsable}`.trim()} />
          <SummaryRow label="Email"    value={form.email} />
          <SummaryRow label="Teléfono" value={form.telefono_responsable} />
        </SummarySection>

        <SummarySection title="Negocio" icon={HiOutlineBuildingOffice2}>
          <SummaryRow label="Nombre"    value={form.nombre} />
          <SummaryRow label="Tipo"      value={tipoLabel} />
          <SummaryRow label="CIF/NIF"   value={form.cif_nif.toUpperCase()} />
          <SummaryRow label="Dirección" value={`${form.direccion}, ${form.codigo_postal} ${form.ciudad}`} />
          <SummaryRow label="Teléfono"  value={form.telefono} />
          {form.web && <SummaryRow label="Web" value={form.web} />}
          {form.descripcion && <SummaryRow label="Descripción" value={form.descripcion} />}
        </SummarySection>
      </div>

      <div className="bg-white border border-border-base rounded-[2rem] p-6 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-text-muted">Términos legales</p>
        <Checkbox checked={form.acepta_terminos} onChange={(v) => setField('acepta_terminos', v)} error={errors.acepta_terminos}
          label={<>Acepto los <a href="#" className="text-brand-500 font-black hover:underline">términos y condiciones</a></>} />
        <Checkbox checked={form.acepta_privacidad} onChange={(v) => setField('acepta_privacidad', v)} error={errors.acepta_privacidad}
          label={<>Acepto la <a href="#" className="text-brand-500 font-black hover:underline">política de privacidad</a></>} />
      </div>
    </div>
  );
}

function SummarySection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-border-base rounded-[2rem] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-brand-500" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-brand-500">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1 border-b border-slate-50 last:border-0">
      <span className="text-text-muted font-medium">{label}</span>
      <span className="font-black text-brand-500 text-right break-words max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

function Checkbox({ checked, onChange, label, error }) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${checked ? 'bg-brand-500 border-brand-500' : 'border-border-base group-hover:border-brand-400'}`}
          onClick={() => onChange(!checked)}>
          {checked && <HiOutlineCheckCircle className="w-3.5 h-3.5 text-white" />}
        </div>
        <span className="text-sm text-text-secondary font-medium">{label}</span>
      </label>
      {error && (
        <p className="mt-1 ml-8 text-xs text-danger-text flex items-center gap-1">
          <HiOutlineExclamationCircle className="w-3.5 h-3.5" />{error}
        </p>
      )}
    </div>
  );
}

function Field({ label, error, required, icon: Icon, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-brand-500 px-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors pointer-events-none" />}
        {children}
      </div>
      {error && (
        <p className="text-xs text-danger-text flex items-center gap-1 px-1">
          <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}
