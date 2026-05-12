import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import ModalPortal from './ModalPortal';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirmar', loading = false, onConfirm, onClose }) {
  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-center">
        <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm transition-opacity"
          onClick={() => !loading && onClose()}
        />
        <div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-sm w-full relative z-10 animate-fade-up p-8 border border-border-base/50">
          <div className="w-20 h-20 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_4px_24px_rgba(239,68,68,0.15)]">
            <HiOutlineExclamationTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-brand-500 mb-2">
            {title}
          </h3>
          <p className="text-sm text-text-secondary mb-8 font-medium">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-full btn-secondary border-transparent bg-surface-subtle hover:bg-surface-200 py-3 text-sm font-bold"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="w-full bg-red-500 text-white rounded-2xl flex items-center justify-center py-3 text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
