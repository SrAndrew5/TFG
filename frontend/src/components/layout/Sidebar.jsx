import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome, HiOutlineCalendar, HiOutlineScissors,
  HiOutlineBuildingOffice2, HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth, HiOutlineUsers, HiOutlineChartBarSquare,
  HiOutlineArrowRightOnRectangle, HiOutlineCube
} from 'react-icons/hi2';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const clientLinks = [
    { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
    { to: '/services', icon: HiOutlineScissors, label: 'Servicios' },
    { to: '/my-appointments', icon: HiOutlineCalendar, label: 'Mis Citas' },
    { to: '/resources', icon: HiOutlineBuildingOffice2, label: 'Coworking' },
    { to: '/my-bookings', icon: HiOutlineClipboardDocumentList, label: 'Mis Reservas' },
  ];

  const adminLinks = [
    { to: '/admin', icon: HiOutlineChartBarSquare, label: 'Estadísticas' },
    { to: '/admin/services', icon: HiOutlineCog6Tooth, label: 'Gestión Servicios' },
    { to: '/admin/employees', icon: HiOutlineUsers, label: 'Gestión Empleados' },
    { to: '/admin/resources', icon: HiOutlineCube, label: 'Gestión Recursos' },
    { to: '/admin/appointments', icon: HiOutlineCalendar, label: 'Gestión Citas' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-900/80 backdrop-blur-xl border-r border-surface-800 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-surface-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
          ReservasPro
        </h1>
        <p className="text-xs text-surface-500 mt-1">Sistema de Reservas</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Client links */}
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 mb-2">
          General
        </p>
        {clientLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={isActive(link.to) ? 'sidebar-link-active' : 'sidebar-link'}
          >
            <link.icon className="w-5 h-5" />
            <span>{link.label}</span>
          </Link>
        ))}

        {/* Admin links */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-surface-800" />
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 mb-2">
              Administración
            </p>
            {adminLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={isActive(link.to) ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info + Logout */}
      <div className="p-4 border-t border-surface-800">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">
            {user?.nombre?.charAt(0)}{user?.apellidos?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-200 truncate">
              {user?.nombre} {user?.apellidos}
            </p>
            <p className="text-xs text-surface-500">{user?.rol}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-danger hover:bg-danger/10 hover:text-danger">
          <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
