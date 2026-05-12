import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import { parseDate } from '../../utils/dateUtils';
import {
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineBookmark,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineNoSymbol,
  HiOutlineShieldCheck,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi2';

/**
 * Mapea cada tipo de notificación a su icono y estilo de fondo.
 * Los tipos vienen del enum permitido en el Joi schema del backend.
 */
const NOTIF_META = {
  booking:  { Icon: HiOutlineCalendar,           style: 'bg-success-bg text-success-text' },
  space:    { Icon: HiOutlineBuildingOffice2,    style: 'bg-brand-50 text-brand-700' },
  reminder: { Icon: HiOutlineClock,              style: 'bg-warning-bg text-warning-text' },
  review:   { Icon: HiOutlineStar,               style: 'bg-amber-50 text-amber-700' },
  success:  { Icon: HiOutlineCheckCircle,        style: 'bg-success-bg text-success-text' },
  warning:  { Icon: HiOutlineExclamationTriangle,style: 'bg-warning-bg text-warning-text' },
  error:       { Icon: HiOutlineExclamationTriangle, style: 'bg-danger-bg text-danger-text' },
  info:        { Icon: HiOutlineInformationCircle,   style: 'bg-info-bg text-info-text' },
  suspended:   { Icon: HiOutlineNoSymbol,            style: 'bg-danger-bg text-danger-text' },
  reactivated: { Icon: HiOutlineShieldCheck,         style: 'bg-success-bg text-success-text' },
};

function getNotifMeta(type) {
  return NOTIF_META[type] ?? NOTIF_META.info;
}


/**
 * Formatea una fecha ISO como tiempo relativo en español.
 *   "Ahora mismo" / "hace 5 min" / "hace 2 h" / "hace 3 d" / "12/04/2026"
 */
function timeAgo(iso) {
  if (!iso) return '';
  const then = parseDate(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60)        return 'Ahora mismo';
  if (diffSec < 3600)      return `hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400)     return `hace ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 86400 * 7) return `hace ${Math.floor(diffSec / 86400)} d`;
  return parseDate(iso).toLocaleDateString('es-ES');
}

const CLIENT_LINKS = [
  { to: '/home',        icon: HiOutlineHome,            label: 'Inicio' },
  { to: '/explorar',    icon: HiOutlineGlobeAlt,        label: 'Explorar' },
  { to: '/resources',   icon: HiOutlineBuildingOffice2, label: 'Coworking' },
  { to: '/my-bookings', icon: HiOutlineBookmark,        label: 'Mis Reservas' },
];

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

function Avatar({ user, size = 'md' }) {
  const initials = `${user?.nombre?.charAt(0) ?? ''}${user?.apellidos?.charAt(0) ?? ''}`.toUpperCase();
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={initials}
        className={`${cls} rounded-full object-cover shadow-[0_2px_8px_rgba(99,102,241,0.35)] flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shadow-[0_2px_8px_rgba(99,102,241,0.35)] flex-shrink-0`}>
      {initials || '?'}
    </div>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin, openLoginModal } = useAuth();
  const isBusinessOwner = user?.rol === 'BUSINESS_OWNER';
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, toggleDark] = useDarkMode();

  // ── Notificaciones desde contexto global (persisten entre rutas) ──
  const { notifications, unreadCount, markAllRead, markRead, remove } = useNotifications();

  const [mobileOpen, setMobileOpen]           = useState(false);
  const [userOpen, setUserOpen]               = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [allNotifsModalOpen, setAllNotifsModalOpen] = useState(false);
  const [searchFocused, setSearchFocused]     = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/explorar?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchFocused(false);
    }
  };

  const userRef  = useRef(null);
  const notifRef = useRef(null);

  useOutsideClose(userRef,  () => setUserOpen(false));
  useOutsideClose(notifRef, () => setNotificationsOpen(false));

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-[#0C1410]/90 backdrop-blur-xl border-b border-border-base transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">

          {/* Logo */}
          <Link to="/home" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center shadow-brand group-hover:scale-105 transition-transform duration-300">
              <HiOutlineBuildingOffice2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-brand-500 tracking-tighter">
              COWORK<span className="text-accent-500">PRO</span>
            </span>
          </Link>

          {/* Search bar - Refined */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" aria-hidden="true" />
              <input
                type="text"
                aria-label="Buscar espacios o servicios"
                placeholder="Buscar tu próximo espacio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                className="w-full bg-surface-subtle border border-transparent rounded-2xl pl-12 pr-4 py-3 text-sm focus:bg-white dark:focus:bg-surface-elevated focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all duration-300 outline-none"
              />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {CLIENT_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${isActive(link.to) ? 'bg-brand-500 text-white' : 'text-text-secondary hover:bg-surface-subtle hover:text-brand-500'}`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {!user ? (
              <div className="hidden sm:flex items-center gap-3">
                <button 
                  onClick={() => openLoginModal()}
                  className="px-6 py-2.5 text-sm font-black uppercase tracking-widest text-brand-500 hover:text-accent-500 transition-colors"
                >
                  Entrar
                </button>
                <Link 
                  to="/register"
                  className="btn-primary px-6 py-2.5 text-xs font-black uppercase tracking-widest"
                >
                  Registro
                </Link>
              </div>
            ) : (
              <>
                {/* Notifications */}
                <div className="relative hidden sm:block" ref={notifRef}>
                  <button
                    onClick={() => setNotificationsOpen((v) => !v)}
                    aria-label={`Ver ${unreadCount} notificaciones nuevas`}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl bg-surface-subtle text-text-secondary hover:bg-brand-500 hover:text-white transition-all duration-300"
                  >
                    <HiOutlineBell className="w-6 h-6" aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-accent-500 rounded-full ring-2 ring-white" aria-hidden="true" />
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute top-full right-0 mt-4 w-96 bg-white dark:bg-surface-elevated rounded-[32px] border border-border-base shadow-lg py-4 z-50 animate-fade-up">
                      <div className="px-6 py-4 border-b border-border-base flex justify-between items-center">
                        <h3 className="text-lg font-bold text-brand-500">Notificaciones</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-accent-500 font-bold hover:underline">
                            Marcar todas como leídas
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto px-2">
                        {notifications.length === 0 ? (
                          <div className="p-12 text-center text-text-muted font-medium">
                            Todo al día.
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const { Icon, style } = getNotifMeta(n.type);
                            return (
                              <div key={n.id} className="group relative">
                                <button
                                  onClick={() => markRead(n.id)}
                                  className="w-full p-4 flex gap-4 hover:bg-surface-subtle transition-all duration-300 rounded-2xl text-left"
                                >
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style}`}>
                                    <Icon className="w-6 h-6" aria-hidden="true" />
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm ${n.read ? 'text-text-secondary' : 'text-brand-500 font-bold'}`}>
                                      {n.title}
                                    </p>
                                    <p className="text-xs text-text-muted mt-1">{timeAgo(n.created_at)}</p>
                                  </div>
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setUserOpen((v) => !v)}
                    className="flex items-center gap-3 p-1.5 rounded-full hover:bg-surface-subtle transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user?.nombre?.charAt(0)
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-bold text-brand-500 leading-none">{user?.nombre}</p>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">{user?.rol}</p>
                    </div>
                    <HiOutlineChevronDown className={`w-4 h-4 text-text-muted transition-transform ${userOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>

                  {userOpen && (
                    <div className="absolute top-full right-0 mt-4 w-64 bg-white dark:bg-surface-elevated rounded-[32px] border border-border-base shadow-lg p-3 z-50 animate-fade-up">
                      <div className="px-5 py-4 border-b border-border-base mb-2">
                        <p className="text-sm font-bold text-brand-500">{user?.nombre} {user?.apellidos}</p>
                        <p className="text-xs text-text-muted mt-0.5 truncate">{user?.email}</p>
                      </div>

                      <Link to="/my-bookings" onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-text-secondary hover:bg-brand-50 dark:hover:bg-surface-subtle hover:text-brand-500 rounded-2xl transition-all">
                        <HiOutlineBookmark className="w-5 h-5" /> Mis Reservas
                      </Link>

                      <Link to="/profile" onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-text-secondary hover:bg-brand-50 dark:hover:bg-surface-subtle hover:text-brand-500 rounded-2xl transition-all">
                        <HiOutlineUser className="w-5 h-5" /> Mi Perfil
                      </Link>

                      {isBusinessOwner && (
                        <Link to="/business/dashboard" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 mt-1 text-sm font-bold text-accent-500 bg-orange-50 dark:bg-accent-500/10 hover:bg-accent-500 hover:text-white rounded-2xl transition-all group">
                          <HiOutlineBuildingOffice2 className="w-5 h-5" />
                          <span>Mi Empresa</span>
                          <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-accent-500/10 group-hover:bg-white/20 text-accent-600 group-hover:text-white px-2 py-0.5 rounded-full transition-all">Panel</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 mt-1 text-sm font-bold text-accent-500 bg-accent-50 dark:bg-accent-500/10 rounded-2xl transition-all">
                          <HiOutlineCog6Tooth className="w-5 h-5" /> Administrar
                        </Link>
                      )}

                      <div className="h-px bg-border-base my-2 mx-3" />

                      <button onClick={() => { handleLogout(); setUserOpen(false); }}
                        className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <HiOutlineArrowRightOnRectangle className="w-5 h-5" /> Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="hidden sm:flex w-11 h-11 items-center justify-center rounded-2xl bg-surface-subtle text-text-secondary hover:bg-brand-500 hover:text-white transition-all duration-300"
            >
              {isDark
                ? <HiOutlineSun className="w-5 h-5" aria-hidden="true" />
                : <HiOutlineMoon className="w-5 h-5" aria-hidden="true" />}
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-surface-subtle text-text-secondary"
            >
              {mobileOpen ? <HiOutlineXMark className="w-6 h-6" aria-hidden="true" /> : <HiOutlineBars3 className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white dark:bg-surface-elevated border-t border-border-base p-6 animate-fade-up">
            <nav className="flex flex-col gap-2">
              {CLIENT_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold ${isActive(link.to) ? 'bg-brand-500 text-white' : 'bg-surface-subtle text-text-secondary'}`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              <button
                onClick={toggleDark}
                className="flex items-center gap-3 p-4 rounded-2xl text-sm font-bold bg-surface-subtle text-text-secondary"
              >
                {isDark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
                {isDark ? 'Modo claro' : 'Modo oscuro'}
              </button>
            </nav>
          </div>
        )}
      </header>
      <div className="h-20" /> {/* Spacer for fixed header */}
    </>
  );
}
