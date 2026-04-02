import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import {
  HiOutlineHome,
  HiOutlineScissors,
  HiOutlineCalendar,
  HiOutlineBuildingOffice2,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineUser,
} from 'react-icons/hi2';

const CLIENT_LINKS = [
  { to: '/home',            icon: HiOutlineHome,            label: 'Inicio' },
  { to: '/services',        icon: HiOutlineScissors,        label: 'Servicios' },
  { to: '/resources',       icon: HiOutlineBuildingOffice2, label: 'Coworking' },
  { to: '/my-appointments', icon: HiOutlineCalendar,        label: 'Mis Citas' },
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
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shadow-[0_2px_8px_rgba(99,102,241,0.35)] flex-shrink-0`}>
      {initials || '?'}
    </div>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ── Notificaciones desde contexto global (persisten entre rutas) ──
  const { notifications, unreadCount, markAllRead, markRead, remove } = useNotifications();

  const [mobileOpen, setMobileOpen]           = useState(false);
  const [userOpen, setUserOpen]               = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [allNotifsModalOpen, setAllNotifsModalOpen] = useState(false);
  const [searchFocused, setSearchFocused]     = useState(false);

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
      <header
        className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-border-base"
        style={{ boxShadow: '0 1px 4px rgba(99,102,241,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">

            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.30)] group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.40)] transition-shadow duration-200">
                <HiOutlineCalendar className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient-brand hidden sm:block" style={{ fontFamily: 'Sora, sans-serif' }}>
                ReservasPro
              </span>
            </Link>

            {/* Barra búsqueda */}
            <div className="flex-1 max-w-md mx-auto hidden md:block">
              <div className={`relative transition-all duration-200 ${searchFocused ? 'scale-[1.02]' : ''}`}>
                <HiOutlineMagnifyingGlass className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${searchFocused ? 'text-brand-500' : 'text-text-muted'}`} />
                <input
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

            {/* Navegación desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {CLIENT_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className={isActive(link.to) ? 'nav-link-active' : 'nav-link'}>
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Zona derecha */}
            <div className="flex items-center gap-2 ml-auto lg:ml-0">

              {/* Campana notificaciones */}
              <div className="relative hidden sm:block" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen((v) => !v)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors duration-200"
                >
                  <HiOutlineBell className={`w-5 h-5 ${notificationsOpen ? 'text-brand-600' : ''}`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent-500 rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl border border-border-base shadow-[0_12px_40px_rgba(99,102,241,0.18)] py-2 flex flex-col z-50 animate-scale-in origin-top-right">
                    <div className="px-4 py-3 border-b border-border-base flex justify-between items-center">
                      <h3 className="text-sm font-bold text-text-primary">Notificaciones</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-brand-600 font-semibold hover:text-brand-700">
                          Marcar leídas
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-80">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm font-medium text-text-muted">
                          No tienes notificaciones.
                        </div>
                      ) : (
                        notifications.map((n, idx) => (
                          <div key={n.id} className="relative group">
                            <button
                              onClick={() => markRead(n.id)}
                              className={`w-full px-4 py-3 flex gap-3 hover:bg-surface-subtle transition-colors text-left ${idx !== 0 ? 'border-t border-border-base/50' : ''}`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'calendar' ? 'bg-success-bg text-success-text' : 'bg-brand-50 text-brand-600'}`}>
                                {n.type === 'calendar'
                                  ? <HiOutlineCalendar className="w-5 h-5" />
                                  : <HiOutlineBuildingOffice2 className="w-5 h-5" />
                                }
                              </div>
                              <div className="pr-6 text-left">
                                <p className={`text-sm ${n.read ? 'text-text-secondary font-medium' : 'text-text-primary font-bold'}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                                <p className="text-[10px] text-text-muted mt-1 font-semibold">{n.time}</p>
                              </div>
                            </button>
                            <button
                              onClick={() => remove(n.id)}
                              className="absolute right-3 top-3 w-6 h-6 rounded flex items-center justify-center text-text-muted hover:bg-danger-bg hover:text-danger-text opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <HiOutlineXMark className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 py-2 border-t border-border-base text-center bg-surface-subtle/50">
                      <button
                        onClick={() => { setNotificationsOpen(false); setAllNotifsModalOpen(true); }}
                        className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors hover:underline"
                      >
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar / dropdown usuario */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-surface-subtle transition-colors duration-200"
                >
                  <Avatar user={user} />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-text-primary leading-tight">{user?.nombre}</p>
                    <p className="text-xs text-text-muted capitalize leading-tight">{user?.rol?.toLowerCase()}</p>
                  </div>
                  <HiOutlineChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 hidden sm:block ${userOpen ? 'rotate-180' : ''}`} />
                </button>

                {userOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl border border-border-base shadow-[0_8px_32px_rgba(99,102,241,0.16)] py-1.5 animate-scale-in z-50">
                    <div className="px-4 py-3 border-b border-border-base mb-1">
                      <p className="text-sm font-semibold text-text-primary">{user?.nombre} {user?.apellidos}</p>
                      <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
                    </div>

                    <Link to="/my-appointments" onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-text-secondary hover:bg-brand-50 hover:text-brand-700 transition-colors duration-150 rounded-lg mx-1">
                      <HiOutlineCalendar className="w-4 h-4" /> Mis Reservas
                    </Link>

                    <Link to="/profile" onClick={() => setUserOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 text-sm text-text-secondary hover:bg-brand-50 hover:text-brand-700 transition-colors duration-150 rounded-lg mx-1">
                      <HiOutlineUser className="w-4 h-4" /> Mi Perfil
                    </Link>

                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 mt-1 text-sm font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors duration-150 rounded-lg mx-1 border border-brand-200/50">
                        <HiOutlineCog6Tooth className="w-4 h-4 text-brand-600" /> Panel de Administración
                      </Link>
                    )}

                    <div className="border-t border-border-base my-1 mx-2" />

                    <button onClick={() => { handleLogout(); setUserOpen(false); }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-danger-text hover:bg-danger-bg transition-colors duration-150 rounded-lg mx-1">
                      <HiOutlineArrowRightOnRectangle className="w-4 h-4" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

              {/* Hamburguesa mobile */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-subtle transition-colors duration-200"
              >
                {mobileOpen ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlineBars3 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${mobileOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white border-t border-border-base px-4 py-4 space-y-1">
            <div className="relative mb-3">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" placeholder="Buscar servicios locales..." className="input-field pl-10 text-sm" />
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted px-2 pb-1">Navegación</p>
            {CLIENT_LINKS.map((link) => (
              <Link key={link.to} to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive(link.to) ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-text-secondary hover:bg-surface-subtle'}`}
                onClick={() => setMobileOpen(false)}
              >
                <link.icon className="w-4.5 h-4.5" />
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <>
                <div className="border-t border-border-base my-2" />
                <Link to="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-brand-50 text-brand-700"
                  onClick={() => setMobileOpen(false)}
                >
                  <HiOutlineCog6Tooth className="w-4.5 h-4.5 text-brand-600" /> Panel de Administración
                </Link>
              </>
            )}

            <div className="border-t border-border-base mt-2 pt-3">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-text hover:bg-danger-bg">
                <HiOutlineArrowRightOnRectangle className="w-4.5 h-4.5" /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal todas las notificaciones */}
      {allNotifsModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAllNotifsModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-[0_24px_60px_rgba(31,41,55,0.2)] max-w-lg w-full relative z-10 flex flex-col overflow-hidden animate-scale-in">
            <div className="px-6 py-5 border-b border-border-base flex justify-between items-center bg-surface-subtle/50">
              <h2 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                Todas las Notificaciones
              </h2>
              <button onClick={() => setAllNotifsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-text-secondary hover:bg-danger-bg hover:text-danger-text border border-border-base transition-colors">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto bg-white">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-text-muted font-medium">No hay notificaciones.</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-4 flex gap-4 hover:bg-surface-subtle transition-colors rounded-xl items-start relative group mb-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border border-border-base/50 ${n.type === 'calendar' ? 'bg-success-bg text-success-text' : 'bg-brand-50 text-brand-600'}`}>
                      {n.type === 'calendar'
                        ? <HiOutlineCalendar className="w-6 h-6" />
                        : <HiOutlineBuildingOffice2 className="w-6 h-6" />
                      }
                    </div>
                    <div className="flex-1 pr-6">
                      <p className="text-sm font-bold text-text-primary">{n.title}</p>
                      <p className="text-sm text-text-secondary mt-1">{n.body}</p>
                      <p className="text-xs text-text-muted tracking-wide mt-2 font-medium">{n.time}</p>
                    </div>
                    <button
                      onClick={() => remove(n.id)}
                      className="absolute right-4 top-4 text-text-muted hover:text-danger-text hover:bg-danger-bg p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <HiOutlineXMark className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
