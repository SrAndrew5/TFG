import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone } from 'react-icons/hi2';

export default function Register() {
  const [form, setForm] = useState({ nombre: '', apellidos: '', email: '', password: '', telefono: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
            ReservasPro
          </h1>
          <p className="text-surface-400 mt-2">Crea tu cuenta</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Nombre</label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                  <input name="nombre" value={form.nombre} onChange={handleChange} className="input-field pl-12" placeholder="María" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Apellidos</label>
                <input name="apellidos" value={form.apellidos} onChange={handleChange} className="input-field" placeholder="García López" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Email</label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field pl-12" placeholder="tu@email.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Teléfono (opcional)</label>
              <div className="relative">
                <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input name="telefono" value={form.telefono} onChange={handleChange} className="input-field pl-12" placeholder="+34 600 000 000" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Contraseña</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field pl-12" placeholder="Mínimo 8 caracteres" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : 'Crear Cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-surface-400 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
