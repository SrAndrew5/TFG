import { usePageTitle } from '../hooks/usePageTitle';
import SpaceGrid from '../components/spaces/SpaceGrid';
import { HiOutlineBuildingOffice2, HiOutlineWifi } from 'react-icons/hi2';

export default function Resources() {
  usePageTitle('Espacios Coworking');

  return (
    <div className="animate-fade-in pb-12">
      {/* ── Overhauled Hero Section ── */}
      <div className="relative overflow-hidden bg-brand-500 rounded-[3rem] mb-12 shadow-2xl">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-600/50 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 px-8 py-16 md:py-24 md:px-16 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-8">
            <HiOutlineBuildingOffice2 className="w-4 h-4 text-accent-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Marketplace de Coworking</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-8">
            Encuentra tu próximo <br />
            <span className="text-accent-400">espacio de éxito.</span>
          </h1>

          <p className="text-lg md:text-xl text-brand-100/80 font-medium max-w-2xl leading-relaxed mb-10">
            Desde mesas flex hasta despachos privados de alta gama. Filtra por capacidad, equipamiento y reserva en segundos con confirmación inmediata.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/10">
            {[
              { label: 'Confirmación', sub: 'Inmediata', icon: '⚡' },
              { label: 'Cancelación', sub: 'Flexible', icon: '🛡️' },
              { label: 'Equipamiento', sub: 'Premium', icon: '✨' },
              { label: 'Sin fianza', sub: 'Pago por uso', icon: '💳' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-200/50">{item.label}</p>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-xs">{item.icon}</span> {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SpaceGrid />
    </div>
  );
}
