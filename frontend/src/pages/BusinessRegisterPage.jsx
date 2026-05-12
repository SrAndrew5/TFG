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
} from 'react-icons/hi2';

const STEPS = ['Responsable', 'Negocio', 'Confirmación'];

const DIAS = [
  { id: 'lunes',     label: 'Lunes' },
  { id: 'martes',    label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves',    label: 'Jueves' },
  { id: 'viernes',   label: 'Viernes' },
  { id: 'sabado',    label: 'Sábado' },
  { id: 'domingo',   label: 'Domingo' },
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

export default function BusinessRegisterPage() {
  usePageTitle('Registro de empresa');
  const navigate = useNavigate();

  const [step, setStep]         = useState(0);
  const [showPassword, setShowP] = useState(false);
  const [showConfirm, setShowC]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estado del formulario
  const [form, setForm] = useState({
    // Paso 1
    nombre_responsable: '',
    apellidos_responsable: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono_responsable: '',
    // Paso 2
    nombre: '',
    tipo: 'PELUQUERIA',
    cif_nif: '',
    descripcion: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    telefono: '',
    web: '',
    horario: HORARIO_DEFAULT,
    // Paso 3
    acepta_terminos: false,
    acepta_privacidad: false,
  });

  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const setHorarioDia = (dia, patch) => {
    setForm((f) => ({ ...f, horario: { ...f.horario, [dia]: { ...f.horario[dia], ...patch } } }));
  };

  // ── Validaciones por paso (defensivas — Joi backend valida lo crítico) ──
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

  const prev = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };

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
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.message
        || 'Error al enviar la solicitud';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: '#F8F8FF' }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_4px_16px_rgba(99,102,241,0.30)]">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient-brand">ReservasPro</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
            Registra tu negocio
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Empieza a recibir reservas en minutos. Tu solicitud se revisará en 24-48 horas.
          </p>
        </div>

        {/* Stepper */}
        <Stepper step={step} steps={STEPS} />

        {/* Card principal */}
        <div className="card p-6 sm:p-8 mt-8 animate-fade-in">

          {step === 0 && (
            <Step1
              form={form}
              errors={errors}
              setField={setField}
              showPassword={showPassword}
              setShowP={setShowP}
              showConfirm={showConfirm}
              setShowC={setShowC}
            />
          )}

          {step === 1 && (
            <Step2
              form={form}
              errors={errors}
              setField={setField}
              setHorarioDia={setHorarioDia}
            />
          )}

          {step === 2 && (
            <Step3
              form={form}
              errors={errors}
              setField={setField}
            />
          )}

          {/* Botones de navegación */}
          <div className="flex flex-col sm:flex-row-reverse gap-3 pt-6 mt-6 border-t border-border-base">
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary">
                Siguiente
                <HiOutlineArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
                <HiOutlineCheckCircle className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            {step > 0 && (
              <button type="button" onClick={prev} className="btn-secondary" disabled={submitting}>
                <HiOutlineArrowLeft className="w-4 h-4" aria-hidden="true" />
                Atrás
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-text-secondary">
          ¿Ya tienes cuenta? <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────── Stepper ─────────────────── */

function Stepper({ step, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((label, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-4">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${done   ? 'bg-success text-white' : ''}
              ${active ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]' : ''}
              ${!done && !active ? 'bg-surface-elevated text-text-muted border border-border-base' : ''}`}>
              {done ? <HiOutlineCheckCircle className="w-5 h-5" aria-hidden="true" /> : i + 1}
            </div>
            <span className={`text-xs sm:text-sm font-semibold hidden sm:inline ${active ? 'text-text-primary' : 'text-text-muted'}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-16 h-[2px] ${done ? 'bg-success' : 'bg-border-base'} rounded`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────── Step 1 — Responsable ─────────────────── */

function Step1({ form, errors, setField, showPassword, setShowP, showConfirm, setShowC }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-text-primary mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
        Datos del responsable
      </h2>

      <Field label="Nombre completo" error={errors.nombre_responsable} required icon={HiOutlineUser}>
        <input
          type="text"
          value={form.nombre_responsable}
          onChange={(e) => setField('nombre_responsable', e.target.value)}
          className="input-field pl-11"
          placeholder="Tu nombre"
          autoComplete="name"
        />
      </Field>

      <Field label="Apellidos" icon={HiOutlineUser}>
        <input
          type="text"
          value={form.apellidos_responsable}
          onChange={(e) => setField('apellidos_responsable', e.target.value)}
          className="input-field pl-11"
          placeholder="Tus apellidos"
          autoComplete="family-name"
        />
      </Field>

      <Field label="Email" error={errors.email} required icon={HiOutlineEnvelope}>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          className="input-field pl-11"
          placeholder="tu@email.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Contraseña" error={errors.password} required icon={HiOutlineLockClosed}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={(e) => setField('password', e.target.value)}
          className="input-field pl-11 pr-11"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <button type="button" onClick={() => setShowP((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary"
          aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
          {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
        </button>
      </Field>

      <Field label="Confirmar contraseña" error={errors.confirmPassword} required icon={HiOutlineLockClosed}>
        <input
          type={showConfirm ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={(e) => setField('confirmPassword', e.target.value)}
          className="input-field pl-11 pr-11"
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
        />
        <button type="button" onClick={() => setShowC((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary"
          aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}>
          {showConfirm ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
        </button>
      </Field>

      <Field label="Teléfono de contacto" error={errors.telefono_responsable} required icon={HiOutlinePhone}>
        <input
          type="tel"
          value={form.telefono_responsable}
          onChange={(e) => setField('telefono_responsable', e.target.value)}
          className="input-field pl-11"
          placeholder="+34 600 000 000"
          autoComplete="tel"
        />
      </Field>
    </div>
  );
}

/* ─────────────────── Step 2 — Negocio ─────────────────── */

function Step2({ form, errors, setField, setHorarioDia }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-text-primary mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
        Datos del negocio
      </h2>

      <Field label="Nombre del negocio" error={errors.nombre} required icon={HiOutlineBuildingOffice2}>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => setField('nombre', e.target.value)}
          className="input-field pl-11"
          placeholder="Ej: Peluquería Ana"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Tipo" required>
          <select
            value={form.tipo}
            onChange={(e) => setField('tipo', e.target.value)}
            className="input-field cursor-pointer"
          >
            {TIPO_NEGOCIO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Field>

        <Field label="CIF/NIF" error={errors.cif_nif} required icon={HiOutlineDocumentText}>
          <input
            type="text"
            value={form.cif_nif}
            onChange={(e) => setField('cif_nif', e.target.value.toUpperCase())}
            className="input-field pl-11 uppercase"
            placeholder="B12345678"
            maxLength={9}
          />
        </Field>
      </div>

      <Field label="Descripción" error={errors.descripcion}>
        <textarea
          value={form.descripcion}
          onChange={(e) => setField('descripcion', e.target.value.slice(0, 500))}
          className="input-field resize-none"
          rows={3}
          placeholder="Describe brevemente tu negocio (opcional)"
        />
        <div className="text-right text-xs text-text-muted mt-1">{form.descripcion.length}/500</div>
      </Field>

      <Field label="Dirección" error={errors.direccion} required icon={HiOutlineMapPin}>
        <input
          type="text"
          value={form.direccion}
          onChange={(e) => setField('direccion', e.target.value)}
          className="input-field pl-11"
          placeholder="Calle Mayor, 1"
        />
      </Field>

      <div className="grid grid-cols-2 gap-5">
        <Field label="Ciudad" error={errors.ciudad} required>
          <input
            type="text"
            value={form.ciudad}
            onChange={(e) => setField('ciudad', e.target.value)}
            className="input-field"
            placeholder="Madrid"
          />
        </Field>
        <Field label="Código postal" error={errors.codigo_postal} required>
          <input
            type="text"
            value={form.codigo_postal}
            onChange={(e) => setField('codigo_postal', e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="input-field"
            placeholder="28013"
            inputMode="numeric"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Teléfono del negocio" error={errors.telefono} required icon={HiOutlinePhone}>
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setField('telefono', e.target.value)}
            className="input-field pl-11"
            placeholder="+34 911 234 567"
          />
        </Field>
        <Field label="Web (opcional)" error={errors.web} icon={HiOutlineGlobeAlt}>
          <input
            type="url"
            value={form.web}
            onChange={(e) => setField('web', e.target.value)}
            className="input-field pl-11"
            placeholder="https://tunegocio.es"
          />
        </Field>
      </div>

      {/* Horario semanal */}
      <div className="border-t border-border-base pt-5">
        <label className="block text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <HiOutlineCalendar className="w-4 h-4 text-brand-500" aria-hidden="true" />
          Horario de apertura
        </label>
        <div className="space-y-2">
          {DIAS.map((d) => {
            const dia = form.horario[d.id] || { cerrado: true };
            return (
              <div key={d.id} className="grid grid-cols-12 gap-2 items-center bg-surface-elevated rounded-lg p-2.5">
                <span className="col-span-3 text-sm font-medium text-text-primary">{d.label}</span>
                <label className="col-span-3 flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!dia.cerrado}
                    onChange={(e) => setHorarioDia(d.id, e.target.checked
                      ? { cerrado: true, abre: undefined, cierra: undefined }
                      : { cerrado: false, abre: '09:00', cierra: '20:00' })}
                    className="rounded border-border-strong text-brand-600 focus:ring-brand-500"
                  />
                  Cerrado
                </label>
                <input
                  type="time"
                  disabled={dia.cerrado}
                  value={dia.abre || ''}
                  onChange={(e) => setHorarioDia(d.id, { abre: e.target.value })}
                  className="col-span-3 input-field py-1.5 text-sm disabled:opacity-40"
                />
                <input
                  type="time"
                  disabled={dia.cerrado}
                  value={dia.cierra || ''}
                  onChange={(e) => setHorarioDia(d.id, { cierra: e.target.value })}
                  className="col-span-3 input-field py-1.5 text-sm disabled:opacity-40"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Step 3 — Confirmación ─────────────────── */

function Step3({ form, errors, setField }) {
  const tipoLabel = TIPO_NEGOCIO_OPTIONS.find((t) => t.value === form.tipo)?.label;
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-text-primary mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
        Revisa tus datos
      </h2>

      <div className="space-y-4">
        <SummarySection title="Responsable">
          <SummaryRow label="Nombre"   value={`${form.nombre_responsable} ${form.apellidos_responsable}`.trim()} />
          <SummaryRow label="Email"    value={form.email} />
          <SummaryRow label="Teléfono" value={form.telefono_responsable} />
        </SummarySection>

        <SummarySection title="Negocio">
          <SummaryRow label="Nombre"      value={form.nombre} />
          <SummaryRow label="Tipo"        value={tipoLabel} />
          <SummaryRow label="CIF/NIF"     value={form.cif_nif.toUpperCase()} />
          <SummaryRow label="Dirección"   value={`${form.direccion}, ${form.codigo_postal} ${form.ciudad}`} />
          <SummaryRow label="Teléfono"    value={form.telefono} />
          {form.web && <SummaryRow label="Web" value={form.web} />}
          {form.descripcion && <SummaryRow label="Descripción" value={form.descripcion} />}
        </SummarySection>
      </div>

      {/* Aceptaciones */}
      <div className="space-y-3 pt-4 border-t border-border-base">
        <Checkbox
          checked={form.acepta_terminos}
          onChange={(v) => setField('acepta_terminos', v)}
          error={errors.acepta_terminos}
          label={<>Acepto los <a href="#" className="text-brand-600 hover:text-brand-700 font-semibold">términos y condiciones</a></>}
        />
        <Checkbox
          checked={form.acepta_privacidad}
          onChange={(v) => setField('acepta_privacidad', v)}
          error={errors.acepta_privacidad}
          label={<>Acepto la <a href="#" className="text-brand-600 hover:text-brand-700 font-semibold">política de privacidad</a></>}
        />
      </div>
    </div>
  );
}

function SummarySection({ title, children }) {
  return (
    <div className="bg-surface-elevated rounded-xl p-4 border border-border-base">
      <p className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary text-right break-words">{value || '—'}</span>
    </div>
  );
}

function Checkbox({ checked, onChange, label, error }) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 rounded border-border-strong text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-text-secondary">{label}</span>
      </label>
      {error && (
        <p className="mt-1 ml-7 text-xs text-danger-text flex items-center gap-1">
          <HiOutlineExclamationCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────── Field genérico ─────────────────── */

function Field({ label, error, required, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label} {required && <span className="text-danger-text">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted pointer-events-none" aria-hidden="true" />}
        {children}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-danger-text flex items-center gap-1">
          <HiOutlineExclamationCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
