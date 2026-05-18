import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import {
  HiOutlineEnvelope,
  HiOutlineArrowLeft,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Introduce tu email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al enviar el email. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Panel Izquierdo ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-700/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg">
              <HiOutlineLockClosed className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">RESERVAS TFG</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-black leading-[0.95] tracking-tighter text-white">
            Recupera el <br />
            <span className="text-accent-500">acceso</span> a tu <br />
            cuenta.
          </h2>
          <p className="text-lg text-brand-100/70 max-w-sm font-medium leading-relaxed">
            Te enviaremos un enlace seguro para restablecer tu contraseña en menos de un minuto.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex items-center gap-3">
            <HiOutlineShieldCheck className="w-5 h-5 text-accent-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Enlace seguro</p>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-3">
            <HiOutlineEnvelope className="w-5 h-5 text-accent-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Email inmediato</p>
          </div>
        </div>
      </div>

      {/* ── Panel Derecho ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-20" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="w-full max-w-md animate-fade-up">

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-text-muted hover:text-brand-500 mb-10 transition-colors group"
          >
            <HiOutlineArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al login
          </Link>

          {sent ? (
            <div className="text-center py-6 animate-fade-up">
              <div className="w-20 h-20 bg-success-bg rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                <HiOutlineCheckCircle className="w-10 h-10 text-success-text" />
              </div>
              <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-4">
                ¡Email enviado!
              </h1>
              <p className="text-text-secondary font-medium leading-relaxed mb-2">
                Si existe una cuenta con <span className="font-black text-brand-500">{email}</span>, recibirás un enlace para restablecer tu contraseña en breve.
              </p>
              <p className="text-text-muted text-sm mt-4">Revisa también la carpeta de spam.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 mt-8 btn-primary"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-3">
                  Recuperar contraseña
                </h1>
                <p className="text-text-secondary font-medium">
                  Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-500 px-1">Email</label>
                  <div className="relative group">
                    <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="input-field pl-12"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-4"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-text-secondary font-medium mt-8">
                ¿Recuerdas tu contraseña?{' '}
                <Link to="/login" className="text-brand-500 font-black hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
