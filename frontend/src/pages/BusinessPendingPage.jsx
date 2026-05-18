import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBusiness } from '../services/businessService';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlinePauseCircle, HiOutlineEnvelope, HiOutlineArrowRight,
  HiOutlineBuildingOffice2, HiOutlineShieldCheck, HiOutlineRocketLaunch,
} from 'react-icons/hi2';

const STATE_META = {
  PENDIENTE: {
    Icon: HiOutlineClock,
    iconBg: 'bg-warning-bg', iconColor: 'text-warning-text',
    title: '¡Solicitud enviada!',
    message: 'Estamos revisando tu solicitud. Recibirás un email cuando tu negocio sea aprobado.',
    motivoBg: '', motivoBorder: '', motivoText: '',
  },
  ACTIVO: {
    Icon: HiOutlineCheckCircle,
    iconBg: 'bg-success-bg', iconColor: 'text-success-text',
    title: 'Tu negocio está activo',
    message: 'Redirigiendo al panel…',
    motivoBg: '', motivoBorder: '', motivoText: '',
  },
  RECHAZADO: {
    Icon: HiOutlineXCircle,
    iconBg: 'bg-danger-bg', iconColor: 'text-danger-text',
    title: 'Solicitud no aprobada',
    message: 'Tu solicitud no ha sido aprobada. Revisa el motivo y contacta con soporte si procede.',
    motivoBg: 'bg-red-50', motivoBorder: 'border-red-400', motivoText: 'text-red-800',
  },
  SUSPENDIDO: {
    Icon: HiOutlinePauseCircle,
    iconBg: 'bg-orange-100', iconColor: 'text-orange-700',
    title: 'Negocio suspendido',
    message: 'Tu negocio está temporalmente suspendido y no acepta nuevas reservas.',
    motivoBg: 'bg-orange-50', motivoBorder: 'border-orange-400', motivoText: 'text-orange-800',
  },
};

export default function BusinessPendingPage() {
  usePageTitle('Solicitud en revisión');
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user || user.rol !== 'BUSINESS_OWNER') { setLoading(false); return; }
    getMyBusiness()
      .then((res) => {
        const b = res.data.data;
        setBusiness(b);
        if (b.estado === 'ACTIVO') navigate('/business/dashboard', { replace: true });
      })
      .catch(() => setBusiness(null))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const meta = STATE_META[business?.estado] || STATE_META.PENDIENTE;
  const Icon = meta.Icon;

  return (
    <div className="min-h-screen flex">

      {/* ── Panel Izquierdo ── */}
      <div className="hidden lg:flex lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-brand-900 flex-col justify-between p-14 sticky top-0 h-screen overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-700/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg">
            <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">RESERVAS TFG</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-black leading-[0.95] tracking-tighter text-white">
            Tu negocio <br />
            en <span className="text-accent-500">revisión</span>.
          </h2>
          <p className="text-brand-100/70 font-medium leading-relaxed">
            Nuestro equipo revisa cada solicitud para garantizar la calidad de la plataforma.
          </p>
          <div className="space-y-4 pt-4 border-t border-white/10">
            {[
              { icon: HiOutlineShieldCheck,   text: 'Revisión en 24-48 horas hábiles' },
              { icon: HiOutlineEnvelope,       text: 'Te avisamos por email al aprobar' },
              { icon: HiOutlineRocketLaunch,   text: 'Acceso inmediato al panel tras aprobación' },
            ].map(({ icon: I, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <I className="w-4 h-4 text-accent-500" />
                </div>
                <span className="text-sm font-bold text-brand-200">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-brand-500 font-bold">
          ¿Necesitas ayuda?{' '}
          <a href="mailto:soporte@reservaspro.com" className="text-accent-500 hover:underline">Contacta con soporte</a>
        </p>
      </div>

      {/* ── Panel Derecho ── */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-16" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="w-full max-w-lg animate-fade-up">

          {/* Estado icon */}
          <div className={`w-24 h-24 mx-auto mb-8 rounded-[2rem] flex items-center justify-center ${meta.iconBg} shadow-sm`}>
            <Icon className={`w-12 h-12 ${meta.iconColor}`} />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-3">{meta.title}</h1>
            <p className="text-text-secondary font-medium leading-relaxed">{meta.message}</p>
            {business?.nombre && (
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white border border-border-base rounded-2xl">
                <HiOutlineBuildingOffice2 className="w-4 h-4 text-accent-500" />
                <span className="text-sm font-black text-brand-500">{business.nombre}</span>
              </div>
            )}
          </div>

          {/* Email tip — solo en PENDIENTE */}
          {(business?.estado === 'PENDIENTE' || !business) && (
            <div className="bg-white border border-border-base rounded-[2rem] p-6 mb-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <HiOutlineEnvelope className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-black text-brand-500 mb-1">Revisa tu email</p>
                <p className="text-sm text-text-secondary font-medium">
                  Te enviaremos un aviso a <span className="font-black text-brand-500">{business?.owner?.email || user?.email || 'tu correo'}</span> en cuanto aprobemos tu solicitud.
                </p>
              </div>
            </div>
          )}

          {/* Motivo rechazo/suspensión */}
          {(business?.estado === 'RECHAZADO' || business?.estado === 'SUSPENDIDO') && business?.motivo_rechazo && (
            <div className={`${meta.motivoBg} border-l-4 ${meta.motivoBorder} rounded-2xl p-5 mb-6`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${meta.motivoText} mb-2`}>Motivo</p>
              <p className={`text-sm font-medium ${meta.motivoText}`}>{business.motivo_rechazo}</p>
            </div>
          )}

          {/* Pasos que vienen */}
          {(business?.estado === 'PENDIENTE' || !business) && (
            <div className="bg-white border border-border-base rounded-[2rem] p-6 mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">¿Qué pasa ahora?</p>
              <div className="space-y-4">
                {[
                  { n: '1', text: 'Nuestro equipo revisa tu solicitud y documentación' },
                  { n: '2', text: 'Recibes un email de confirmación con el acceso' },
                  { n: '3', text: 'Accedes a tu panel y empiezas a gestionar reservas' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-black text-brand-500">{n}</span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="btn-secondary flex-1 justify-center">
              Volver al inicio <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
            {business?.estado === 'RECHAZADO' && (
              <a href="mailto:soporte@reservaspro.com" className="btn-primary flex-1 justify-center">
                Contactar soporte
              </a>
            )}
          </div>

          <p className="text-center mt-6 text-xs text-text-muted">Plazo habitual de revisión: 24-48 horas hábiles.</p>
        </div>
      </div>
    </div>
  );
}
