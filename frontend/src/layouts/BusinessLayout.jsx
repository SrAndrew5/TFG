import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBusiness } from '../services/businessService';
import {
  HiOutlineChartPie,
  HiOutlineCalendar,
  HiOutlineUserCircle,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBuildingOffice2,
  HiOutlineWrenchScrewdriver,
  HiOutlineUsers,
  HiOutlineSquares2X2,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';

const COWORKING_TIPOS = ['COWORKING'];

const BUSINESS_LINKS = [
  { to: '/business/dashboard',         icon: HiOutlineChartPie,              label: 'Dashboard' },
  // Service-based businesses
  { to: '/business/citas',             icon: HiOutlineCalendar,              label: 'Citas',            serviceOnly: true },
  { to: '/business/services',          icon: HiOutlineWrenchScrewdriver,     label: 'Mis servicios',    serviceOnly: true },
  { to: '/business/employees',         icon: HiOutlineUsers,                 label: 'Mis empleados',    serviceOnly: true },
  // Coworking / space-based businesses
  { to: '/business/reservas-espacios', icon: HiOutlineClipboardDocumentList, label: 'Reservas Espacios', coworkingOnly: true },
  { to: '/business/resources',         icon: HiOutlineSquares2X2,            label: 'Mis espacios',     coworkingOnly: true },
  // Always visible
  { to: '/business/perfil',            icon: HiOutlineUserCircle,            label: 'Mi perfil' },
];

/**
 * Layout del panel BUSINESS_OWNER. Estructura espejada de AdminLayout
 * pero con paleta accent (naranja) en lugar del índigo del admin —
 * deja claro al usuario que está en otro contexto.
 *
 * Carga `business` una vez y lo expone vía Outlet context para que
 * cualquier hijo (Dashboard, Profile…) lo pueda consumir sin volver a fetchear.
 */
export default function BusinessLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [business, setBusiness] = useState(null);
  const [loadingBiz, setLoadingBiz] = useState(true);

  useEffect(() => {
    let alive = true;
    getMyBusiness()
      .then((res) => { if (alive) setBusiness(res.data.data); })
      .catch(() => { if (alive) setBusiness(null); })
      .finally(() => { if (alive) setLoadingBiz(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex bg-surface-base overflow-hidden">

      {/* ── MOBILE NAV ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-40 bg-white p-3 rounded-2xl shadow-xl border border-border-base text-brand-500"
      >
        <HiOutlineBars3 className="w-6 h-6" />
      </button>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm z-[60] lg:hidden animate-fade-in" />
      )}

      {/* ── PREMIUM SIDEBAR ── */}
      <aside className={`fixed lg:static top-0 left-0 w-80 h-screen flex-shrink-0 z-[70] transform transition-transform duration-500 ease-in-out bg-brand-900 text-white flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Brand Header */}
        <div className="p-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/20">
              <HiOutlineBuildingOffice2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-lg tracking-tighter leading-tight uppercase truncate">Business</p>
              <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">{loadingBiz ? 'Sincronizando…' : (business?.nombre || 'Pro')}</p>
            </div>
          </div>
        </div>

        {/* User Card (Premium Glassmorphism) */}
        <div className="mx-6 mb-8 p-5 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-800 border border-brand-700 flex items-center justify-center font-black text-sm text-brand-300">
               {user?.nombre?.charAt(0)}{user?.apellidos?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black truncate">{user?.nombre} {user?.apellidos}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-500">Administrador</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 mb-4">Gestión Central</p>
          {BUSINESS_LINKS.filter((link) => {
            if (!business) return true; // show all while loading
            const isCoworking = COWORKING_TIPOS.includes(business.tipo);
            if (link.coworkingOnly && !isCoworking) return false;
            if (link.serviceOnly && isCoworking) return false;
            return true;
          }).map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group ${
                  active
                    ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
                    : 'text-brand-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <link.icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="tracking-tight">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 space-y-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-4 px-5 py-3 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-400 hover:text-white transition-all"
          >
            <HiOutlineArrowLeftOnRectangle className="w-4 h-4" />
            Vista Cliente
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
          >
            <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col bg-surface-base">
        <header className="h-24 lg:flex hidden items-center justify-between px-12 bg-white/50 backdrop-blur-xl sticky top-0 z-30">
          <div>
             <h2 className="text-xs font-black text-brand-500 uppercase tracking-[0.3em] mb-1">
               {loadingBiz ? '...' : business?.nombre}
             </h2>
             <p className="text-2xl font-black text-brand-900 tracking-tighter">
               {BUSINESS_LINKS.find((l) => isActive(l.to))?.label || 'Panel Operativo'}
             </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500">
                <HiOutlineChartPie className="w-5 h-5" />
             </div>
          </div>
        </header>

        <div className="flex-1 p-8 lg:p-12">
          <Outlet context={{ business, loadingBiz, setBusiness }} />
        </div>
      </main>

    </div>
  );
}
