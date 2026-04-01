import { Link } from 'react-router-dom';
import {
  HiOutlineCalendar,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineMapPin,
} from 'react-icons/hi2';

const FOOTER_LINKS = {
  servicios: [
    { label: 'Servicios de Peluquería', to: '/services' },
    { label: 'Espacios Coworking',      to: '/resources' },
    { label: 'Mis Citas',              to: '/my-appointments' },
    { label: 'Mis Reservas',           to: '/my-bookings' },
  ],
  empresa: [
    { label: 'Panel Principal', to: '/' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border-base mt-16">

      {/* ── Franja brand superior ── */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-brand-400 to-accent-500" />

      {/* ── Contenido principal ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Columna 1: Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_2px_8px_rgba(99,102,241,0.30)] group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.45)] transition-shadow duration-200">
                <HiOutlineCalendar className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-xl font-bold text-gradient-brand"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                ReservasPro
              </span>
            </Link>

            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              Gestión de reservas para coworking y servicios de peluquería.
              Simples, rápidas y sin complicaciones.
            </p>

            {/* Contacto */}
            <div className="mt-6 space-y-2.5">
              <a
                href="mailto:hola@reservaspro.local"
                className="flex items-center gap-3 text-sm text-text-secondary hover:text-brand-600 transition-colors duration-200 group"
              >
                <span className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors duration-200">
                  <HiOutlineEnvelope className="w-3.5 h-3.5 text-brand-500" />
                </span>
                hola@reservaspro.local
              </a>
              <a
                href="tel:+34900000000"
                className="flex items-center gap-3 text-sm text-text-secondary hover:text-brand-600 transition-colors duration-200 group"
              >
                <span className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors duration-200">
                  <HiOutlinePhone className="w-3.5 h-3.5 text-brand-500" />
                </span>
                +34 900 000 000
              </a>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <span className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <HiOutlineMapPin className="w-3.5 h-3.5 text-brand-500" />
                </span>
                Béjar, Salamanca, España
              </div>
            </div>
          </div>

          {/* Columna 2: Servicios */}
          <div>
            <h3
              className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Plataforma
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.servicios.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-secondary hover:text-brand-600 transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-brand-300 group-hover:bg-brand-500 transition-colors duration-200 flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Badge proyecto */}
          <div>
            <h3
              className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Proyecto
            </h3>
            <div className="rounded-xl border border-border-base bg-surface-subtle p-4">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
                Proyecto TFG
              </p>
              <p className="text-sm font-semibold text-text-primary" style={{ fontFamily: 'Sora, sans-serif' }}>
                2º DAM — 2025/26
              </p>
              <p className="text-xs text-text-muted mt-1">
                IES Augustóbrigas
              </p>
              <div className="mt-3 pt-3 border-t border-border-base">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-success-text font-medium">
                    Entorno local activo
                  </span>
                </div>
              </div>
            </div>

            {/* Stack tecnológico */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['React', 'Node.js', 'Prisma', 'PostgreSQL'].map((tech) => (
                <span
                  key={tech}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-100"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra inferior ── */}
      <div className="border-t border-border-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted text-center sm:text-left">
            © {year} ReservasPro. Proyecto educativo sin fines comerciales.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">Hecho con</span>
            <span className="text-xs font-semibold text-gradient-brand">Arctic Clarity</span>
            <span className="text-xs text-text-muted">Design System</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
