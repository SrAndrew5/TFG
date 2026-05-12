import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountSuspendedPage() {
  const [searchParams] = useSearchParams();
  const motivo = searchParams.get('motivo');
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cuenta suspendida</h1>
        <p className="text-gray-500 mb-6">
          Tu cuenta ha sido suspendida temporalmente. No puedes iniciar sesión mientras dure la suspensión.
        </p>

        {motivo && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-red-700 mb-1">Motivo</p>
            <p className="text-sm text-red-600">{motivo}</p>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-8">
          Si crees que se trata de un error, contacta con soporte en{' '}
          <a href="mailto:soporte@reservas.local" className="text-indigo-600 hover:underline font-medium">
            soporte@reservas.local
          </a>
        </p>

        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
