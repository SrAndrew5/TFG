import { useEffect, useState } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';
import api from '../../api/client';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import ModalPortal from './ModalPortal';

const MAX_COMMENT = 300;

export default function ReviewModal({ open, onClose, target, onSuccess }) {
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(0);
      setComment('');
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !target) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Selecciona una valoración con estrellas');
      return;
    }
    setSubmitting(true);
    try {
      const body = target.type === 'cita'
        ? { cita_id: target.id, rating, comentario: comment || null }
        : { reserva_recurso_id: target.id, rating, comentario: comment || null };
      await api.post('/reviews', body);
      toast.success('¡Gracias por tu reseña!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo publicar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX_COMMENT - comment.length;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        <div className="bg-white rounded-2xl shadow-[0_24px_60px_rgba(99,102,241,0.20)] max-w-md w-full p-6 animate-fade-up">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 id="review-modal-title" className="text-xl font-bold text-text-primary">
                ¿Cómo fue tu experiencia?
              </h2>
              {target.name && (
                <p className="text-sm text-text-muted mt-1">{target.name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tu valoración <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <StarRating value={rating} onChange={setRating} interactive size="xl" />
                {rating > 0 && (
                  <span className="text-sm text-text-secondary font-medium">
                    {RATING_LABELS[rating]}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="review-comment" className="block text-sm font-medium text-text-primary mb-2">
                Comentario <span className="text-text-muted text-xs font-normal">(opcional)</span>
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                rows={4}
                placeholder="Cuéntanos qué te pareció el servicio…"
                className="input-field resize-none"
                maxLength={MAX_COMMENT}
              />
              <div className="flex justify-end mt-1.5">
                <span className={`text-xs ${remaining < 30 ? 'text-red-500' : 'text-text-muted'}`}>
                  {remaining} caracteres restantes
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="btn-primary flex-1"
              >
                {submitting ? 'Enviando…' : 'Enviar valoración'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn-secondary flex-1 border-transparent"
              >
                Ahora no
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

const RATING_LABELS = {
  1: 'Muy mala',
  2: 'Mala',
  3: 'Aceptable',
  4: 'Buena',
  5: 'Excelente',
};
