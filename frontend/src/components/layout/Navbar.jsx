import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineScissors,
  HiOutlineCalendar,
  HiOutlineBuildingOffice2,
  HiOutlineClipboardDocumentList,
  HiOutlineChartBarSquare,
  HiOutlineCog6Tooth,
  HiOutlineUsers,
  HiOutlineCube,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
} from 'react-icons/hi2';

/* ─── Links de navegación ─── */
const CLIENT_LINKS = [
  { to: '/',                icon: HiOutlineHome,                label: 'Inicio' },
  { to: '/services',        icon: HiOutlineScissors,            label: 'Servicios' },
  { to: '/resources',       icon: HiOutlineBuildingOffice2,     label: 'Coworking' },
  { to: '/my-appointments', icon: HiOutlineCalendar,            label: 'Mis Citas' },
  { to: '/my-bookings',     icon: HiOutlineClipboardDocumentList, label: 'Mis Reservas' },
];

const ADMIN_LINKS = [
  { to: '/admin',              icon: HiOutlineChartBarSquare, label: 'Estadísticas' },
  { to: '/admin/services',     icon: HiOutlineCog6Tooth,      label: 'Gestión Servicios' },
  { to: '/admin/employees',    icon: HiOutlineUsers,           label: 'Gestión Empleados' },
  { to: '/admin/resources',    icon: HiOutlineCube,            label: 'Gestión Recursos' },
  { to: '/admin/appointments', icon: HiOutlineCalendar,        label: 'Gestión Citas' },
];

/* ─── Hook: cierra dropdown al hacer clic fuera ─── */
function useOutsideClose(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

/* ─── Avatar con iniciales ─── */
function Avatar({ user, size = 'md' }) {
  const initials = `${user?.nombre?.charAt(0) ?? ''}${user?.apellidos?.charAt(0) ?? ''}`.toUpperCase();
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shadow-[0_2px_8px_rgba(99,102,241,0.35)] flex-shrink-0`}
    >
      {initials || '?'}
    </div>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen]   = useState(false);
  const [adminOpen, setAdminOpen]     = useState(false);
  const [userOpen, setUserOpen]       = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const adminRef = useRef(null);
  const userRef  = useRef(null);

  useOutsideClose(adminRef, () => setAdminOpen(false));
  useOutsideClose(userRef,  () => setUserOpen(false));

  // Cierra el menú móvil al cambiar de ruta
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const isAdminActive = ADMIN_LINKS.some((l) => location.pathname.startsWith(l.to));

  return (
    <>
      {/* ── Navbar principal ── */}
      <header
        className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border-base"
        style={{ boxShadow: '0 1px 4px rgba(99,102,241,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.30)] group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.40)] transition-shadow duration-200">
                <HiOutlineCalendar className="w-4.5 h-4.5 text-white" />
              </div>
              <span
                className="text-lg font-bold text-gradient-brand hidden sm:block"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                ReservasPro
              </span>
            </Link>

            {/* ── Barra de búsqueda (centro) ── */}
            <div className="flex-1 max-w-md mx-auto hidden md:block">
              <div
                className={`relative transition-all duration-200 ${
                  searchFocused ? 'scale-[1.02]' : ''
                }`}
              >
                <HiOutlineMagnifyingGlass
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                    searchFocused ? 'text-brand-500' : 'text-text-muted'
                  }`}
                />
                <input
                  id="navbar-search"
                  type="text"
                  placeholder="Buscar servicios, espacios..."
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-[10px] border-[1.5px] outline-none transition-all duration-200 ${
                    searchFocused
                      ? 'bg-white border-brand-500 ring-[3px] ring-[rgba(99,102,241,0.15)] text-text-primary'
                      : 'bg-surface-elevated border-border-base text-text-primary placeholder-text-muted hover:border-border-strong'
                  }`}
                />
              </div>
            </div>

            {/* ── Navegación desktop ── */}
            <nav className="hidden lg:flex items-center gap-1">
              {CLIENT_LINKS.filter((l) => l.to !== '/').map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={isActive(link.to) ? 'nav-link-active' : 'nav-link'}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Dropdown Admin */}
              {isAdmin && (
                <div className="relative" ref={adminRef}>
                  <button
                    id="admin-menu-btn"
                    onClick={() => setAdminOpen((v) => !v)}
                    className={`${isAdminActive ? 'nav-link-active' : 'nav-link'} flex items-center gap-2`}
                  >
                    <HiOutlineCog6Tooth className="w-4 h-4" />
                    <span>Admin</span>
                    <HiOutlineChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {adminOpen && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl border border-border-base shadow-[0_8px_32px_rgba(99,102,241,0.16)] py-1.5 animate-scale-in">
                      {ADMIN_LINKS.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-text-secondary hover:bg-brand-50 hover:text-brand-700 transition-colors duration-150 rounded-lg mx-1"
                        >
                          <link.icon className="w-4 h-4 flex-shrink-0" />
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* ── Zona derecha: notificaciones + avatar ── */}
            <div className="flex items-center gap-2 ml-auto lg:ml-0">

              {/* Notificaciones */}
              <button
                id="notifications-btn"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors duration-200 hidden sm:flex"
                aria-label="Notificaciones"
              >
                <HiOutlineBell className="w-5 h-5" />
                {/* Dot indicador */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white" />
              </button>

              {/* Dropdown de usuario */}
              <div className="relative" ref={userRef}>
                <button
                  id="user-menu-btn"
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-surface-subtle transition-colors duration-200"
                  aria-label="Menú de usuario"
                >
                  <Avatar user={user} />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-text-primary leading-tight">
                      {user?.nombre}
                    </p>
                    <p className="text-xs text-text-muted capitalize leading-tight">
                      {user?.rol?.toLowerCase()}
                    </p>
                  </div>
                  <HiOutlineChevronDown
                    className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 hidden sm:block ${userOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl border border-border-base shadow-[0_8px_32px_rgba(99,102,241,0.16)] py-1.5 animate-scale-in">
                    {/* Cabecera del dropdown */}
                    <div className="px-4 py-3 border-b border-border-base mb-1">
                      <p className="text-sm font-semibold text-text-primary">
                        {user?.nombre} {user?.apellidos}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
                    </div>

                    <Link
                      to="/"
                      className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-text-secondary hover:bg-brand-50 hover:text-brand-700 transition-colors duration-150 rounded-lg mx-1"
                    >
                      <HiOutlineHome className="w-4 h-4" />
                      Mi Panel
                    </Link>

                    <div className="border-t border-border-base my-1 mx-2" />

                    <button
                      id="logout-btn"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-danger-text hover:bg-danger-bg transition-colors duration-150 rounded-lg mx-1"
                    >
                      <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

              {/* Botón hamburguesa (mobile / tablet) */}
              <button
                id="mobile-menu-btn"
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-subtle transition-colors duration-200"
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen
                  ? <HiOutlineXMark className="w-5 h-5" />
                  : <HiOutlineBars3 className="w-5 h-5" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Menú móvil / tablet ── */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white border-t border-border-base px-4 py-4 space-y-1">

            {/* Búsqueda en mobile */}
            <div className="relative mb-3">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar servicios, espacios..."
                className="input-field pl-10 text-sm"
              />
            </div>

            {/* Links de navegación */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted px-2 pb-1">
              Navegación
            </p>
            {CLIENT_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive(link.to)
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <link.icon className="w-4.5 h-4.5 flex-shrink-0" />
                {link.label}
              </Link>
            ))}

            {/* Admin links en mobile */}
            {isAdmin && (
              <>
                <div className="border-t border-border-base my-2" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted px-2 pb-1">
                  Administración
                </p>
                {ADMIN_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                      isActive(link.to)
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                    }`}
                  >
                    <link.icon className="w-4.5 h-4.5 flex-shrink-0" />
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {/* Logout mobile */}
            <div className="border-t border-border-base mt-2 pt-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-text hover:bg-danger-bg transition-colors duration-150"
              >
                <HiOutlineArrowRightOnRectangle className="w-4.5 h-4.5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
