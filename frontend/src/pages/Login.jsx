import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import PageWrapper from '../components/layout/PageWrapper';
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineCalendar,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';

const VERIFY_BANNERS = {
  pending:  { icon: HiOutlineInformationCircle,    style: 'bg-indigo-50 border-indigo-200 text-indigo-800',     text: 'Hemos enviado un enlace de verificación a tu email. Revisa tu bandeja antes de iniciar sesión.' },
  ok:       { icon: HiOutlineCheckCircle,          style: 'bg-green-50 border-green-200 text-green-800',       text: 'Email verificado correctamente. Ya puedes iniciar sesión.' },
  expired:  { icon: HiOutlineExclamationTriangle,  style: 'bg-orange-50 border-orange-200 text-orange-800',    text: 'El enlace de verificación ha expirado. Solicita uno nuevo.' },
  missing:  { icon: HiOutlineExclamationTriangle,  style: 'bg-red-50 border-red-200 text-red-800',             text: 'El enlace de verificación es inválido.' },
  error:    { icon: HiOutlineExclamationTriangle,  style: 'bg-red-50 border-red-200 text-red-800',             text: 'No se pudo verificar el email. Inténtalo más tarde.' },
};

const IS_DEV = import.meta.env.DEV;

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading]         = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const verifyBanner = VERIFY_BANNERS[searchParams.get('verify')] || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerification(false);
    try {
      await login(email, password);
      toast.success('¡Bienvenido/a!');
      navigate('/');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') setNeedsVerification(true);
      const status = err.response?.status;
      toast.error(
        status === 401
          ? 'Correo o contraseña incorrectos'
          : (err.response?.data?.message || 'Error al iniciar sesión')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) { toast.error('Introduce tu email primero'); return; }
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast.success('Si la cuenta existe, te hemos enviado un nuevo enlace.', { duration: 6000 });
    } catch {
      toast.error('No se pudo reenviar el email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex bg-surface-base">
        {/* ── Panel Izquierdo (Visual) ── */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-500">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-40 mix-blend-overlay" />
          
          <div className="relative z-10 p-20 flex flex-col justify-between h-full text-white">
            <Link to="/home" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <HiOutlineBuildingOffice2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter">COWORKPRO</span>
            </Link>

            <div>
              <h2 className="text-6xl font-black leading-[0.9] tracking-tighter mb-8">
                Tu mejor <br />
                <span className="text-accent-500">trabajo</span> empieza <br />
                aquí mismo.
              </h2>
              <p className="text-xl text-brand-100/80 max-w-md font-medium leading-relaxed">
                Únete a la comunidad de coworking más exclusiva y gestiona tus reservas sin complicaciones.
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div>
                <p className="text-3xl font-black text-accent-500">50+</p>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-200">Ubicaciones</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-3xl font-black text-accent-500">24/7</p>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-200">Acceso total</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel Derecho (Formulario) ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-20">
          <div className="w-full max-w-md animate-fade-up">
            <div className="mb-12">
              <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-3">
                Bienvenido
              </h1>
              <p className="text-text-secondary font-medium">
                Introduce tus datos para acceder a tu cuenta.
              </p>
            </div>

            {verifyBanner && (() => {
              const BannerIcon = verifyBanner.icon;
              return (
                <div className={`mb-8 flex items-start gap-4 rounded-[24px] px-6 py-4 border ${verifyBanner.style}`} role="status">
                  <BannerIcon className="w-6 h-6 shrink-0" />
                  <span className="text-sm font-semibold">{verifyBanner.text}</span>
                </div>
              );
            })()}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-500 px-1">Email</label>
                <div className="relative group">
                  <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="ejemplo@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-brand-500">Contraseña</label>
                  <Link to="/forgot-password" size="sm" className="text-xs font-bold text-accent-500 hover:underline">
                    ¿La olvidaste?
                  </Link>
                </div>
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-4">
                {loading ? 'Accediendo...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-border-base text-center">
              <p className="text-text-secondary font-medium">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-accent-500 font-bold hover:underline">
                  Regístrate ahora
                </Link>
              </p>
              
              <div className="mt-8 p-6 bg-surface-subtle rounded-[32px] border border-border-base">
                <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-3">¿Eres una empresa?</p>
                <Link to="/registro-empresa" className="btn-secondary w-full py-3 text-sm">
                  Registrar mi negocio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
