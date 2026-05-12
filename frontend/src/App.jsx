// =============================================================
// MEJORAS PENDIENTES (FRONTEND) ANTES DE HOSTEAR
// =============================================================
// 1. BÚSQUEDA GLOBAL: La barra de búsqueda del Navbar navega al mapa con ?q=...
//    pero no filtra resultados en tiempo real. Implementar un dropdown de sugerencias
//    consultando /api/services y /api/resources al escribir (debounce de 300ms).
// 2. MODO OSCURO: Toda la app usa tokens de tema claro. Añadir un toggle de dark mode
//    con CSS variables en :root[data-theme="dark"] y guardar la preferencia en localStorage.
// 3. AVATAR DE USUARIO: El perfil y navbar muestran iniciales. Añadir upload de foto
//    con preview (Cloudinary o endpoint /api/auth/avatar).
// 4. CALENDARIO REAL: El botón "Ver en mi Calendario" de BookingSuccess navega a
//    /my-appointments. Integrar generación de fichero .ics o la API de Google Calendar.
// 5. INTERNACIONALIZACIÓN: Toda la UI está en español. Si se quiere expandir,
//    añadir i18next con soporte para en/es.
// 6. PWA: Añadir service worker + manifest.json para instalar la app como PWA
//    (especialmente útil para usuarios móviles que reservan citas frecuentemente).
// 7. ACCESIBILIDAD: Revisar contraste de colores, añadir aria-labels en botones de icono,
//    y comprobar navegación por teclado en modales.
// 8. TESTS: No hay tests de componentes React. Añadir Vitest + Testing Library
//    para los flujos críticos: login, reserva de cita, reserva de recurso.
// =============================================================

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import ScrollToTop from './components/shared/ScrollToTop';
import ProtectedRoute from './components/shared/ProtectedRoute';
import BusinessRoute from './components/shared/BusinessRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import BusinessLayout from './layouts/BusinessLayout';

// Páginas cargadas bajo demanda (code splitting)
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const Home            = lazy(() => import('./pages/Home'));

const UserProfile     = lazy(() => import('./pages/UserProfile'));
const BookingSuccess  = lazy(() => import('./pages/BookingSuccess'));
const Resources       = lazy(() => import('./pages/Resources'));
const BookResource    = lazy(() => import('./pages/BookResource'));
const MyBookings      = lazy(() => import('./pages/MyBookings'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const ExplorerPage    = lazy(() => import('./pages/ExplorerPage'));
const BusinessProfilePage = lazy(() => import('./pages/BusinessProfilePage'));

// Módulo SaaS — registro de empresa y panel BUSINESS_OWNER
const BusinessRegisterPage = lazy(() => import('./pages/BusinessRegisterPage'));
const BusinessPendingPage  = lazy(() => import('./pages/BusinessPendingPage'));
const BusinessDashboard    = lazy(() => import('./pages/business/BusinessDashboard'));
const BusinessAppointments = lazy(() => import('./pages/business/BusinessAppointments'));
const BusinessProfile      = lazy(() => import('./pages/business/BusinessProfile'));
const BusinessServices     = lazy(() => import('./pages/business/BusinessServices'));
const BusinessEmployees    = lazy(() => import('./pages/business/BusinessEmployees'));
const BusinessResources          = lazy(() => import('./pages/business/BusinessResources'));
const BusinessResourceBookings   = lazy(() => import('./pages/business/BusinessResourceBookings'));

// Panel admin — cargado solo cuando el usuario es admin
const AdminDashboard       = lazy(() => import('./pages/admin/Dashboard'));
const ManageUsers          = lazy(() => import('./pages/admin/ManageUsers'));
const ManageResources      = lazy(() => import('./pages/admin/ManageResources'));
const AdminBusinessList    = lazy(() => import('./pages/admin/AdminBusinessList'));
const AdminBusinessDetail  = lazy(() => import('./pages/admin/AdminBusinessDetail'));
const NotFound              = lazy(() => import('./pages/NotFound'));
const Forbidden             = lazy(() => import('./pages/Forbidden'));
const AccountSuspendedPage  = lazy(() => import('./pages/AccountSuspendedPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8FF' }}>
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-sm font-black uppercase tracking-[0.3em] animate-pulse">Cargando Sistema</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Registro de empresa (SaaS) */}
        <Route path="/registro-empresa" element={<BusinessRegisterPage />} />
        <Route path="/registro-empresa/pendiente" element={<BusinessPendingPage />} />

        {/* Rutas públicas con Layout (sin auth) — Explorador de negocios */}
        <Route element={<Layout />}>
          <Route path="/explorar" element={<ExplorerPage />} />
          <Route path="/negocio/:slug" element={<BusinessProfilePage />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/book-resource/:resourceId" element={<BookResource />} />
        </Route>

        {/* Ruta raíz: pública si no hay sesión → /explorar, con sesión → /home o /admin */}
        <Route
          path="/"
          element={
            user
              ? <Navigate to={isAdmin ? '/admin' : '/home'} replace />
              : <Navigate to="/explorar" replace />
          }
        />

        {/* Protected routes with layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Route>

        {/* Admin routes with AdminLayout */}
        <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/resources" element={<ManageResources />} />
          <Route path="/admin/businesses" element={<AdminBusinessList />} />
          <Route path="/admin/businesses/:id" element={<AdminBusinessDetail />} />
        </Route>

        {/* Panel BUSINESS_OWNER — solo accesible si rol=BUSINESS_OWNER y negocio ACTIVO */}
        <Route element={<BusinessRoute><BusinessLayout /></BusinessRoute>}>
          <Route path="/business" element={<Navigate to="/business/dashboard" replace />} />
          <Route path="/business/dashboard"  element={<BusinessDashboard />} />
          <Route path="/business/citas"      element={<BusinessAppointments />} />
          <Route path="/business/services"   element={<BusinessServices />} />
          <Route path="/business/resources"         element={<BusinessResources />} />
          <Route path="/business/reservas-espacios" element={<BusinessResourceBookings />} />
          <Route path="/business/employees"  element={<BusinessEmployees />} />
          <Route path="/business/perfil"     element={<BusinessProfile />} />
        </Route>

        {/* 403 / 404 / suspended */}
        <Route path="/403" element={<Forbidden />} />
        <Route path="/cuenta-suspendida" element={<AccountSuspendedPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          {/* NotificationsProvider envuelve toda la app — el estado persiste entre rutas */}
          <NotificationsProvider>
            <ScrollToTop />
            <AppRoutes />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1.5px solid #E8E8F5',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.14)',
              },
              success: {
                iconTheme: { primary: '#10B981', secondary: '#FFFFFF' },
                style: { borderLeft: '4px solid #10B981' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
                style: { borderLeft: '4px solid #EF4444' },
              },
            }}
          />
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
