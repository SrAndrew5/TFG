import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyBusiness } from '../../services/businessService';

/**
 * Wrapper de ruta para el panel BUSINESS_OWNER.
 *
 * Política:
 * - Si no hay sesión → /login
 * - Si rol distinto de BUSINESS_OWNER → /403
 * - Si el negocio está PENDIENTE/RECHAZADO/SUSPENDIDO → /registro-empresa/pendiente
 *   (la pantalla de "pendiente" lee también el estado y se adapta)
 * - Si está ACTIVO → renderiza children
 *
 * NOTA: aislado en su propio componente para no tocar `ProtectedRoute` existente.
 */
export default function BusinessRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const [business, setBusiness] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading || !user || user.rol !== 'BUSINESS_OWNER') {
      setChecking(false);
      return;
    }
    getMyBusiness()
      .then((res) => setBusiness(res.data.data))
      .catch(() => setBusiness(null))
      .finally(() => setChecking(false));
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.rol !== 'BUSINESS_OWNER') return <Navigate to="/403" replace />;
  if (!business || business.estado !== 'ACTIVO') {
    return <Navigate to="/registro-empresa/pendiente" replace />;
  }

  return children;
}
