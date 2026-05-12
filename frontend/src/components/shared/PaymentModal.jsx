import { useState } from 'react';
import {
  HiOutlineXMark,
  HiOutlineLockClosed,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiMiniArrowPath,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { useScrollLock } from '../../hooks/useScrollLock';
import { CARD_COLORS, formatCardNumber, formatExpiry, detectBrand } from '../../utils/cardHelpers';

function getSwatchColor(colorId) {
  return (CARD_COLORS.find((c) => c.id === colorId) || CARD_COLORS[0]).swatch;
}

/* ─── Validaciones ───────────────────────────────────── */

function validateCard(data) {
  const errors = {};
  const cardDigits = data.cardNumber.replace(/\s/g, '');

  if (!data.holderName.trim()) errors.holderName = 'Introduce el nombre del titular';
  if (cardDigits.length !== 16) errors.cardNumber = 'El número de tarjeta debe tener 16 dígitos';

  const [mm, yy] = data.expiry.split('/').map(Number);
  if (!mm || !yy || mm < 1 || mm > 12) {
    errors.expiry = 'Fecha inválida';
  } else {
    const now = new Date();
    const expDate = new Date(2000 + yy, mm - 1, 1);
    if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
      errors.expiry = 'La tarjeta ha caducado';
    }
  }

  const cvvLen = detectBrand(data.cardNumber) === 'AMEX' ? 4 : 3;
  if (data.cvv.length !== cvvLen) errors.cvv = `El CVV debe tener ${cvvLen} dígitos`;

  return errors;
}

/* ─── Mini-componente: Tarjeta visual ───────────────── */

function CardPreview({ number, holder, expiry, brand, flipped }) {
  const display = number.padEnd(19, '•').replace(/(.{4})/g, '$1 ').trim();
  return (
    <div className={`relative w-full h-44 perspective-[1000px]`}>
      <div className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>

        {/* Cara delantera */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 shadow-[0_8px_32px_rgba(99,102,241,0.35)] flex flex-col justify-between backface-hidden overflow-hidden">
          <div className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-white/5" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-sm" />
            {brand && <span className="text-white/80 font-extrabold text-sm tracking-widest">{brand}</span>}
          </div>
          <div className="relative z-10">
            <p className="font-mono text-white text-xl tracking-[0.2em] drop-shadow">{display}</p>
            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Titular</p>
                <p className="text-white font-semibold text-sm uppercase tracking-wider truncate max-w-[160px]">{holder || '••••• •••••••'}</p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Caduca</p>
                <p className="text-white font-semibold text-sm">{expiry || 'MM/AA'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cara trasera */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 shadow-[0_8px_32px_rgba(99,102,241,0.35)] flex flex-col justify-center backface-hidden rotate-y-180 overflow-hidden">
          <div className="w-full h-10 bg-black/40 mt-4" />
          <div className="px-6 mt-6">
            <p className="text-white/50 text-[9px] uppercase tracking-widest mb-1">CVV</p>
            <div className="bg-white/90 rounded-md px-4 py-2 text-right font-mono text-brand-900 font-bold tracking-widest text-sm">
              {'•'.repeat(3)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Principal ────────────────────────────────── */

/**
 * PaymentModal
 *
 * Props:
 *   isOpen        — boolean
 *   onClose()     — cierra el modal
 *   onConfirm()   — ejecuta la reserva real
 *   total         — string precio FINAL ya con descuento aplicado (ej: "4.50")
 *   originalTotal — string precio original SIN descuento (ej: "5.00") — sólo para mostrar el desglose
 *   discount      — { percent, code } | null
 *   concept       — string: nombre del servicio o recurso
 */
export default function PaymentModal({ isOpen, onClose, onConfirm, total, originalTotal, discount, concept }) {
  const { methods } = usePaymentMethods();
  useScrollLock(isOpen);

  const [selectedCard, setSelectedCard] = useState(null); // tarjeta guardada seleccionada
  const [form, setForm] = useState({ holderName: '', cardNumber: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState({});
  const [cvvFocus, setCvvFocus] = useState(false);
  const [paying, setPaying] = useState(false);

  if (!isOpen) return null;

  const finalTotal   = parseFloat(total) || 0;
  const baseTotal    = parseFloat(originalTotal || total) || 0;
  const discountAmount = discount ? (baseTotal - finalTotal) : 0;

  // Cuando el usuario elige una tarjeta guardada, sólo pre-rellena campos no sensibles
  const pickSavedCard = (card) => {
    setSelectedCard(card);
    setForm({ holderName: card.titular, cardNumber: '', expiry: card.expiry, cvv: '' });
    setErrors({});
  };

  const deselectCard = () => {
    setSelectedCard(null);
    setForm({ holderName: '', cardNumber: '', expiry: '', cvv: '' });
    setErrors({});
  };

  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errs;
    if (isLocked) {
      // Saved card: only CVV needs validation
      const cvvLen = selectedCard.brand === 'AMEX' ? 4 : 3;
      errs = form.cvv.length !== cvvLen ? { cvv: `El CVV debe tener ${cvvLen} dígitos` } : {};
    } else {
      errs = validateCard(form);
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPaying(true);
    try {
      await new Promise((r) => setTimeout(r, 900)); // simulación procesamiento
      await onConfirm();
    } catch {
      // onConfirm ya muestra su propio toast de error
    } finally {
      setPaying(false);
    }
  };

  const brand = detectBrand(form.cardNumber);
  const isLocked = !!selectedCard; // campos bloqueados si usas tarjeta guardada

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white rounded-[2rem] shadow-[0_24px_60px_rgba(31,41,55,0.25)] max-w-md w-full relative z-10 animate-scale-in flex flex-col overflow-hidden border border-border-base">

        {/* Banner Demo */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <span className="bg-amber-400 text-amber-900 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">Demo</span>
          <p className="text-xs text-amber-800 font-medium">Pago simulado — No se realizará ningún cargo real</p>
        </div>

        {/* Header */}
        <div className="px-7 py-5 border-b border-border-base bg-surface-subtle/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
              <HiOutlineLockClosed className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-text-primary leading-tight">Pago Seguro</h2>
              <p className="text-xs text-text-muted font-medium">Cifrado SSL 256-bit</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar modal de pago" className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary hover:bg-surface-300 transition-colors">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5 overflow-y-auto max-h-[80vh]">

          {/* ── Tarjetas guardadas ── */}
          {methods.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Tarjetas guardadas</p>
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectedCard?.id === m.id ? deselectCard() : pickSavedCard(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    selectedCard?.id === m.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-border-base hover:border-brand-300 hover:bg-surface-elevated'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-extrabold"
                    style={{ backgroundColor: getSwatchColor(m.colorId) }}
                  >
                    {m.brand === 'MC' ? (
                      <div className="flex -space-x-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-red-400/90" />
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-300/90" />
                      </div>
                    ) : (
                      <span className={m.brand === 'VISA' ? 'italic' : ''} style={m.brand === 'VISA' ? { fontFamily: 'Georgia, serif' } : {}}>
                        {m.brand || '💳'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">•••• •••• •••• {m.last4}</p>
                    <p className="text-xs text-text-muted truncate">{m.titular} · Caduca {m.expiry}</p>
                  </div>
                  {selectedCard?.id === m.id && (
                    <HiOutlineCheckCircle className="w-5 h-5 text-brand-500 flex-shrink-0" />
                  )}
                </button>
              ))}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-border-base" />
                <span className="text-xs text-text-muted font-medium">
                  {selectedCard ? 'o usa otra tarjeta' : 'o introduce una nueva'}
                </span>
                <div className="flex-1 h-px bg-border-base" />
              </div>
            </div>
          )}

          {/* ── Previsualización de la tarjeta ── */}
          {!selectedCard && (
            <div style={{ perspective: '1000px' }}>
              <style>{`
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .transform-style-preserve-3d { transform-style: preserve-3d; }
              `}</style>
              <CardPreview
                number={form.cardNumber}
                holder={form.holderName}
                expiry={form.expiry}
                brand={brand}
                flipped={cvvFocus}
              />
            </div>
          )}

          {/* ── Resumen del cobro ── */}
          <div className="bg-surface-elevated rounded-2xl p-4 border border-border-base text-sm space-y-2">
            <div className="flex justify-between text-text-secondary">
              <span>{concept}</span>
              <span className="font-semibold">{baseTotal.toFixed(2)}€</span>
            </div>
            {discount && (
              <div className="flex justify-between text-success-text font-semibold">
                <span>Descuento {discount.code} ({discount.percent}%)</span>
                <span>−{discountAmount.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between text-text-primary font-extrabold text-base pt-2 border-t border-border-base">
              <span>Total a pagar</span>
              <span className="text-brand-600">{finalTotal.toFixed(2)}€</span>
            </div>
          </div>

          {/* ── Formulario ── */}
          <div className="space-y-4">

            {/* Titular */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Titular de la tarjeta</label>
              <input
                value={form.holderName}
                onChange={(e) => !isLocked && field('holderName', e.target.value.toUpperCase())}
                readOnly={isLocked}
                placeholder="NOMBRE APELLIDOS"
                className={`input-field py-3 font-semibold tracking-wide ${isLocked ? 'bg-surface-elevated text-text-secondary cursor-not-allowed' : ''} ${errors.holderName ? 'border-danger-border' : ''}`}
              />
              {errors.holderName && <p className="text-xs text-danger-text mt-1">{errors.holderName}</p>}
            </div>

            {/* Número de tarjeta */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Número de tarjeta</label>
              <div className="relative">
                <HiOutlineCreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  value={isLocked ? `•••• •••• •••• ${selectedCard.last4}` : form.cardNumber}
                  onChange={(e) => !isLocked && field('cardNumber', formatCardNumber(e.target.value))}
                  readOnly={isLocked}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`input-field pl-11 py-3 font-mono text-base tracking-widest ${isLocked ? 'bg-surface-elevated text-text-secondary cursor-not-allowed' : ''} ${errors.cardNumber ? 'border-danger-border' : ''}`}
                />
                {(brand || selectedCard?.brand) && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-brand-600 tracking-widest">
                    {selectedCard?.brand || brand}
                  </span>
                )}
              </div>
              {errors.cardNumber && <p className="text-xs text-danger-text mt-1">{errors.cardNumber}</p>}
            </div>

            {/* Caducidad + CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Caducidad</label>
                <input
                  value={form.expiry}
                  onChange={(e) => !isLocked && field('expiry', formatExpiry(e.target.value))}
                  readOnly={isLocked}
                  placeholder="MM/AA"
                  maxLength={5}
                  className={`input-field py-3 font-mono text-center tracking-widest ${isLocked ? 'bg-surface-elevated text-text-secondary cursor-not-allowed' : ''} ${errors.expiry ? 'border-danger-border' : ''}`}
                />
                {errors.expiry && <p className="text-xs text-danger-text mt-1">{errors.expiry}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  CVV {(brand === 'AMEX' || selectedCard?.brand === 'AMEX') ? '(4 dígitos)' : '(3 dígitos)'}
                </label>
                <input
                  value={form.cvv}
                  onChange={(e) => field('cvv', e.target.value.replace(/\D/g, '').slice(0, (brand === 'AMEX' || selectedCard?.brand === 'AMEX') ? 4 : 3))}
                  onFocus={() => setCvvFocus(true)}
                  onBlur={() => setCvvFocus(false)}
                  placeholder="•••"
                  maxLength={4}
                  autoFocus={!!selectedCard}
                  className={`input-field py-3 font-mono text-center tracking-widest ${errors.cvv ? 'border-danger-border' : ''}`}
                />
                {errors.cvv && <p className="text-xs text-danger-text mt-1">{errors.cvv}</p>}
                {isLocked && <p className="text-[11px] text-text-muted mt-1">Introduce el CVV de tu tarjeta guardada</p>}
              </div>
            </div>

            {isLocked && (
              <button type="button" onClick={deselectCard} className="text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors">
                ← Usar una tarjeta diferente
              </button>
            )}
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={paying}
            className={`btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3 transition-all ${paying ? 'opacity-80 scale-95' : 'hover:scale-[1.01]'}`}
          >
            {paying ? (
              <>
                <HiMiniArrowPath className="w-5 h-5 animate-spin" />
                Procesando pago...
              </>
            ) : (
              <>
                <HiOutlineShieldCheck className="w-5 h-5" />
                Pagar {finalTotal.toFixed(2)}€
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-text-muted font-medium">
            🔒 Pago cifrado y seguro · Tus datos nunca se almacenan
          </p>
        </form>
      </div>
    </div>
  );
}
