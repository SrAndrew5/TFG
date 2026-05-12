const BASE = {
  PENDIENTE:  { dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700', border: 'border-amber-100' },
  CONFIRMADA: { dot: 'bg-emerald-500',bg: 'bg-emerald-50',text: 'text-emerald-700', border: 'border-emerald-100' },
  CANCELADA:  { dot: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100' },
  COMPLETADA: { dot: 'bg-brand-500',  bg: 'bg-brand-50',  text: 'text-brand-700',  border: 'border-brand-100' },
};

const LABELS = {
  PENDIENTE: 'En Espera',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Finalizada',
};

export default function StatusBadge({ estado }) {
  const cfg   = BASE[estado] ?? BASE.PENDIENTE;
  const label = LABELS[estado] ?? estado;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} transition-all duration-300`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${estado === 'PENDIENTE' ? 'animate-pulse' : ''}`} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </span>
  );
}
