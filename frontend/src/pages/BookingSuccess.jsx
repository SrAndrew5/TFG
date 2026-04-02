import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineCalendar, HiOutlineClipboardDocumentList } from 'react-icons/hi2';

export default function BookingSuccess() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 animate-fade-in flex flex-col items-center text-center">
      
      {/* ── Gran Icono Animado ── */}
      <div className="relative mb-8 mt-10">
        <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
        <div className="w-24 h-24 bg-success-bg rounded-full flex items-center justify-center relative z-10 shadow-[0_4px_24px_rgba(16,185,129,0.3)]">
          <HiOutlineCheckCircle className="w-14 h-14 text-success" />
        </div>
      </div>

      <h1 className="text-4xl font-extrabold text-text-primary mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
        ¡Reserva Confirmada!
      </h1>
      <p className="text-lg text-text-secondary mb-10 max-w-md mx-auto">
        Todo está listo. Tu espacio o servicio ha sido reservado con éxito y te estamos esperando.
      </p>

      {/* ── Resumen de Reserva (Placeholder limpio) ── */}
      <div className="w-full bg-white border border-border-base rounded-3xl p-6 shadow-sm mb-10 flex items-center gap-5 justify-center md:justify-start text-left max-w-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-70 pointer-events-none" />
        
        <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-brand flex-shrink-0 relative z-10">
          <span className="text-white font-extrabold text-xl" style={{ fontFamily: 'Sora, sans-serif' }}>
            {new Date().getDate()}
          </span>
        </div>
        <div className="relative z-10">
          <p className="text-sm font-bold tracking-wider text-text-muted uppercase mb-0.5">Tú próxima cita</p>
          <p className="text-text-primary font-bold text-lg leading-tight">Ya anotada en el sistema</p>
        </div>
      </div>

      {/* ── Acciones de Conversión ── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <button 
          onClick={() => navigate('/my-appointments')}
          className="btn-primary py-3.5 px-8 w-full sm:w-auto text-base flex justify-center"
        >
          <HiOutlineClipboardDocumentList className="w-5 h-5 mr-2" />
          Ir a Mis Reservas
        </button>
        <button 
          onClick={() => toast.success('Evento añadido a tu calendario local 🎉')}
          className="btn-secondary py-3.5 px-8 w-full sm:w-auto text-base flex justify-center bg-white border-border-strong hover:border-brand-400"
        >
          <HiOutlineCalendar className="w-5 h-5 mr-2" />
          Añadir a mi Calendario
        </button>
      </div>

    </div>
  );
}
