import { useNavigate } from 'react-router-dom';
import { HiOutlineHome, HiOutlineArrowLeft } from 'react-icons/hi2';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle px-4">
      <div className="text-center max-w-md animate-fade-in">

        {/* Número 404 decorativo */}
        <div className="relative mb-8 select-none">
          <p
            className="text-[160px] font-extrabold leading-none text-border-base"
           
          >
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-brand-50 border-4 border-brand-200 flex items-center justify-center shadow-brand">
              <span className="text-4xl">🔍</span>
            </div>
          </div>
        </div>

        <h1
          className="text-2xl font-extrabold text-text-primary mb-3"
         
        >
          Página no encontrada
        </h1>
        <p className="text-text-secondary mb-8 leading-relaxed">
          La dirección que buscas no existe o ha sido movida.
          Comprueba la URL o vuelve al inicio.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Volver atrás
          </button>
          <button
            onClick={() => navigate('/home')}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <HiOutlineHome className="w-4 h-4" />
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
