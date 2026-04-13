import { useState } from 'react';
import api from '../../api/client';
import {
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiMiniArrowPath,
} from 'react-icons/hi2';

/**
 * DiscountCodeInput — componente reutilizable de código de descuento.
 *
 * Props:
 *   onApply(discount) — se llama cuando se valida correctamente el código.
 *                       discount = { code, percent, description } | null (si se elimina)
 *   appliedDiscount   — el descuento activo actual (o null)
 */
export default function DiscountCodeInput({ onApply, appliedDiscount }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/discount-codes/validate', { params: { code: code.trim() } });
      onApply(res.data.data);
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Código no válido');
      onApply(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onApply(null);
    setError('');
    setCode('');
  };

  // — Si hay un descuento aplicado mostramos el chip de confirmación —
  if (appliedDiscount) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-success-bg border border-[rgba(16,185,129,0.3)]">
        <div className="flex items-center gap-2.5">
          <HiOutlineCheckCircle className="w-5 h-5 text-success-text flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-success-text">
              Código <span className="font-mono tracking-wider">{appliedDiscount.code}</span> aplicado
            </p>
            <p className="text-xs text-success-text/80">{appliedDiscount.description} — {appliedDiscount.percent}% de descuento</p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="text-success-text/60 hover:text-success-text transition-colors p-1 rounded-lg hover:bg-success-bg"
          title="Eliminar código"
        >
          <HiOutlineXCircle className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-bold text-text-primary">
        <HiOutlineTag className="w-4 h-4 text-brand-500" />
        ¿Tienes un código de descuento?
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
          placeholder="Ej: BIENVENIDA10"
          className={`input-field py-2.5 font-mono tracking-wider text-sm flex-1 ${error ? 'border-danger-border ring-1 ring-danger-border/30' : ''}`}
          maxLength={30}
        />
        <button
          onClick={handleValidate}
          disabled={loading || !code.trim()}
          className="btn-secondary px-4 py-2.5 text-sm font-bold disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
        >
          {loading
            ? <HiMiniArrowPath className="w-4 h-4 animate-spin" />
            : 'Aplicar'
          }
        </button>
      </div>

      {error && (
        <p className="text-xs font-semibold text-danger-text flex items-center gap-1.5">
          <HiOutlineXCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
