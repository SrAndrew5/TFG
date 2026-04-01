import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import Resources from './pages/Resources';
import BookResource from './pages/BookResource';
import MyBookings from './pages/MyBookings';
import ManageServices from './pages/admin/ManageServices';
import ManageEmployees from './pages/admin/ManageEmployees';
import ManageResources from './pages/admin/ManageResources';
import ManageAppointments from './pages/admin/ManageAppointments';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/services" element={<Services />} />
        <Route path="/book/:serviceId" element={<BookAppointment />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/book-resource/:id" element={<BookResource />} />
        <Route path="/my-bookings" element={<MyBookings />} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute adminOnly><ManageServices /></ProtectedRoute>} />
        <Route path="/admin/employees" element={<ProtectedRoute adminOnly><ManageEmployees /></ProtectedRoute>} />
        <Route path="/admin/resources" element={<ProtectedRoute adminOnly><ManageResources /></ProtectedRoute>} />
        <Route path="/admin/appointments" element={<ProtectedRoute adminOnly><ManageAppointments /></ProtectedRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
