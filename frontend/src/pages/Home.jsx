import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import ErrorState from '../components/shared/ErrorState';
import { usePageTitle } from '../hooks/usePageTitle';
import PageWrapper from '../components/layout/PageWrapper';
import {
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineBuildingOffice2,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineBolt,
  HiOutlineStar,
} from 'react-icons/hi2';

/* ─── Gradientes por tipo de recurso ─── */
const CARD_GRADIENTS = {
  MESA:     'from-brand-500 to-brand-700',
  SALA:     'from-emerald-500 to-teal-700',
  PUESTO:   'from-violet-500 to-purple-700',
  DESPACHO: 'from-sky-500 to-blue-700',
};

function getGradient(tag) {
  return CARD_GRADIENTS[tag] ?? CARD_GRADIENTS.MESA;
}

/* ─── Ticker que se /* ─── Card de espacio/servicio ─── */
function FeaturedCard({ item, index }) {
  return (
    <Link to={item.href} className="group animate-fade-up" style={{ animationDelay: `${index * 150}ms` }}>
      <div className="relative overflow-hidden rounded-[2.5rem] mb-6 shadow-subtle group-hover:shadow-xl group-hover:shadow-brand-500/5 transition-all duration-700 hover:-translate-y-2">
        <img 
          src={item.image || `https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800`} 
          alt={item.title}
          className="w-full aspect-[4/3] object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-brand-500 shadow-sm">
            {item.tag}
          </span>
        </div>
        <div className="absolute bottom-4 left-4">
          <p className="text-white text-2xl font-black tracking-tighter">
            {item.price}
          </p>
        </div>
      </div>
      <div className="px-2">
        <h3 className="text-xl font-black text-brand-500 tracking-tighter leading-tight group-hover:text-accent-500 transition-colors">
          {item.title}
        </h3>
        <p className="text-text-muted flex items-center gap-1.5 mt-1.5 text-xs font-bold uppercase tracking-widest">
          <HiOutlineMapPin className="w-3.5 h-3.5 text-accent-500" />
          {item.location}
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  usePageTitle('Inicio');
  const navigate = useNavigate();

  const [locationInput,   setLocationInput]   = useState('');
  const [dateInput,       setDateInput]       = useState('');
  const [counts,          setCounts]          = useState({ recursos: null });
  const [featured,        setFeatured]        = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError,   setFeaturedError]   = useState(false);

  /* Scroll reveal */
  const revealRefs = useRef([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('home-visible')),
      { threshold: 0.07 }
    );
    revealRefs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [featured]);

  const addReveal = (el) => { if (el) revealRefs.current.push(el); };

  const loadFeatured = useCallback(() => {
    setLoadingFeatured(true);
    setFeaturedError(false);
    api.get('/resources')
      .then((r) => {
        const recursos = r.data.data ?? [];
        setCounts({ recursos: recursos.length });
        const mixed = recursos.slice(0, 3).map((rec) => ({
          id:       rec.id,
          tag:      rec.tipo ?? 'ESPACIO',
          title:    rec.nombre,
          location: rec.ubicacion || 'Centro Coworking',
          price:    `${Number(rec.precio_hora).toFixed(0)}€/h`,
          href:     `/book-resource/${rec.id}`,
          image:    rec.imagen || null
        }));
        setFeatured(mixed);
      })
      .catch(() => setFeaturedError(true))
      .finally(() => setLoadingFeatured(false));
  }, []);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  function handleSearch() {
    const dest = `/explorar?search=${encodeURIComponent(locationInput.trim())}${dateInput ? `&fecha=${dateInput}` : ''}`;
    navigate(dest);
  }

  /* ═══════════════════════════════════════ RENDER ═══════════════════════════════════════ */
  return (
    <PageWrapper>
      <div className="space-y-0 pb-16 bg-surface-base">

        {/* ══════════  PREMIUM HERO  ══════════ */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-[40%] h-full bg-brand-50/50 -z-10 rounded-l-[120px]" />
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-accent-50/50 rounded-full blur-3xl -z-10" />
          
          <div className="container mx-auto px-6 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-brand-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 animate-fade-up shadow-brand">
              <HiOutlineBolt className="w-3.5 h-3.5 text-accent-400" />
              Explora +50 ubicaciones en tu ciudad
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-brand-500 tracking-tighter leading-[0.85] mb-10 animate-fade-up" style={{ animationDelay: '100ms' }}>
              Trabaja donde <br />
              <span className="text-accent-500">quieras estar.</span>
            </h1>

            <p className="text-lg md:text-xl text-text-muted font-medium max-w-2xl leading-relaxed mb-16 animate-fade-up" style={{ animationDelay: '200ms' }}>
              Marketplace de espacios premium. Reserva mesas flex, despachos privados y salas de reuniones en segundos. Sin fianza, sin contratos, solo productividad.
            </p>

            {/* Search Hub */}
            <div className="w-full max-w-5xl bg-white p-3 rounded-[3rem] shadow-2xl border border-border-base flex flex-col md:flex-row items-stretch gap-2 animate-fade-up" style={{ animationDelay: '300ms' }}>
              <div className="flex-1 flex items-center gap-4 px-8 py-5 group border-b md:border-b-0 md:border-r border-border-base transition-colors hover:bg-surface-subtle rounded-t-[2.5rem] md:rounded-l-[2.5rem] md:rounded-tr-none">
                <HiOutlineMapPin className="w-6 h-6 text-accent-500" />
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Ubicación</p>
                  <input
                    type="text"
                    placeholder="¿Dónde quieres trabajar?"
                    value={locationInput}
                    onChange={e => setLocationInput(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-brand-500 font-black placeholder-text-muted/50 tracking-tight"
                  />
                </div>
              </div>
              
              <div className="flex-1 flex items-center gap-4 px-8 py-5 group transition-colors hover:bg-surface-subtle">
                <HiOutlineCalendar className="w-6 h-6 text-brand-500" />
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Fecha</p>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={e => setDateInput(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-brand-500 font-black cursor-pointer"
                  />
                </div>
              </div>

              <button 
                onClick={handleSearch} 
                className="bg-brand-500 hover:bg-brand-600 text-white p-6 md:px-12 rounded-[2.5rem] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-brand"
              >
                <span className="text-xs font-black uppercase tracking-[0.2em]">Buscar Espacio</span>
                <HiOutlineArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Featured Showcase ── */}
        <section className="container mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 text-accent-500 mb-4">
                 <div className="h-px w-12 bg-accent-500" />
                 <span className="text-xs font-black uppercase tracking-widest">Lo mejor de hoy</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-brand-500 leading-[0.9] tracking-tighter">
                Espacios que impulsan <br /> tu creatividad.
              </h2>
            </div>
            <Link to="/explorar" className="group flex items-center gap-4 px-8 py-4 bg-surface-subtle rounded-2xl hover:bg-brand-500 hover:text-white transition-all duration-500 border border-border-base">
              <span className="text-xs font-black uppercase tracking-widest">Ver Catálogo</span>
              <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {featuredError ? (
            <ErrorState message="No se pudieron cargar los espacios destacados." onRetry={loadFeatured} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {loadingFeatured
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[4/3] bg-surface-subtle rounded-[2.5rem] mb-6" />
                      <div className="h-8 bg-surface-subtle rounded-xl w-3/4 mb-3" />
                      <div className="h-4 bg-surface-subtle rounded-lg w-1/2" />
                    </div>
                  ))
                : featured.map((item, idx) => (
                    <FeaturedCard key={item.id} item={item} index={idx} />
                  ))
              }
            </div>
          )}
        </section>

        {/* ══════════  TRUST METRICS  ══════════ */}
        <section className="bg-brand-500 py-24 my-32 rounded-[5rem] mx-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { num: counts.recursos ?? '50+', label: 'Ubicaciones' },
                { num: '24/7', label: 'Acceso Instantáneo' },
                { num: '10k+', label: 'Miembros' },
                { num: '99%', label: 'Reviews 5★' },
              ].map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="text-5xl md:text-7xl font-black text-accent-400 tracking-tighter">{stat.num}</div>
                  <div className="text-brand-100/60 font-black uppercase tracking-[0.2em] text-[10px]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════  CONVERSION CTA  ══════════ */}
        <section className="container mx-auto px-6 py-20 mb-20 text-center">
          <div className="max-w-5xl mx-auto bg-white p-12 md:p-24 rounded-[5rem] border border-border-base shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl font-black text-brand-500 mb-8 tracking-tighter leading-[0.9]">
                ¿Listo para elevar <br /> <span className="text-accent-500">tu forma de trabajar?</span>
              </h2>
              <p className="text-text-muted text-lg md:text-xl font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
                Únete a la plataforma líder en gestión de espacios de coworking. 
                Sin cuotas de entrada, paga solo por lo que usas.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/explorar" className="btn-primary px-16 py-5 rounded-[2rem] shadow-brand active:scale-95 transition-all">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Encontrar Espacio</span>
                </Link>
                <Link to="/registro-empresa" className="btn-secondary px-16 py-5 rounded-[2rem] hover:bg-brand-500 hover:text-white border-2 border-brand-500/10 active:scale-95 transition-all">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Soy una Empresa</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </PageWrapper>
  );
}
