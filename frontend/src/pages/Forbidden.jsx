import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineLockClosed, HiOutlineHome, HiOutlineArrowLeft } from 'react-icons/hi2';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8F9FA' }}>
      <div className="w-full max-w-md text-center animate-fade-up">

        <div className="relative mb-8 select-none">
          <p className="text-[160px] font-black leading-none tracking-tighter"
            style={{ color: '#E2E8F0' }}>
            403
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-[2rem] bg-danger-bg flex items-center justify-center shadow-lg">
              <HiOutlineLockClosed className="w-10 h-10 text-danger-text" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-brand-500 tracking-tighter mb-3">
          Acceso denegado
        </h1>
        <p className="text-text-secondary font-medium leading-relaxed mb-10">
          No tienes permiso para ver esta página.<br />
          Si crees que es un error, contacta con un administrador.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Volver atrás
          </button>
          <Link
            to="/"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <HiOutlineHome className="w-4 h-4" />
            Ir al inicio
          </Link>
        </div>

        <p className="mt-12 text-xs text-text-muted font-bold uppercase tracking-widest">
          RESERVAS TFG · Error 403
        </p>
      </div>
    </div>
  );
}
