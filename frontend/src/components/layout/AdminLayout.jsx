import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineChartPie,
  HiOutlineCalendar,
  HiOutlineScissors,
  HiOutlineUsers,
  HiOutlineCog6Tooth,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBriefcase
} from 'react-icons/hi2';

const ADMIN_LINKS = [
  { to: '/admin', icon: HiOutlineChartPie, label: 'Dashboard' },
  { to: '/admin/appointments', icon: HiOutlineCalendar, label: 'Reservas' },
  { to: '/admin/services', icon: HiOutlineScissors, label: 'Servicios' },
  { to: '/admin/users', icon: HiOutlineUsers, label: 'Usuarios / Clientes' },
  { to: '/admin/employees', icon: HiOutlineBriefcase, label: 'Equipo / Especialistas' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex bg-surface-subtle overflow-hidden">

      {/* ── Mobile Hamburger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-white p-2.5 rounded-xl shadow-[0_2px_12px_rgba(31,41,55,0.08)] border border-border-base text-text-primary"
      >
        <HiOutlineBars3 className="w-6 h-6" />
      </button>

      {/* ── Overlay Sidebar Mobile ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* ── Sidebar (Índigo Profundo) ── */}
      <aside className={`fixed lg:static top-0 left-0 w-72 h-screen flex-shrink-0 z-50 transform transition-transform duration-300 ease-in-out bg-brand-900 text-white flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Header Sidebar */}
        <div className="h-20 flex items-center px-6 border-b border-brand-800 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
              <HiOutlineChartPie className="w-4.5 h-4.5 text-accent-300" />
            </div>
            <span className="font-extrabold tracking-wide text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
              Admin<span className="text-brand-300">Pro</span>
            </span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-brand-300 hover:text-white p-2">
            <HiOutlineXMark className="w-6 h-6" />
          </button>
        </div>

        {/* User Card Resumen */}
        <div className="px-6 py-5 border-b border-brand-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center font-bold text-sm border-2 border-brand-600 shadow-sm">
              {user?.nombre?.charAt(0)}{user?.apellidos?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.nombre} {user?.apellidos}</p>
              <p className="text-xs text-brand-300">Administrador</p>
            </div>
          </div>
        </div>

        {/* Links Navegación */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-brand-400/80 mb-3 mt-2">Menú Principal</p>

          {ADMIN_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive(link.to)
                  ? 'bg-brand-600 text-white shadow-brand'
                  : 'text-brand-200 hover:bg-brand-800/70 hover:text-white'
                }`}
            >
              <link.icon className={`w-5 h-5 transition-transform duration-200 ${isActive(link.to) ? 'scale-110 text-white' : 'text-brand-400 group-hover:text-brand-300'}`} />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Cierre Sesión Sidebar */}
        <div className="p-4 border-t border-brand-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3.5 py-3 w-full rounded-xl text-sm font-semibold text-brand-200 hover:bg-danger-bg hover:text-danger-text hover:shadow-sm transition-all duration-200"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido Principal (Right Panel) ── */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Header Superior del Contenido (Desplazado en móvil por el botón de menú) */}
        <header className="h-20 lg:flex hidden items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-border-base sticky top-0 z-30 shadow-[0_2px_12px_rgba(99,102,241,0.02)]">
          <h2 className="text-xl font-bold text-text-primary uppercase tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            {ADMIN_LINKS.find(link => isActive(link.to))?.label || 'Panel de Administración'}
          </h2>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-elevated border border-border-base text-text-secondary hover:bg-danger-bg hover:text-danger-text hover:border-danger-border transition-all shadow-sm"
            title="Salir al Home"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </header>

        {/* Outlet para inyectar vistas (Dashboard, Tabla) */}
        <div className="flex-1 p-4 pt-20 lg:pt-8 sm:p-8 w-full">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
