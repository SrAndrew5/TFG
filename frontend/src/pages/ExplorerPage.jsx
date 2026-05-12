import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BusinessMap from '../components/shared/BusinessMap';

import toast from 'react-hot-toast';
import { getPublicBusinesses, TIPO_NEGOCIO_OPTIONS } from '../services/businessService';
import StarRating from '../components/shared/StarRating';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineFunnel,
  HiOutlineMap,
  HiOutlineListBullet,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineXMark,
  HiOutlineStar,
  HiOutlineUsers,
} from 'react-icons/hi2';
import PageWrapper from '../components/layout/PageWrapper';

/* ─── Helpers ─── */

const TIPO_CHIPS = [
  { value: '', label: 'Todos' },
  ...TIPO_NEGOCIO_OPTIONS.filter((t) => ['PELUQUERIA', 'BARBERIA', 'COWORKING', 'SPA'].includes(t.value)),
  { value: '__OTRO', label: 'Otros' },
];

const RATING_CHIPS = [
  { value: '', label: 'Todos' },
  { value: '3', label: '⭐ 3+' },
  { value: '4', label: '⭐ 4+' },
  { value: '4.5', label: '⭐ 4.5+' },
];

const SPAIN_CENTER = [40.4168, -3.7038];

function BusinessCard({ biz, highlighted, onHover }) {
  const navigate = useNavigate();
  const tipoLabel = TIPO_NEGOCIO_OPTIONS.find((t) => t.value === biz.tipo)?.label || biz.tipo;
  const open = biz.esta_abierto;
  const foto = biz.fotos_urls?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600';

  return (
    <div
      onMouseEnter={() => onHover?.(biz.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => navigate(`/negocio/${biz.slug}`)}
      className={`group relative flex flex-col bg-white rounded-[32px] overflow-hidden border border-border-base hover:border-brand-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-brand-500/5 ${
        highlighted ? 'ring-2 ring-brand-500/20 border-brand-500 -translate-y-1' : ''
      }`}
    >
      {/* Imagen Hero */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img 
          src={foto} 
          alt={biz.nombre} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        {/* Badge de Tipo */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-brand-500 shadow-sm">
            {tipoLabel}
          </span>
        </div>

        {/* Precio overlay */}
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-sm font-bold opacity-80 leading-none">Desde</p>
          <p className="text-2xl font-black tracking-tighter leading-none">5€<span className="text-xs ml-1 font-bold opacity-70">/ h</span></p>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black text-brand-500 tracking-tighter truncate group-hover:text-accent-500 transition-colors">
              {biz.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-text-muted font-bold text-xs uppercase tracking-widest">
              <HiOutlineMapPin className="w-3.5 h-3.5 text-accent-500" />
              {biz.ciudad}
            </div>
          </div>
          {biz.valoracion_media && (
            <div className="flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-lg">
              <HiOutlineStar className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-xs font-black text-brand-500">{biz.valoracion_media}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border-base/50">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            open ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-subtle text-text-muted'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-500 animate-pulse' : 'bg-text-muted'}`} />
            {open ? 'Disponible hoy' : 'Ver horario'}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
            <HiOutlineUsers className="w-3.5 h-3.5" />
            Hasta 50
          </div>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-[32px] overflow-hidden border border-border-base animate-pulse">
      <div className="aspect-[16/9] bg-surface-subtle" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-1/2 bg-surface-subtle rounded-full" />
          <div className="h-6 w-12 bg-surface-subtle rounded-full" />
        </div>
        <div className="h-4 w-1/4 bg-surface-subtle rounded-full" />
        <div className="flex gap-2 pt-4">
          <div className="h-6 w-24 bg-surface-subtle rounded-full" />
          <div className="h-6 w-20 bg-surface-subtle rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* MAIN PAGE                                               */
/* ═══════════════════════════════════════════════════════ */

export default function ExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Lectura inicial de URL
  const urlSearch = searchParams.get('search') || '';
  const urlTipo = searchParams.get('tipo') || '';
  const urlFecha = searchParams.get('fecha') || '';

  // Filtros (searchInput es local para el debounce)
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [abierto, setAbierto] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [mobileView, setMobileView] = useState('list');

  // Debounce de búsqueda -> URL
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput) params.set('search', searchInput);
      else params.delete('search');
      setSearchParams(params, { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Otros filtros -> URL
  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params, { replace: true });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = {};
      const search = searchParams.get('search');
      const tipo = searchParams.get('tipo');
      const fecha = searchParams.get('fecha');

      if (search) params.search = search;
      if (tipo && tipo !== '__OTRO') params.tipo = tipo;
      if (abierto) params.abierto = 'true';
      if (fecha) params.fecha = fecha;
      
      const res = await getPublicBusinesses(params);
      let data = res.data.data || [];
      if (tipo === '__OTRO') {
        const mainTypes = ['PELUQUERIA', 'BARBERIA', 'COWORKING', 'SPA'];
        data = data.filter((b) => !mainTypes.includes(b.tipo));
      }
      setBusinesses(data);
    } catch {
      setError(true);
      toast.error('Error al cargar negocios');
    } finally {
      setLoading(false);
    }
  }, [searchParams, abierto]);

  useEffect(() => { load(); }, [load]);

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setFlyTo({ center: [pos.coords.latitude, pos.coords.longitude], zoom: 14 }),
      () => toast.error('No se pudo obtener tu ubicación'),
    );
  };

  return (
    <PageWrapper>
      <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden animate-fade-in bg-surface-base">

      {/* ── Barra de filtros ── */}
      <div className="bg-surface-base border-b border-border-base px-6 py-6 shrink-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
          {/* Search */}
          <div className="relative w-full md:max-w-md group">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="¿Qué estás buscando hoy?"
              className="w-full bg-surface-subtle border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:bg-surface-elevated focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
            />
          </div>

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-3 w-full">
            {TIPO_CHIPS.map((c) => (
              <button
                key={c.value}
                onClick={() => setFilter('tipo', c.value)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border-2 ${
                  (searchParams.get('tipo') || '') === c.value
                    ? 'bg-brand-500 text-white border-brand-500 shadow-brand'
                    : 'bg-white text-text-secondary border-border-base hover:border-brand-500/30 hover:text-brand-500 hover:bg-surface-subtle'
                }`}
              >
                {c.label}
              </button>
            ))}

            <div className="w-px h-6 bg-border-base mx-2 hidden lg:block" />

            <button
              onClick={() => setAbierto((v) => !v)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border-2 ${
                abierto
                  ? 'bg-accent-50 text-accent-600 border-accent-500/30 shadow-sm'
                  : 'bg-white text-text-secondary border-border-base hover:border-brand-500/30 hover:bg-surface-subtle'
              }`}
            >
              <HiOutlineClock className="w-4 h-4" />
              Abierto ahora
            </button>
          </div>
        </div>
      </div>

      {/* ── Split layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* List */}
        <div className={`lg:w-[450px] xl:w-[500px] w-full overflow-y-auto bg-surface-base p-6 space-y-4 border-r border-border-base ${mobileView === 'map' ? 'hidden lg:block' : ''}`}>
          <div className="mb-8 px-2 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-brand-500 tracking-tighter">Resultados</h2>
              <p className="text-sm text-text-muted font-bold uppercase tracking-widest mt-1">
                {businesses.length} espacios encontrados
              </p>
            </div>
            <div className="flex gap-2 lg:hidden">
               <button onClick={() => setMobileView('map')} className="btn-secondary py-2 px-4 text-xs uppercase tracking-widest font-black">Ver Mapa</button>
            </div>
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : error ? (
            <div className="bg-white rounded-[32px] p-12 text-center shadow-subtle border border-border-base">
              <p className="text-text-secondary font-bold mb-4">No pudimos conectar con los servidores</p>
              <button onClick={load} className="btn-primary py-3 px-8 text-sm">Intentar de nuevo</button>
            </div>
          ) : businesses.length === 0 ? (
            <div className="bg-white rounded-[40px] border-2 border-dashed border-border-strong p-16 text-center">
              <HiOutlineFunnel className="w-16 h-16 text-text-muted mx-auto mb-6 opacity-20" />
              <p className="font-black text-xl text-brand-500 mb-2 tracking-tighter">Sin resultados</p>
              <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
                Prueba ajustando tus filtros o buscando en otra ubicación.
              </p>
            </div>
          ) : (
            businesses.map((biz) => (
              <BusinessCard
                key={biz.id}
                biz={biz}
                highlighted={hoveredId === biz.id}
                onHover={setHoveredId}
              />
            ))
          )}
        </div>

        {/* Map */}
        <div className={`flex-1 relative ${mobileView === 'list' ? 'hidden lg:block' : ''}`}>
          <BusinessMap
            businesses={businesses}
            center={SPAIN_CENTER}
            zoom={6}
            flyTo={flyTo}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />

          <button
            onClick={handleMyLocation}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-xl rounded-full px-8 py-4 text-xs font-black uppercase tracking-widest text-brand-500 hover:bg-brand-500 hover:text-white transition-all flex items-center gap-3 border border-border-base/50"
          >
            <HiOutlineMapPin className="w-5 h-5 text-accent-500" />
            Explorar cerca de mí
          </button>

          <button 
            onClick={() => setMobileView('list')}
            className="lg:hidden absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur shadow-lg rounded-full p-3 border border-border-base"
          >
            <HiOutlineListBullet className="w-6 h-6 text-brand-500" />
          </button>
        </div>
      </div>
    </div>
    </PageWrapper>
  );
}

