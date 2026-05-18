import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineXMark, HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function LoginModal() {
  const { loginModalOpen, setLoginModalOpen, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!loginModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenido de nuevo!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" 
        onClick={() => !loading && setLoginModalOpen(false)} 
      />
      
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full relative z-10 animate-scale-in overflow-hidden border border-border-base">
        <button 
          onClick={() => setLoginModalOpen(false)}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-surface-subtle hover:bg-danger-bg hover:text-danger-text transition-all duration-300 z-20"
        >
          <HiOutlineXMark className="w-6 h-6" />
        </button>

        <div className="p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-brand mx-auto mb-6">
              <HiOutlineLockClosed className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-brand-500 tracking-tighter">Inicia sesión</h2>
            <p className="text-text-secondary font-medium mt-2">Para continuar con tu reserva</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Email</label>
              <div className="relative group">
                <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="modal-input w-full bg-brand-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-white placeholder:text-brand-400 focus:bg-brand-700 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Contraseña</label>
              <div className="relative group">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="modal-input w-full bg-brand-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-white placeholder:text-brand-400 focus:bg-brand-700 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full btn-primary py-4 text-sm font-black uppercase tracking-widest mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Entrar ahora'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border-base text-center">
            <p className="text-sm text-text-secondary font-medium">
              ¿No tienes cuenta?{' '}
              <Link 
                to="/register" 
                onClick={() => setLoginModalOpen(false)}
                className="text-brand-500 font-black hover:underline"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
