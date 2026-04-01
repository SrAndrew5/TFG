import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineCalendar,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenido/a!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#F8F8FF' }}
    >
      {/* ── Panel izquierdo: Brand (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 relative overflow-hidden flex-col justify-between p-12">
        {/* Decoraciones de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-400/20 rounded-full blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <HiOutlineCalendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            ReservasPro
          </span>
        </div>

        {/* Headline central */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            Gestiona tus
            <br />
            reservas de forma
            <br />
            <span className="text-accent-200">inteligente.</span>
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Coworking y peluquería en un solo lugar.
            Simple, rápido y sin fricción.
          </p>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: '2', label: 'Servicios' },
              { value: '∞', label: 'Reservas' },
              { value: '24/7', label: 'Disponible' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{stat.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer del panel brand */}
        <p className="relative z-10 text-white/40 text-xs">
          Proyecto TFG — 2º DAM · IES Augustóbrigas 2025/26
        </p>
      </div>

      {/* ── Panel derecho: Formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">

        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.30)]">
            <HiOutlineCalendar className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold text-gradient-brand" style={{ fontFamily: 'Sora, sans-serif' }}>
            ReservasPro
          </span>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
              Iniciar sesión
            </h1>
            <p className="text-text-secondary mt-1.5 text-sm">
              Introduce tus credenciales para acceder a tu panel.
            </p>
          </div>

          <div className="card p-8">
            <form id="login-form" onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-text-primary mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-text-primary mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Cuentas de prueba */}
            <div className="mt-6 p-4 rounded-xl bg-brand-50 border border-brand-100">
              <p className="text-xs font-semibold text-brand-700 mb-2 uppercase tracking-wider">
                Cuentas de prueba
              </p>
              <div className="space-y-1 text-xs">
                <p className="text-text-secondary">
                  <span className="font-semibold text-brand-600">Admin:</span>{' '}
                  admin@reservas.local / Admin123!
                </p>
                <p className="text-text-secondary">
                  <span className="font-semibold text-brand-600">Cliente:</span>{' '}
                  cliente@reservas.local / Cliente123!
                </p>
              </div>
            </div>
          </div>

          {/* Enlace registro */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="text-brand-600 hover:text-brand-700 font-semibold transition-colors duration-200"
            >
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
