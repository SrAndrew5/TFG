import { HiOutlineExclamationCircle, HiArrowPath } from 'react-icons/hi2';

export default function ErrorState({
  message = 'No se pudo cargar la información.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <HiOutlineExclamationCircle className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">Error al cargar</p>
      <p className="text-xs text-text-muted mb-4 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary text-sm flex items-center gap-1.5 px-4 py-2"
        >
          <HiArrowPath className="w-4 h-4" />
          Reintentar
        </button>
      )}
    </div>
  );
}
