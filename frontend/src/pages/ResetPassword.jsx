import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import {
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineKey,
} from 'react-icons/hi2';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const passwordsMatch = confirm === '' || password === confirm;
  const strong = password.length >= 8;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-surface-base">
        <div className="bg-white rounded-[3rem] p-12 text-center border border-border-base shadow-xl max-w-sm w-full animate-scale-in">
          <div className="w-16 h-16 bg-danger-bg rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HiOutlineLockClosed className="w-8 h-8 text-danger-text" />
          </div>
          <h2 className="text-2xl font-black text-brand-500 tracking-tighter mb-3">Enlace inválido</h2>
          <p className="text-text-secondary font-medium mb-8">Este enlace de recuperación ha expirado o no es válido.</p>
          <Link to="/forgot-password" className="btn-primary w-full">Solicitar nuevo enlace</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strong) return toast.error('La contraseña debe tener al menos 8 caracteres');
    if (password !== confirm) return toast.error('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Token inválido o expirado');
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
              <HiOutlineKey className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">RESERVAS TFG</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-black leading-[0.95] tracking-tighter text-white">
            Elige una <br />
            <span className="text-accent-500">contraseña</span> <br />
            segura.
          </h2>
          <p className="text-lg text-brand-100/70 max-w-sm font-medium leading-relaxed">
            Usa al menos 8 caracteres. Una buena contraseña combina letras, números y símbolos.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex items-center gap-3">
            <HiOutlineShieldCheck className="w-5 h-5 text-accent-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Cifrado seguro</p>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-3">
            <HiOutlineLockClosed className="w-5 h-5 text-accent-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Token de un solo uso</p>
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

          {done ? (
            <div className="text-center py-6 animate-fade-up">
              <div className="w-20 h-20 bg-success-bg rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                <HiOutlineCheckCircle className="w-10 h-10 text-success-text" />
              </div>
              <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-4">
                ¡Contraseña cambiada!
              </h1>
              <p className="text-text-secondary font-medium leading-relaxed">
                Tu contraseña se ha actualizado correctamente. Ya puedes iniciar sesión.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary mt-8"
              >
                Ir al login
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-3">
                  Nueva contraseña
                </h1>
                <p className="text-text-secondary font-medium">
                  Elige una contraseña segura para tu cuenta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-500 px-1">Nueva contraseña</label>
                  <div className="relative group">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="input-field pl-12 pr-12"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-500 transition-colors"
                    >
                      {showPwd ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && (
                    <p className={`text-xs font-bold px-1 ${strong ? 'text-success-text' : 'text-danger-text'}`}>
                      {strong ? '✓ Contraseña válida' : 'Mínimo 8 caracteres'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-500 px-1">Confirmar contraseña</label>
                  <div className="relative group">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      className={`input-field pl-12 ${!passwordsMatch ? 'border-red-400 focus:border-red-400' : ''}`}
                      required
                    />
                  </div>
                  {!passwordsMatch && (
                    <p className="text-xs font-bold text-danger-text px-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !strong || !passwordsMatch || !confirm}
                  className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    'Cambiar contraseña'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
