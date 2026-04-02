import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HiOutlineMagnifyingGlass, 
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineBuildingOffice2,
  HiOutlineScissors,
  HiOutlineStar,
  HiOutlineArrowRight
} from 'react-icons/hi2';

export default function Home() {
  const [activeTab, setActiveTab] = useState('coworking');
  const [locationInput, setLocationInput] = useState('');

  return (
    <div className="space-y-16 pb-12">
      {/* ── Hero Section ── */}
      <section className="relative w-full rounded-3xl bg-white border border-border-base shadow-sm overflow-hidden mt-2">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-brand-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-accent-50 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative z-10 px-6 py-20 sm:px-12 lg:px-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold mb-6 animate-slide-down">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Nuevos espacios disponibles
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            Reserva el <span className="text-gradient-brand">espacio</span> perfecto <br className="hidden sm:block" />
            para tu próximo proyecto.
          </h1>
          
          <p className="max-w-2xl text-lg text-text-secondary mb-10 leading-relaxed">
            Desde puestos de coworking hasta servicios de peluquería premium. 
            Descubre, reserva y gestiona todo en una única plataforma inteligente.
          </p>

          {/* Search Box */}
          <div className="w-full max-w-3xl bg-white p-3 rounded-2xl shadow-lg border border-border-base animate-slide-up">
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-3 border-b border-border-base pb-2 px-2">
              <button 
                onClick={() => setActiveTab('coworking')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'coworking' 
                    ? 'bg-brand-50 text-brand-700' 
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <HiOutlineBuildingOffice2 className="w-4.5 h-4.5" />
                Coworking
              </button>
              <button 
                onClick={() => setActiveTab('peluqueria')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'peluqueria' 
                    ? 'bg-accent-50 text-accent-700' 
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <HiOutlineScissors className="w-4.5 h-4.5" />
                Peluquería
              </button>
            </div>

            {/* Inputs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <HiOutlineMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="¿Dónde quieres ir? (Ej: Madrid)" 
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-subtle border border-transparent rounded-xl text-sm focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-50 transition-all outline-none"
                />
              </div>
              <div className="w-full sm:w-48 relative">
                <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input 
                  type="date" 
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-subtle border border-transparent rounded-xl text-sm focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-50 transition-all outline-none text-text-secondary"
                />
              </div>
              <Link to={`/map?type=${activeTab}&location=${encodeURIComponent(locationInput.trim())}`} className="btn-primary py-3.5 px-8 sm:w-auto w-full text-base flex justify-center items-center">
                Buscar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Promoted Results Section ── */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Populares hoy
            </h2>
            <p className="text-text-secondary">Los espacios y servicios más valorados por la comunidad.</p>
          </div>
          <Link to="/map" className="hidden sm:flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors">
            Ver todos <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { tag: 'Premium', title: 'Sala de Juntas Executive', location: 'Planta 3, Zona Norte', price: '25€/hora', imgColor: 'bg-indigo-100', icon: HiOutlineBuildingOffice2 },
            { tag: 'Destacado', title: 'Corte & Styling Avanzado', location: 'Salón Principal', price: '30€', imgColor: 'bg-orange-100', icon: HiOutlineScissors, isAccent: true },
            { tag: 'Oferta', title: 'Puesto Flex - Día Completo', location: 'Zona Open Space', price: '15€/día', imgColor: 'bg-blue-100', icon: HiOutlineBuildingOffice2 },
          ].map((item, idx) => (
            <div key={idx} className={`card-hover group cursor-pointer overflow-hidden flex flex-col ${item.isAccent ? 'glow-accent' : 'glow-brand'} delay-${idx + 1}`}>
              {/* Imagen Placeholder (usamos un gradiente con icono grande para mantener el minimalismo ártico) */}
              <div className={`h-48 w-full ${item.imgColor} relative flex items-center justify-center p-6`}>
                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-text-primary uppercase tracking-wide">
                  {item.tag}
                </div>
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
                  <HiOutlineStar className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs font-bold text-text-primary">4.9</span>
                </div>
                <item.icon className={`w-16 h-16 ${item.isAccent ? 'text-accent-400' : 'text-brand-400'} opacity-50 group-hover:scale-110 transition-transform duration-500`} />
              </div>

              {/* Contenido Card */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-text-primary mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary flex items-center gap-1.5 mb-4">
                  <HiOutlineMapPin className="w-4 h-4 text-text-muted" /> {item.location}
                </p>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border-base">
                  <span className="font-bold text-text-primary">{item.price}</span>
                  <Link to="/book/1" className={`${item.isAccent ? 'btn-accent' : 'btn-primary'} px-4 py-1.5 text-xs rounded-lg inline-block text-center`}>
                    Reservar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Social Proof / Stats ── */}
      <section className="bg-surface-elevated rounded-3xl p-10 mt-8 border border-border-base">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border-strong/50">
          {[
            { num: '+2,000', label: 'Usuarios Activos' },
            { num: '50+', label: 'Espacios Flex' },
            { num: '4.8/5', label: 'Valoración Media' },
            { num: '24/7', label: 'Soporte y Acceso' }
          ].map((stat, i) => (
            <div key={i} className="text-center px-4">
              <p className="text-3xl md:text-4xl font-extrabold text-text-primary mb-2 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                {stat.num}
              </p>
              <p className="text-sm text-text-muted font-medium uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
