import { Link } from 'react-router-dom';
import {
  HiOutlineCalendar,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineAcademicCap,
  HiOutlineCommandLine,
} from 'react-icons/hi2';

const NAV_LINKS = [
  { label: 'Explorar Espacios', to: '/explorar' },
  { label: 'Mis Reservas',       to: '/my-bookings' },
  { label: 'Servicios',          to: '/resources' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-500 text-white pt-14 pb-10 mt-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-accent-500 transition-all duration-500">
                <HiOutlineCalendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">COWORK<span className="text-accent-500">PRO</span></span>
            </Link>

            <p className="text-brand-100/60 text-sm font-medium leading-relaxed max-w-md">
              La plataforma definitiva para la gestión de espacios de coworking. 
              Reserva de forma instantánea y profesional.
            </p>

            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { href: 'mailto:aiordache02@educarex.es', icon: HiOutlineEnvelope, label: 'aiordache02@educarex.es' },
                { href: 'tel:+34643312524',            icon: HiOutlinePhone,    label: '+34 643 312 524' },
                { label: 'Navalmoral de la Mata — España', icon: HiOutlineMapPin,    isText: true },
              ].map((item, idx) => (
                item.isText ? (
                  <div key={idx} className="flex items-center gap-3 text-brand-100/40 text-[11px] font-bold">
                    <item.icon className="w-4 h-4 text-accent-500" />
                    {item.label}
                  </div>
                ) : (
                  <a key={idx} href={item.href}
                    className="flex items-center gap-3 group w-fit text-brand-100/60 hover:text-white transition-colors text-[11px] font-bold"
                  >
                    <item.icon className="w-4 h-4 text-accent-500" />
                    {item.label}
                  </a>
                )
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:pt-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-500 mb-6">Explorar</p>
            <div className="space-y-3">
              {NAV_LINKS.map((link) => (
                <Link 
                  key={link.to} 
                  to={link.to} 
                  className="block text-brand-100/50 hover:text-white text-xs font-bold transition-all hover:translate-x-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Academic Info */}
          <div className="lg:pt-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-500 mb-6">Académico</p>
            <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
              <HiOutlineAcademicCap className="w-7 h-7 text-accent-500 shrink-0" />
              <div>
                 <p className="text-[12px] font-black text-white leading-tight mb-1">TFG 2026 · Dam</p>
                 <p className="text-[10px] text-brand-100/40 font-bold uppercase tracking-widest">IES Augustóbrigas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-white/5 my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-brand-100/20 text-[11px] font-bold uppercase tracking-widest">
            © {year} COWORKPRO
          </p>
          <div className="flex items-center gap-3 opacity-30">
            <HiOutlineCommandLine className="w-4 h-4 text-brand-100/20" />
            <span className="text-[10px] font-black text-brand-100/10 tracking-widest uppercase">Organic Premium Stack</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
