import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineCalendar, HiOutlineClipboardDocumentList, HiOutlineSparkles } from 'react-icons/hi2';
import { usePageTitle } from '../hooks/usePageTitle';

function downloadIcs({ spaceName, fecha, horaInicio }) {
  if (!fecha || !horaInicio) return;
  const [year, month, day] = fecha.split('-').map(Number);
  const [hour, minute] = horaInicio.split(':').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const dtEnd   = `${year}${pad(month)}${pad(day)}T${pad(hour + 1)}${pad(minute)}00`;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ReservasPro//ES',
    'BEGIN:VEVENT', `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
    `SUMMARY:${spaceName || 'Reserva confirmada'}`,
    'DESCRIPTION:Reserva realizada en ReservasPro',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'reserva.ics'; a.click();
  URL.revokeObjectURL(url);
}

export default function BookingSuccess() {
  usePageTitle('Reserva Confirmada');
  const navigate  = useNavigate();
  const { state } = useLocation();

  const spaceName  = state?.serviceName || state?.spaceName || null;
  const fecha      = state?.fecha       || null;
  const horaInicio = state?.horaInicio  || null;
  const dayNumber  = fecha ? parseInt(fecha.split('-')[2], 10) : null;

  return (
    <div className="flex flex-col items-center text-center py-10 animate-fade-in bg-surface-subtle"
      style={{ borderRadius: 24, minHeight: 500 }}>

      {/* ── Icono animado ── */}
      <div className="success-icon-wrap mt-8">
        <div className="success-icon-ring" />
        <div className="success-icon-ring success-icon-ring2" />
        <div className="success-icon-circle bg-brand-500 shadow-brand">
          <HiOutlineCheckCircle className="w-14 h-14 text-white" />
        </div>
      </div>

      {/* ── Headline ── */}
      <h1 className="text-4xl md:text-5xl font-black text-brand-500 tracking-tighter mt-8 animate-slide-up px-4">
        ¡Reserva Confirmada!
      </h1>
      <p className="text-text-secondary text-lg font-medium mt-4 animate-slide-up px-4" style={{ animationDelay: '80ms' }}>
        Tu espacio ha sido reservado con éxito y te estamos esperando.
      </p>

      {/* ── Detalle card ── */}
      <div className="success-detail-card mt-8 mx-4 animate-slide-up bg-white p-8 rounded-[32px] border border-border-base shadow-subtle" style={{ animationDelay: '160ms' }}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-extrabold text-2xl bg-brand-500 shadow-brand">
            {dayNumber ?? <HiOutlineCalendar className="w-8 h-8" />}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-500 mb-1">
              Tu próxima reserva
            </p>
            {spaceName && fecha ? (
              <>
                <p className="text-xl font-black text-brand-500 tracking-tight leading-none">{spaceName}</p>
                <p className="text-sm font-bold text-text-secondary mt-2">{fecha}{horaInicio ? ` · ${horaInicio}h` : ''}</p>
              </>
            ) : (
              <p className="text-xl font-black text-brand-500 tracking-tight">Ya anotada en el sistema</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex flex-col sm:flex-row gap-4 mt-12 px-4 w-full max-w-md animate-slide-up" style={{ animationDelay: '240ms' }}>
        <button
          onClick={() => navigate('/my-bookings')}
          className="btn-primary flex-1 py-4 text-sm"
        >
          <HiOutlineClipboardDocumentList className="w-5 h-5" />
          Ver mis reservas
        </button>
        <button
          onClick={() => downloadIcs({ spaceName, fecha, horaInicio })}
          disabled={!fecha || !horaInicio}
          className="btn-secondary flex-1 py-4 text-sm"
        >
          <HiOutlineCalendar className="w-5 h-5 text-accent-500" />
          Calendario
        </button>
      </div>

      {/* ── Otra reserva ── */}
      <div className="mt-10 flex items-center gap-2 animate-fade-in mb-8" style={{ animationDelay: '400ms' }}>
        <HiOutlineSparkles className="w-4 h-4 text-accent-500" />
        <button
          onClick={() => navigate('/resources')}
          className="text-sm text-accent-600 hover:text-accent-700 font-black uppercase tracking-widest hover:underline"
        >
          Hacer otra reserva
        </button>
      </div>
    </div>
  );
}
