import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PageWrapper from '../components/layout/PageWrapper';
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheckCircle,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';

const BENEFITS = [
  'Reservas en tiempo real sin esperas',
  'Historial y gestión desde tu perfil',
  'Códigos de descuento y ofertas exclusivas',
  'Cancelación flexible hasta 24h antes',
];

export default function Register() {
  const [form, setForm] = useState({
    nombre: '', apellidos: '', email: '', password: '', confirmPassword: '', telefono: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const passwordsMatch = form.confirmPassword === '' || form.password === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      toast.success('Cuenta creada. Revisa tu email para verificarla.', { duration: 6000 });
      navigate('/login?verify=pending');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex bg-surface-base">
        {/* ── Panel Izquierdo (Visual) ── */}
        <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-brand-500">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-30 mix-blend-overlay" />
          
          <div className="relative z-10 p-16 flex flex-col justify-between h-full text-white">
            <Link to="/home" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <HiOutlineBuildingOffice2 className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter">COWORKPRO</span>
            </Link>

            <div>
              <h2 className="text-5xl font-black leading-[1] tracking-tighter mb-8">
                Tu futuro <br />
                <span className="text-accent-500">espacio</span> de <br />
                trabajo te espera.
              </h2>
              <ul className="space-y-6">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center shrink-0">
                      <HiOutlineCheckCircle className="w-4 h-4 text-accent-500" />
                    </div>
                    <span className="text-sm font-bold text-brand-100">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 border-t border-white/10">
              <p className="text-xs font-bold text-brand-200 uppercase tracking-widest">
                TFG · 2º DAM · IES Augustóbrigas
              </p>
            </div>
          </div>
        </div>

        {/* ── Panel Derecho (Formulario) ── */}
        <div className="w-full lg:w-3/5 flex items-center justify-center p-8 sm:p-20 overflow-y-auto">
          <div className="w-full max-w-xl animate-fade-up">
            <div className="mb-12">
              <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-3">
                Crea tu cuenta
              </h1>
              <p className="text-text-secondary font-medium">
                Únete hoy y empieza a disfrutar de todas las ventajas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-500 px-1">Nombre</label>
                  <div className="relative group">
                    <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      className="input-field pl-12"
                      placeholder="María"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-500 px-1">Apellidos</label>
                  <div className="relative group">
                    <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                    <input
                      name="apellidos"
                      value={form.apellidos}
                      onChange={handleChange}
                      className="input-field pl-12"
                      placeholder="García López"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-500 px-1">Email</label>
                <div className="relative group">
                  <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input-field pl-12"
                    placeholder="ejemplo@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-500 px-1">Teléfono (opcional)</label>
                <div className="relative group">
                  <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    className="input-field pl-12"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-500 px-1">Contraseña</label>
                  <div className="relative group">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      className="input-field pl-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-500 transition-colors"
                    >
                      {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-500 px-1">Confirmar</label>
                  <div className="relative group">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                    <input
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={`input-field pl-12 ${!passwordsMatch ? 'border-red-500' : ''}`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-6">
                {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
              </button>
            </form>

            <p className="mt-10 text-center text-text-secondary font-medium">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-accent-500 font-bold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
