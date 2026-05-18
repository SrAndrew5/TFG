import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone,
  HiOutlineEye, HiOutlineEyeSlash, HiOutlineCheckCircle, HiOutlineBuildingOffice2,
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
    <div className="min-h-screen flex">

      {/* ── Panel Izquierdo ── */}
      <div className="hidden lg:flex lg:w-2/5 bg-brand-900 flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-700/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <Link to="/explorar" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">RESERVAS TFG</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl font-black leading-[0.95] tracking-tighter text-white mb-8">
            Tu futuro <br />
            <span className="text-accent-500">espacio</span> de <br />
            trabajo te espera.
          </h2>
          <ul className="space-y-5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <HiOutlineCheckCircle className="w-4 h-4 text-accent-500" />
                </div>
                <span className="text-sm font-bold text-brand-200">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10">
          <p className="text-xs font-black text-brand-500 uppercase tracking-widest">
            TFG · 2º DAM · IES Augustóbrigas
          </p>
        </div>
      </div>

      {/* ── Panel Derecho ── */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 sm:p-16 overflow-y-auto" style={{ backgroundColor: '#F8F9FA' }}>
        <div className="w-full max-w-xl animate-fade-up">

          <div className="mb-10">
            <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-3">Crea tu cuenta</h1>
            <p className="text-text-secondary font-medium">Únete hoy y empieza a disfrutar de todas las ventajas.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-500 px-1">Nombre</label>
                <div className="relative group">
                  <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                  <input name="nombre" value={form.nombre} onChange={handleChange}
                    className="input-field pl-12" placeholder="María" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-500 px-1">Apellidos</label>
                <div className="relative group">
                  <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                  <input name="apellidos" value={form.apellidos} onChange={handleChange}
                    className="input-field pl-12" placeholder="García López" required />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-500 px-1">Email</label>
              <div className="relative group">
                <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="input-field pl-12" placeholder="ejemplo@email.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-500 px-1">Teléfono <span className="text-text-muted font-medium">(opcional)</span></label>
              <div className="relative group">
                <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                <input name="telefono" value={form.telefono} onChange={handleChange}
                  className="input-field pl-12" placeholder="+34 600 000 000" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-500 px-1">Contraseña</label>
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange}
                    className="input-field pl-12 pr-12" placeholder="Mínimo 8 caracteres" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-500 transition-colors">
                    {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-500 px-1">Confirmar</label>
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange}
                    className={`input-field pl-12 pr-12 ${!passwordsMatch ? 'border-red-400' : ''}`} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-500 transition-colors">
                    {showConfirm ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>
                {!passwordsMatch && <p className="text-xs text-danger-text px-1">Las contraseñas no coinciden</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : 'Crear mi cuenta'}
            </button>
          </form>

          <p className="mt-8 text-center text-text-secondary font-medium">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-brand-500 font-black hover:underline">Inicia sesión</Link>
          </p>

          <p className="mt-4 text-center text-xs text-text-muted">
            ¿Tienes un negocio?{' '}
            <Link to="/registro-empresa" className="text-accent-500 font-black hover:underline">Regístralo aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
