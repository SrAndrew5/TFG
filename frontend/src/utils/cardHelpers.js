export function formatCardNumber(raw) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiry(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}

export function detectBrand(number) {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'VISA';
  if (/^5[1-5]/.test(n)) return 'MC';
  if (/^3[47]/.test(n)) return 'AMEX';
  return null;
}

export const CARD_COLORS = [
  { id: 'blue',    label: 'Azul',    gradient: 'from-blue-600 to-blue-800',     swatch: '#2563eb' },
  { id: 'indigo',  label: 'Índigo',  gradient: 'from-indigo-500 to-violet-700', swatch: '#6366f1' },
  { id: 'violet',  label: 'Violeta', gradient: 'from-violet-600 to-purple-800', swatch: '#7c3aed' },
  { id: 'rose',    label: 'Rosa',    gradient: 'from-rose-500 to-pink-700',     swatch: '#f43f5e' },
  { id: 'orange',  label: 'Naranja', gradient: 'from-orange-500 to-red-600',    swatch: '#f97316' },
  { id: 'emerald', label: 'Verde',   gradient: 'from-emerald-500 to-teal-700',  swatch: '#10b981' },
  { id: 'cyan',    label: 'Cian',    gradient: 'from-cyan-500 to-blue-700',     swatch: '#06b6d4' },
  { id: 'slate',   label: 'Pizarra', gradient: 'from-slate-600 to-slate-900',   swatch: '#475569' },
];

export function getCardGradient(colorId) {
  return (CARD_COLORS.find(c => c.id === colorId) || CARD_COLORS[0]).gradient;
}
