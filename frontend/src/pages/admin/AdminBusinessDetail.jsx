import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  getAdminBusinessById,
  approveBusiness,
  rejectBusiness,
  suspendBusiness,
  reactivateBusiness,
  TIPO_NEGOCIO_OPTIONS,
  ESTADO_BUSINESS_META,
} from '../../services/businessService';
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePauseCircle,
  HiOutlinePlayCircle,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlineEnvelope,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import ErrorState from '../../components/shared/ErrorState';

const DIAS = [
  { id: 'lunes',     label: 'Lunes' },
  { id: 'martes',    label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves',    label: 'Jueves' },
  { id: 'viernes',   label: 'Viernes' },
  { id: 'sabado',    label: 'Sábado' },
  { id: 'domingo',   label: 'Domingo' },
];

export default function AdminBusinessDetail() {
  usePageTitle('Detalle de empresa');
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const [actionModal, setActionModal] = useState(null); // { type, title, label, color }
  const [motivo, setMotivo]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getAdminBusinessById(id);
      setBusiness(res.data.data);
    } catch (err) {
      setError(true);
      if (err.response?.status === 404) {
        toast.error('Empresa no encontrada');
        navigate('/admin/businesses');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const closeModal = () => {
    setActionModal(null);
    setMotivo('');
  };

  const handleAction = async () => {
    if (!actionModal) return;
    if ((actionModal.type === 'reject' || actionModal.type === 'suspend') && motivo.trim().length < 5) {
      toast.error('Indica un motivo (mínimo 5 caracteres)');
      return;
    }
    setSubmitting(true);
    try {
      let res;
      if (actionModal.type === 'approve')      res = await approveBusiness(id);
      else if (actionModal.type === 'reject')  res = await rejectBusiness(id, motivo.trim());
      else if (actionModal.type === 'suspend') res = await suspendBusiness(id, motivo.trim());
      else if (actionModal.type === 'reactivate') res = await reactivateBusiness(id);
      toast.success(res?.data?.message || 'Acción realizada');
      closeModal();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo completar la acción');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !business) {
    return <ErrorState message="No se pudo cargar el detalle." onRetry={load} />;
  }

  const tipoLabel = TIPO_NEGOCIO_OPTIONS.find((t) => t.value === business.tipo)?.label || business.tipo;
  const estadoMeta = ESTADO_BUSINESS_META[business.estado] || ESTADO_BUSINESS_META.ACTIVO;

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl">

      {/* Volver */}
      <Link to="/admin/businesses" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-brand-600 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" aria-hidden="true" />
        Volver a la lista
      </Link>

      {/* Header con logo */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Logo business={business} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {business.nombre}
                </h1>
                <p className="text-text-muted mt-1">{tipoLabel} · {business.ciudad}</p>
                <p className="text-xs text-text-muted font-mono mt-1">CIF/NIF: {business.cif_nif}</p>
              </div>
              <span className={`badge ${estadoMeta.className} text-sm`}>{estadoMeta.label}</span>
            </div>

            {business.descripcion && (
              <p className="text-sm text-text-secondary mt-4 leading-relaxed">
                {business.descripcion}
              </p>
            )}

            {/* Motivo si aplica */}
            {(business.estado === 'RECHAZADO' || business.estado === 'SUSPENDIDO') && business.motivo_rechazo && (
              <div className="bg-orange-50 border-l-4 border-orange-400 rounded p-3 mt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-900 mb-1">Motivo registrado</p>
                <p className="text-sm text-orange-800">{business.motivo_rechazo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 pt-6 border-t border-border-base flex flex-wrap gap-2">
          {business.estado === 'PENDIENTE' && (
            <>
              <button
                onClick={() => setActionModal({ type: 'approve', title: 'Aprobar negocio', label: 'Aprobar', color: 'success' })}
                className="btn-success text-sm"
              >
                <HiOutlineCheckCircle className="w-4 h-4" aria-hidden="true" />
                Aprobar
              </button>
              <button
                onClick={() => setActionModal({ type: 'reject', title: 'Rechazar negocio', label: 'Rechazar', color: 'danger', requireMotivo: true })}
                className="btn-danger text-sm"
              >
                <HiOutlineXCircle className="w-4 h-4" aria-hidden="true" />
                Rechazar
              </button>
            </>
          )}
          {business.estado === 'ACTIVO' && (
            <button
              onClick={() => setActionModal({ type: 'suspend', title: 'Suspender negocio', label: 'Suspender', color: 'warning', requireMotivo: true })}
              className="btn-secondary text-sm bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100"
            >
              <HiOutlinePauseCircle className="w-4 h-4" aria-hidden="true" />
              Suspender
            </button>
          )}
          {(business.estado === 'SUSPENDIDO' || business.estado === 'RECHAZADO') && (
            <button
              onClick={() => setActionModal({ type: 'reactivate', title: 'Reactivar negocio', label: 'Reactivar', color: 'success' })}
              className="btn-success text-sm"
            >
              <HiOutlinePlayCircle className="w-4 h-4" aria-hidden="true" />
              Reactivar
            </button>
          )}
        </div>
      </div>

      {/* Datos del propietario */}
      <Section title="Propietario" icon={HiOutlineEnvelope}>
        <Row label="Nombre"   value={`${business.owner?.nombre || ''} ${business.owner?.apellidos || ''}`.trim() || '—'} />
        <Row label="Email"    value={business.owner?.email || '—'} />
        <Row label="Teléfono" value={business.owner?.telefono || '—'} />
      </Section>

      {/* Contacto */}
      <Section title="Contacto del negocio" icon={HiOutlineMapPin}>
        <Row label="Dirección"     value={business.direccion} />
        <Row label="Ciudad"        value={`${business.codigo_postal} ${business.ciudad}`} />
        <Row label="Teléfono"      value={business.telefono} icon={HiOutlinePhone} />
        {business.web && <Row label="Web" value={business.web} icon={HiOutlineGlobeAlt} />}
      </Section>

      {/* Horario */}
      <Section title="Horario de apertura" icon={HiOutlineCalendar}>
        <div className="space-y-2">
          {DIAS.map((d) => {
            const dia = business.horario?.[d.id];
            const cerrado = !dia || dia.cerrado;
            return (
              <div key={d.id} className="flex items-center justify-between bg-surface-elevated rounded-lg p-3">
                <span className="text-sm font-medium text-text-primary">{d.label}</span>
                {cerrado ? (
                  <span className="text-sm text-text-muted italic">Cerrado</span>
                ) : (
                  <span className="text-sm font-mono text-text-primary">{dia.abre} – {dia.cierra}</span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Datos legales */}
      <Section title="Información legal" icon={HiOutlineDocumentText}>
        <Row label="Slug público" value={business.slug} mono />
        <Row label="Registrado el" value={new Date(business.created_at).toLocaleString('es-ES')} />
        {business._count && (
          <Row
            label="Recursos asociados"
            value={`${business._count.servicios} servicios · ${business._count.empleados} empleados · ${business._count.recursos} espacios`}
          />
        )}
      </Section>

      {/* Modal de acción */}
      {actionModal && (
        <ActionModal
          modal={actionModal}
          motivo={motivo}
          setMotivo={setMotivo}
          onConfirm={handleAction}
          onClose={closeModal}
          submitting={submitting}
          businessName={business.nombre}
        />
      )}
    </div>
  );
}

/* ─────────────────── */

function Logo({ business }) {
  if (business.logo_url) {
    return (
      <img
        src={business.logo_url}
        alt=""
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0 border border-border-base"
      />
    );
  }
  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-sm">
      {(business.nombre?.charAt(0) || '?').toUpperCase()}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wide">
        <Icon className="w-4 h-4 text-brand-500" aria-hidden="true" />
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border-base last:border-0">
      <span className="text-sm text-text-muted font-medium">{label}</span>
      <span className={`text-sm font-medium text-text-primary text-right break-words flex items-center gap-1.5 ${mono ? 'font-mono text-xs' : ''}`}>
        {Icon && <Icon className="w-3.5 h-3.5 text-text-muted" aria-hidden="true" />}
        {value}
      </span>
    </div>
  );
}

function ActionModal({ modal, motivo, setMotivo, onConfirm, onClose, submitting, businessName }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-[0_24px_60px_rgba(99,102,241,0.20)] max-w-md w-full p-6 animate-scale-in">

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-bg flex items-center justify-center flex-shrink-0">
              <HiOutlineExclamationTriangle className="w-5 h-5 text-warning-text" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                {modal.title}
              </h2>
              <p className="text-sm text-text-muted mt-0.5">{businessName}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={submitting} aria-label="Cerrar"
            className="p-1.5 rounded-lg text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors">
            <HiOutlineXMark className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          ¿Estás seguro de que quieres realizar esta acción? Se notificará por email al propietario.
        </p>

        {modal.requireMotivo && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Motivo <span className="text-danger-text">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.slice(0, 500))}
              rows={4}
              className="input-field resize-none"
              placeholder="Explica el motivo (mínimo 5 caracteres)"
              maxLength={500}
            />
            <p className="text-xs text-text-muted text-right mt-1">{motivo.length}/500</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
          <button
            onClick={onConfirm}
            disabled={submitting}
            className={modal.color === 'danger' ? 'btn-danger flex-1' : modal.color === 'warning' ? 'btn-secondary flex-1 bg-orange-50 text-orange-800 border-orange-200' : 'btn-success flex-1'}
          >
            {submitting ? 'Procesando…' : modal.label}
          </button>
          <button onClick={onClose} disabled={submitting} className="btn-ghost flex-1">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
