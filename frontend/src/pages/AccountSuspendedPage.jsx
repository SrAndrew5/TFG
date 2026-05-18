import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineNoSymbol,
  HiOutlineEnvelope,
  HiOutlineArrowRightOnRectangle,
  HiOutlineShieldExclamation,
} from 'react-icons/hi2';

export default function AccountSuspendedPage() {
  const [searchParams] = useSearchParams();
  const motivo = searchParams.get('motivo');
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="w-full max-w-md animate-fade-up">

        <div className="w-20 h-20 rounded-[2rem] bg-danger-bg flex items-center justify-center mx-auto mb-8 shadow-sm">
          <HiOutlineNoSymbol className="w-10 h-10 text-danger-text" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-brand-500 tracking-tighter mb-3">
            Cuenta suspendida
          </h1>
          <p className="text-text-secondary font-medium leading-relaxed">
            Tu cuenta ha sido suspendida temporalmente. No puedes iniciar sesión mientras dure la suspensión.
          </p>
        </div>

        {motivo && (
          <div className="bg-white border-l-4 border-red-400 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineShieldExclamation className="w-4 h-4 text-danger-text" />
              <p className="text-xs font-black uppercase tracking-widest text-danger-text">Motivo de la suspensión</p>
            </div>
            <p className="text-sm font-medium text-red-800">{motivo}</p>
          </div>
        )}

        <div className="bg-white border border-border-base rounded-[2rem] p-6 mb-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <HiOutlineEnvelope className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-black text-brand-500 mb-1">¿Crees que es un error?</p>
            <p className="text-sm text-text-secondary font-medium">
              Contacta con soporte en{' '}
              <a
                href="mailto:soporte@reservaspro.com"
                className="text-accent-500 font-black hover:underline"
              >
                soporte@reservaspro.com
              </a>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2"
        >
          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          Cerrar sesión
        </button>

        <p className="mt-6 text-center text-xs text-text-muted font-bold uppercase tracking-widest">
          RESERVAS TFG · Cuenta suspendida
        </p>
      </div>
    </div>
  );
}
