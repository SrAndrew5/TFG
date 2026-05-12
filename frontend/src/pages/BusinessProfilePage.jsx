import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getPublicBusinessBySlug, TIPO_NEGOCIO_OPTIONS } from '../services/businessService';
import StarRating from '../components/shared/StarRating';
import PageWrapper from '../components/layout/PageWrapper';
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineBanknotes,
  HiOutlineUser,
  HiOutlineScissors,
  HiOutlineBuildingOffice2,
  HiOutlineXMark,
  HiOutlineArrowRight,
  HiOutlineChevronDown,
  HiOutlineStar,
  HiOutlineCheckBadge,
  HiOutlineWifi,
  HiOutlineCpuChip,
  HiOutlinePhoto,
  HiOutlineUsers,
} from 'react-icons/hi2';

/* ─── Helpers ─── */

const DAYS_MAP = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DAYS_LABELS = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom' };

const AMENITIES_ICONS = {
  wifi: HiOutlineWifi,
  parking: HiOutlineCpuChip, // placeholder
  cafeteria: HiOutlineClock, // placeholder
  impresora: HiOutlineCpuChip,
  'sala-reuniones': HiOutlineUsers,
  'aire-acondicionado': HiOutlineCpuChip,
};

function todaySchedule(horario) {
  if (!horario) return 'Sin horario';
  const day = DAYS_MAP[new Date().getDay()];
  const h = horario[day];
  if (!h || h.cerrado) return 'Cerrado hoy';
  if (h.franjas && Array.isArray(h.franjas) && h.franjas.length > 0)
    return `Hoy: ${h.franjas.map((f) => `${f.abre} – ${f.cierra}`).join(', ')}`;
  if (h.abre && h.cierra) return `Hoy: ${h.abre} – ${h.cierra}`;
  return 'Sin horario';
}

function isOpenNow(horario) {
  if (!horario) return false;
  const day = DAYS_MAP[new Date().getDay()];
  const h = horario[day];
  if (!h || h.cerrado) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (h.franjas && Array.isArray(h.franjas)) {
    return h.franjas.some((f) => {
      const [ah, am] = f.abre.split(':').map(Number);
      const [ch, cm] = f.cierra.split(':').map(Number);
      return currentMinutes >= ah * 60 + am && currentMinutes < ch * 60 + cm;
    });
  }
  if (h.abre && h.cierra) {
    const t = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return t >= h.abre && t <= h.cierra;
  }
  return false;
}

function createMarkerIcon() {
  return L.divIcon({
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#6366F1;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);"></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function BusinessProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, openLoginModal } = useAuth();

  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPublicBusinessBySlug(slug)
      .then((r) => setBiz(r.data.data))
      .catch(() => {
        toast.error('Negocio no encontrado');
        navigate('/explorar');
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!biz) return null;

  const tipoLabel = TIPO_NEGOCIO_OPTIONS.find((t) => t.value === biz.tipo)?.label || biz.tipo;
  const open = isOpenNow(biz.horario);
  const fotos = Array.isArray(biz.fotos_urls) && biz.fotos_urls.length > 0 
    ? biz.fotos_urls 
    : ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200'];
  const isCoworking = biz.tipo === 'COWORKING';

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* ── Back ── */}
        <button 
          onClick={() => navigate('/explorar')} 
          className="group flex items-center gap-2 text-text-muted hover:text-brand-500 transition-all font-bold text-sm mb-8"
        >
          <div className="w-8 h-8 rounded-full bg-surface-subtle flex items-center justify-center group-hover:bg-brand-50 transition-colors">
            <HiOutlineArrowLeft className="w-4 h-4" />
          </div>
          Volver a explorar
        </button>

        {/* ── Photo Gallery Hero ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[300px] md:h-[500px] rounded-[40px] overflow-hidden mb-12 relative group/gallery">
          <div className="md:col-span-2 relative h-full">
            <img src={fotos[0]} alt="" className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-700" onClick={() => setLightbox(fotos[0])} />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-4 col-span-2">
            <div className="relative">
              <img src={fotos[1] || fotos[0]} alt="" className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-700" onClick={() => setLightbox(fotos[1] || fotos[0])} />
            </div>
            <div className="relative overflow-hidden">
               <img src={fotos[2] || fotos[0]} alt="" className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-700" onClick={() => setLightbox(fotos[2] || fotos[0])} />
               {fotos.length > 3 && (
                 <button 
                  onClick={() => setLightbox(fotos[3])}
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-[2px] hover:bg-black/50 transition-colors"
                 >
                   <HiOutlinePhoto className="w-8 h-8 mb-2" />
                   <span className="font-black uppercase tracking-widest text-xs">Ver todas ({fotos.length})</span>
                 </button>
               )}
            </div>
          </div>
          <button 
            onClick={() => setLightbox(fotos[0])}
            className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md text-brand-500 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl opacity-0 group-hover/gallery:opacity-100 transition-all duration-300 translate-y-4 group-hover/gallery:translate-y-0"
          >
            Ver galería completa
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* ── Columna Izquierda: Info ── */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-black uppercase tracking-widest border border-brand-100">
                  {tipoLabel}
                </span>
                {open && (
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Abierto ahora
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-brand-500 tracking-tighter mb-4">{biz.nombre}</h1>
              
              <div className="flex flex-wrap items-center gap-6 text-text-secondary font-bold">
                <div className="flex items-center gap-2">
                  <HiOutlineMapPin className="w-5 h-5 text-accent-500" />
                  {biz.direccion}, {biz.ciudad}
                </div>
                {biz.valoracion_media && (
                  <div className="flex items-center gap-2">
                    <StarRating value={biz.valoracion_media} size="sm" showValue={false} />
                    <span className="text-sm text-text-muted">({biz.total_resenas} reseñas)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats chips */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white border border-border-base px-6 py-4 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-subtle transition-all">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                  <HiOutlineUsers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Capacidad</p>
                  <p className="text-sm font-black text-brand-500 leading-none">Hasta {biz.capacidad || 50} pers.</p>
                </div>
              </div>
              <div className="bg-white border border-border-base px-6 py-4 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-subtle transition-all">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                  <HiOutlineBanknotes className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Precio</p>
                  <p className="text-sm font-black text-brand-500 leading-none">Desde 5€/hora</p>
                </div>
              </div>
            </div>

            {/* Amenities Section */}
            {biz.features?.length > 0 && (
              <section>
                <h3 className="text-lg font-black text-brand-500 uppercase tracking-tighter mb-6">Equipamiento y servicios</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {biz.features.map((feat) => {
                    const Icon = AMENITIES_ICONS[feat.slug] || HiOutlineCheckBadge;
                    return (
                      <div key={feat.slug} className="flex items-center gap-3 text-text-secondary font-semibold text-sm">
                        <div className="w-10 h-10 rounded-xl bg-surface-subtle flex items-center justify-center text-accent-500">
                          <Icon className="w-5 h-5" />
                        </div>
                        {feat.nombre}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Description */}
            {biz.descripcion && (
              <section>
                <h3 className="text-lg font-black text-brand-500 uppercase tracking-tighter mb-4">Sobre este espacio</h3>
                <div className="relative">
                  <p className={`text-text-secondary leading-relaxed font-medium transition-all duration-500 ${!descExpanded ? 'line-clamp-3' : ''}`}>
                    {biz.descripcion}
                  </p>
                  {biz.descripcion.length > 200 && (
                    <button 
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="text-accent-500 font-black text-xs uppercase tracking-widest mt-4 hover:underline"
                    >
                      {descExpanded ? 'Leer menos' : 'Leer más'}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Resources List */}
            {isCoworking && biz.recursos?.length > 0 && (
              <section id="espacios">
                <h3 className="text-lg font-black text-brand-500 uppercase tracking-tighter mb-6">Opciones de reserva</h3>
                <div className="space-y-4">
                  {biz.recursos.map((r) => (
                    <ResourceListRow key={r.id} resource={r} onBook={() => navigate(`/book-resource/${r.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* Reviews Section */}
            <ReviewsSection biz={biz} />
            
            {/* Mapa */}
            {biz.lat && (
              <section>
                 <h3 className="text-lg font-black text-brand-500 uppercase tracking-tighter mb-6">Ubicación</h3>
                 <div className="h-[400px] rounded-[40px] overflow-hidden border border-border-base relative">
                    <MapContainer
                      center={[biz.lat, biz.lng]}
                      zoom={15}
                      className="h-full w-full"
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[biz.lat, biz.lng]} icon={createMarkerIcon()} />
                    </MapContainer>
                 </div>
                 <div className="mt-4 flex items-center gap-3 text-text-muted font-bold text-sm px-2">
                    <HiOutlineMapPin className="w-5 h-5 text-brand-500" />
                    {biz.direccion}, {biz.codigo_postal} {biz.ciudad}
                 </div>
              </section>
            )}
          </div>

          {/* ── Columna Derecha: Sticky Sidebar ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white rounded-[40px] border border-border-base p-8 shadow-xl shadow-brand-500/5">
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-4xl font-black text-brand-500">desde 5€</span>
                  <span className="text-text-muted font-bold">/hora</span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-surface-subtle rounded-2xl border border-transparent focus-within:border-brand-500 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1 ml-1">Fecha de inicio</label>
                    <input type="date" className="bg-transparent border-none w-full text-sm font-bold outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="p-4 bg-surface-subtle rounded-2xl border border-transparent focus-within:border-brand-500 transition-all">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1 ml-1">Tipo de espacio</label>
                    <select className="bg-transparent border-none w-full text-sm font-bold outline-none">
                      {biz.recursos?.map(r => <option key={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const firstId = biz.recursos?.[0]?.id;
                    if (firstId) navigate(`/book-resource/${firstId}`);
                    else toast.error('No hay recursos disponibles');
                  }}
                  className="w-full btn-primary py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-brand group"
                >
                  Ver disponibilidad
                  <HiOutlineArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <p className="text-center text-[10px] text-text-muted font-bold uppercase tracking-widest mt-6">
                  Cancelación gratuita hasta 24h antes
                </p>
              </div>

              {/* Business Info Card */}
              <div className="bg-surface-subtle rounded-[40px] p-8 space-y-4">
                <h4 className="text-sm font-black text-brand-500 uppercase tracking-widest">Contacto</h4>
                {biz.telefono && (
                  <a href={`tel:${biz.telefono}`} className="flex items-center gap-3 text-text-secondary font-bold hover:text-brand-500 transition-colors">
                    <HiOutlinePhone className="w-5 h-5 text-accent-500" />
                    {biz.telefono}
                  </a>
                )}
                {biz.web && (
                  <a href={biz.web} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-text-secondary font-bold hover:text-brand-500 transition-colors">
                    <HiOutlineGlobeAlt className="w-5 h-5 text-accent-500" />
                    Sitio web oficial
                  </a>
                )}
                <div className="pt-4 mt-4 border-t border-border-base">
                  <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-4">Horario</h4>
                  <div className="space-y-2">
                    {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map(d => (
                       <div key={d} className="flex justify-between text-xs font-bold">
                          <span className="capitalize text-text-muted">{d}</span>
                          <span className="text-text-secondary">{biz.horario?.[d]?.abre || '09:00'} - {biz.horario?.[d]?.cierra || '19:00'}</span>
                       </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Mobile Floating Bar ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-base p-4 z-[60] lg:hidden animate-slide-up">
           <div className="flex items-center justify-between gap-6 max-w-xl mx-auto">
              <div>
                <p className="text-lg font-black text-brand-500 leading-none">desde 5€/h</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 underline">Ver detalles</p>
              </div>
              <button 
                onClick={() => {
                  const firstId = biz.recursos?.[0]?.id;
                  if (firstId) navigate(`/book-resource/${firstId}`);
                }}
                className="btn-primary flex-1 py-4 text-xs font-black uppercase tracking-widest shadow-brand"
              >
                Reservar
              </button>
           </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="fixed inset-0 bg-slate-900/95 z-[1000] flex flex-col p-8 animate-fade-in" onClick={() => setLightbox(null)}>
           <button className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
              <HiOutlineXMark className="w-8 h-8" />
           </button>
           <div className="flex-1 flex items-center justify-center">
              <img src={lightbox} alt="" className="max-w-full max-h-[85vh] rounded-[2rem] object-contain shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()} />
           </div>
           <div className="flex gap-4 justify-center mt-8 overflow-x-auto py-4">
              {fotos.map(f => (
                <img 
                  key={f} 
                  src={f} 
                  className={`w-20 h-14 rounded-xl object-cover cursor-pointer transition-all ${lightbox === f ? 'ring-4 ring-brand-500 scale-110' : 'opacity-50 hover:opacity-100'}`}
                  onClick={e => { e.stopPropagation(); setLightbox(f); }}
                />
              ))}
           </div>
        </div>
      )}
    </PageWrapper>
  );
}

/* ─── Sub-components ─── */

function ResourceListRow({ resource, onBook }) {
  return (
    <div className="group bg-white rounded-3xl border border-border-base p-5 flex flex-col md:flex-row items-center gap-6 hover:border-brand-500/30 transition-all hover:shadow-subtle">
       <div className="w-full md:w-32 h-24 rounded-2xl overflow-hidden shrink-0">
          <img 
            src={resource.imagen_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
       </div>
       <div className="flex-1 min-w-0">
          <h4 className="text-base font-black text-brand-500 mb-1">{resource.nombre}</h4>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-3">{resource.tipo}</p>
          <div className="flex items-center gap-4 text-xs font-bold text-text-secondary">
             <span className="flex items-center gap-1.5">
                <HiOutlineUsers className="w-4 h-4 text-accent-500" />
                Hasta {resource.capacidad} personas
             </span>
          </div>
       </div>
       <div className="flex items-center gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border-base">
          <div className="text-right">
             <p className="text-xl font-black text-brand-500 leading-none">{parseFloat(resource.precio_hora).toFixed(2)}€</p>
             <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">/ hora</p>
          </div>
          <button 
            onClick={onBook}
            className="flex-1 md:flex-none px-8 py-3 rounded-2xl bg-surface-subtle text-brand-500 font-black text-xs uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all"
          >
            Reservar
          </button>
       </div>
    </div>
  );
}

function ReviewsSection({ biz }) {
  if (!biz.reviews || biz.reviews.length === 0) {
    if (!biz.valoracion_media) return null;
  }

  const maxCount = Math.max(...(biz.distribucion_estrellas || []).map((d) => d.cantidad), 1);

  return (
    <section>
      <h3 className="text-lg font-black text-brand-500 uppercase tracking-tighter mb-8">Opiniones de la comunidad</h3>

      <div className="bg-surface-subtle rounded-[40px] p-10 mb-8 border border-border-base/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <div className="flex items-baseline justify-center md:justify-start gap-4 mb-2">
              <span className="text-7xl font-black text-brand-500 tracking-tighter">
                {biz.valoracion_media?.toFixed(1) || '—'}
              </span>
              <div className="text-left">
                <StarRating value={biz.valoracion_media || 0} size="md" showValue={false} />
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">
                  {biz.total_resenas} opiniones
                </p>
              </div>
            </div>
            <p className="text-text-secondary font-medium text-sm mt-4 max-w-xs mx-auto md:mx-0">
              La mayoría de los usuarios valoran positivamente la conexión WiFi y la tranquilidad del espacio.
            </p>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const d = biz.distribucion_estrellas?.find((x) => x.estrellas === star);
              const count = d?.cantidad || 0;
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-4 text-xs">
                  <span className="w-4 font-black text-brand-500">{star}</span>
                  <div className="flex-1 bg-white rounded-full h-2.5 overflow-hidden border border-border-base/50">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-text-muted font-bold text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {biz.reviews?.map((r) => (
          <div key={r.id} className="bg-white rounded-[32px] p-6 border border-border-base hover:shadow-subtle transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-black">
                {r.usuario?.avatar_url ? (
                  <img src={r.usuario.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  (r.usuario?.nombre || '?')[0]
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-brand-500 leading-none">{r.usuario?.nombre}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                  {new Date(r.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <StarRating value={r.rating} size="xs" showValue={false} />
            </div>
            {r.comentario && (
              <p className="text-sm text-text-secondary leading-relaxed font-medium">"{r.comentario}"</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
