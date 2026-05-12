import { usePageTitle } from '../hooks/usePageTitle';
import ServiceGrid from '../components/services/ServiceGrid';
import { HiOutlineScissors, HiOutlineSparkles } from 'react-icons/hi2';

export default function Services() {
  usePageTitle('Servicios');

  return (
    <div className="animate-fade-in pb-12">
      {/* ── Hero único de servicios ── */}
      <div className="services-hero">
        <div className="relative z-10">
          <span className="services-hero-eyebrow">
            <HiOutlineScissors className="w-3.5 h-3.5" />
            Peluquería Profesional
          </span>

          <h1 className="services-hero-title">
            Servicios a tu<br />
            <span style={{
              background: 'linear-gradient(135deg, #F97316, #C2410C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>medida.</span>
          </h1>

          <p className="services-hero-sub">
            Elige el tratamiento que buscas y reserva con el profesional que prefieras. Confirmación instantánea.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <HiOutlineSparkles className="w-4 h-4 text-orange-500" />
              Corte · Color · Tratamiento · Peinado
            </div>
          </div>
        </div>

        {/* Decoración icono grande */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none hidden lg:block" aria-hidden="true">
          <HiOutlineScissors className="w-64 h-64 text-orange-500 rotate-[-20deg]" />
        </div>
      </div>

      <ServiceGrid />
    </div>
  );
}
