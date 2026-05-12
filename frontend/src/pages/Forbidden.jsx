import { useNavigate } from 'react-router-dom';
import { HiOutlineLockClosed, HiOutlineHome, HiOutlineArrowLeft } from 'react-icons/hi2';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-20 px-4 flex flex-col items-center text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-danger/20 rounded-full blur-xl animate-pulse" />
        <div className="w-24 h-24 bg-danger-bg rounded-full flex items-center justify-center relative z-10 shadow-[0_4px_24px_rgba(239,68,68,0.25)]">
          <HiOutlineLockClosed className="w-12 h-12 text-danger-text" />
        </div>
      </div>

      <p className="text-6xl font-extrabold text-danger-text mb-2">403</p>
      <h1 className="text-2xl font-bold text-text-primary mb-3">
        Acceso denegado
      </h1>
      <p className="text-text-secondary mb-10 max-w-sm">
        No tienes permiso para ver esta página. Si crees que es un error, contacta con un administrador.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary py-3 px-8 flex items-center justify-center gap-2"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
          Volver atrás
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn-primary py-3 px-8 flex items-center justify-center gap-2"
        >
          <HiOutlineHome className="w-5 h-5" />
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
