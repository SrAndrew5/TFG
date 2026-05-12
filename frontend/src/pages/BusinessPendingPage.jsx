import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBusiness } from '../services/businessService';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePauseCircle,
  HiOutlineEnvelope,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

/**
 * Pantalla de espera/feedback post-registro o cuando un BUSINESS_OWNER
 * accede a /business/* sin tener el negocio en estado ACTIVO.
 *
 * Lee el estado real del negocio para diferenciar:
 * - PENDIENTE → "estamos revisando"
 * - ACTIVO    → redirige a /business/dashboard (no debería verse, defensa)
 * - RECHAZADO → muestra el motivo
 * - SUSPENDIDO → muestra el motivo
 */
export default function BusinessPendingPage() {
  usePageTitle('Solicitud en revisión');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user || user.rol !== 'BUSINESS_OWNER') {
      setLoading(false);
      return;
    }
    getMyBusiness()
      .then((res) => {
        const b = res.data.data;
        setBusiness(b);
        if (b.estado === 'ACTIVO') {
          navigate('/business/dashboard', { replace: true });
        }
      })
      .catch(() => setBusiness(null))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8FF' }}>
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Estado por defecto si no hay sesión: usuario llegó tras enviar formulario
  const meta = STATE_META[business?.estado] || STATE_META.PENDIENTE;
  const Icon = meta.Icon;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#F8F8FF' }}>
      <div className="max-w-lg w-full">
        <div className="card p-8 sm:p-10 text-center animate-fade-in">

          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${meta.iconBg}`}>
            <Icon className={`w-12 h-12 ${meta.iconColor}`} aria-hidden="true" />
          </div>

          <h1
            className="text-2xl sm:text-3xl font-bold text-text-primary mb-3"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            {meta.title}
          </h1>

          <p className="text-text-secondary text-base mb-2">
            {meta.message}
          </p>

          {business?.nombre && (
            <p className="text-sm text-text-muted mt-4">
              Negocio: <span className="font-semibold text-text-primary">{business.nombre}</span>
            </p>
          )}

          {/* Motivo si aplica */}
          {(business?.estado === 'RECHAZADO' || business?.estado === 'SUSPENDIDO') && business?.motivo_rechazo && (
            <div className={`${meta.motivoBg} border-l-4 ${meta.motivoBorder} rounded-lg p-4 mt-6 text-left`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${meta.motivoText} mb-1`}>Motivo</p>
              <p className={`text-sm ${meta.motivoText}`}>{business.motivo_rechazo}</p>
            </div>
          )}

          {/* Tip de email */}
          {business?.estado === 'PENDIENTE' && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mt-6 flex items-start gap-3 text-left">
              <HiOutlineEnvelope className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-brand-800">
                Te enviaremos un email a <strong>{business.owner?.email || 'tu correo'}</strong> en cuanto el equipo apruebe tu solicitud.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link to="/" className="btn-secondary flex-1 justify-center">
              Volver al inicio
              <HiOutlineArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            {business?.estado === 'RECHAZADO' && (
              <a href="mailto:soporte@reservaspro.com" className="btn-primary flex-1 justify-center">
                Contactar con soporte
              </a>
            )}
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-text-muted">
          Plazo habitual de revisión: 24-48 horas hábiles.
        </p>
      </div>
    </div>
  );
}

const STATE_META = {
  PENDIENTE: {
    Icon: HiOutlineClock,
    iconBg:    'bg-warning-bg',
    iconColor: 'text-warning-text',
    title:     '¡Solicitud enviada!',
    message:   'Estamos revisando tu solicitud. Recibirás un email cuando tu negocio sea aprobado.',
    motivoBg: '', motivoBorder: '', motivoText: '',
  },
  ACTIVO: {
    Icon: HiOutlineCheckCircle,
    iconBg:    'bg-success-bg',
    iconColor: 'text-success-text',
    title:     'Tu negocio está activo',
    message:   'Redirigiendo al panel…',
    motivoBg: '', motivoBorder: '', motivoText: '',
  },
  RECHAZADO: {
    Icon: HiOutlineXCircle,
    iconBg:    'bg-danger-bg',
    iconColor: 'text-danger-text',
    title:     'Solicitud no aprobada',
    message:   'Tu solicitud no ha sido aprobada. Revisa el motivo y, si procede, contacta con soporte.',
    motivoBg: 'bg-red-50',
    motivoBorder: 'border-red-400',
    motivoText: 'text-red-800',
  },
  SUSPENDIDO: {
    Icon: HiOutlinePauseCircle,
    iconBg:    'bg-orange-100',
    iconColor: 'text-orange-700',
    title:     'Negocio suspendido',
    message:   'Tu negocio está temporalmente suspendido y no acepta nuevas reservas.',
    motivoBg: 'bg-orange-50',
    motivoBorder: 'border-orange-400',
    motivoText: 'text-orange-800',
  },
};
