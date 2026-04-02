import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { 
  HiOutlineFunnel, 
  HiOutlineMagnifyingGlass,
  HiOutlineBuildingOffice2,
  HiOutlineScissors,
  HiOutlineStar,
  HiOutlineMapPin
} from 'react-icons/hi2';

// ── Iconos Personalizados para el Mapa (Estilo Brand) ──
const createMarkerIcon = (colorClass, shadowClass) => new L.DivIcon({
  className: 'custom-marker bg-transparent',
  html: `<div class="w-10 h-10 ${colorClass} rounded-full border-[3px] border-white ${shadowClass} flex items-center justify-center relative -top-5">
          <div class="w-3 h-3 bg-white rounded-full"></div>
          <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const defaultMarker = createMarkerIcon('bg-brand-500', 'shadow-[0_4px_16px_rgba(99,102,241,0.4)]');
const accentMarker = createMarkerIcon('bg-accent-500', 'shadow-[0_4px_16px_rgba(249,115,22,0.4)]');

// ── Datos de prueba ──
const MOCK_LOCATIONS = [
  { id: 1, name: 'Espacio Atarazanas (Coworking)', lat: 39.4699, lng: -0.3763, type: 'coworking', price: '15€/día', rating: 4.8 },
  { id: 2, name: 'Salón Ruzafa (Peluquería)', lat: 39.4622, lng: -0.3732, type: 'peluqueria', price: 'Desde 20€', rating: 4.9 },
  { id: 3, name: 'Centro Colón (Coworking)', lat: 39.4682, lng: -0.3688, type: 'coworking', price: '25€/hora', rating: 4.5 },
];

export default function MapView() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') || 'all';
  const targetCity = queryParams.get('location')?.toLowerCase() || '';

  const CITY_COORDS = {
    madrid: [40.4168, -3.7038],
    valencia: [39.4699, -0.3774],
    barcelona: [41.3851, 2.1734]
  };

  const centerCoords = CITY_COORDS[targetCity] || CITY_COORDS['madrid'];

  const [activeType, setActiveType] = useState(initialType);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = MOCK_LOCATIONS.filter(loc => {
    const matchType = activeType === 'all' || loc.type === activeType;
    const matchSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full h-[calc(100vh-64px)] overflow-hidden bg-surface-subtle">
      
      {/* ── Sidebar Filtros (Izquierda) ── */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-border-base flex flex-col h-full z-10 shadow-[2px_0_12px_rgba(99,102,241,0.03)] z-[1000] relative">
        <div className="p-6 border-b border-border-base">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            <HiOutlineFunnel className="w-5 h-5 text-brand-500" />
            Filtros
          </h2>

          <div className="relative mb-5">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Buscar por zona..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-transparent rounded-[10px] text-sm focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-50 transition-all outline-none"
            />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Tipo de Espacio</p>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setActiveType('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeType === 'all' ? 'bg-surface-800 text-white' : 'bg-surface-elevated text-text-secondary hover:bg-surface-300'}`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setActiveType('coworking')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeType === 'coworking' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-surface-elevated text-text-secondary hover:bg-surface-300 border border-transparent'}`}
                >
                  <HiOutlineBuildingOffice2 className="w-4 h-4" /> Coworking
                </button>
                <button 
                  onClick={() => setActiveType('peluqueria')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeType === 'peluqueria' ? 'bg-accent-50 text-accent-700 border border-accent-200' : 'bg-surface-elevated text-text-secondary hover:bg-surface-300 border border-transparent'}`}
                >
                  <HiOutlineScissors className="w-4 h-4" /> Peluquería
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Precio Máximo</p>
              <input type="range" min="10" max="100" defaultValue="50" className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>10€</span>
                <span>100€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Resultados Sidebar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-sm font-semibold text-text-primary px-2">{filteredLocations.length} resultados encontrados</p>
          
          {filteredLocations.map(loc => (
            <div key={loc.id} className="p-4 rounded-xl border border-border-base bg-white hover:border-brand-300 shadow-xs hover:shadow-md transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-text-primary group-hover:text-brand-600 transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {loc.name}
                </h3>
                <div className="flex items-center gap-1 text-xs font-bold">
                  <HiOutlineStar className="w-3.5 h-3.5 text-warning" /> {loc.rating}
                </div>
              </div>
              <p className="text-xs text-text-secondary flex items-center gap-1 mb-3">
                <HiOutlineMapPin className="w-3.5 h-3.5 text-text-muted" /> Centro ciudad
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="font-semibold text-text-primary text-sm">{loc.price}</span>
                <Link to="/book/1" className="text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors px-2 py-1 rounded-md block">Ver detalles</Link>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Zona del Mapa (Derecha) ── */}
      <div className="flex-1 relative h-[50vh] md:h-auto z-0">
        <MapContainer 
          key={centerCoords.join(',')}
          center={centerCoords} 
          zoom={targetCity === 'valencia' ? 14 : 12} // Adjust zoom depending on if it's Valencia (where mock places are)
          zoomControl={false}
          className="w-full h-full absolute inset-0"
        >
          {/* TileLayer minimalista (CartoDB Positron / similar light version) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ZoomControl position="topright" />

          {/* Render markers */}
          {filteredLocations.map(loc => (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.lng]} 
              icon={loc.type === 'peluqueria' ? accentMarker : defaultMarker}
            >
              <Popup className="custom-popup">
                <div className="text-center p-1">
                  <h3 className="font-bold text-text-primary text-sm mb-1">{loc.name}</h3>
                  <p className="text-brand-600 font-semibold text-xs mb-2">{loc.price}</p>
                  <Link to="/book/1" className="bg-brand-500 text-white flex justify-center items-center px-3 py-1.5 rounded-lg text-xs font-semibold w-full hover:bg-brand-600 transition-colors">
                    Reservar ahora
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating gradient shadow overlay to bridge sidebar and map nicely */}
        <div className="absolute top-0 left-0 bottom-0 w-4 bg-gradient-to-r from-[rgba(0,0,0,0.02)] to-transparent pointer-events-none z-[400]" />
      </div>
    </div>
  );
}
