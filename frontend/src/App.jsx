import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import MapView from './pages/Map';
import UserProfile from './pages/UserProfile';
import BookingSuccess from './pages/BookingSuccess';
import Services from './pages/Services';
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import AdminDashboard from './pages/admin/Dashboard';
import ManageServices from './pages/admin/ManageServices';
import ManageEmployees from './pages/admin/ManageEmployees';
import ManageAppointments from './pages/admin/ManageAppointments';
import ManageUsers from './pages/admin/ManageUsers';

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
        <Route path="/home" element={<Home />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
        <Route path="/services" element={<Services />} />
        <Route path="/book/:serviceId" element={<BookAppointment />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
      </Route>

      {/* Admin routes with AdminLayout */}
      <Route element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/services" element={<ManageServices />} />
        <Route path="/admin/employees" element={<ManageEmployees />} />
        <Route path="/admin/appointments" element={<ManageAppointments />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}
