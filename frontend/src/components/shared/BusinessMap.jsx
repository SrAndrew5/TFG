import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { TIPO_NEGOCIO_OPTIONS } from '../../services/businessService';

function createBusinessIcon(business, highlighted = false) {
  const size = highlighted ? 52 : 44;
  const initial = (business.nombre || '?')[0].toUpperCase();
  const border = highlighted ? '3px solid #6366F1' : '2.5px solid white';
  const shadow = highlighted
    ? '0 4px 16px rgba(99,102,241,0.45)'
    : '0 2px 8px rgba(0,0,0,0.18)';

  let html;
  if (business.logo_url) {
    html = `<div style="width:${size}px;height:${size}px;border-radius:50%;border:${border};box-shadow:${shadow};overflow:hidden;background:#fff;">
      <img src="${business.logo_url}" style="width:100%;height:100%;object-fit:cover;" alt="" />
    </div>`;
  } else {
    html = `<div style="width:${size}px;height:${size}px;border-radius:50%;border:${border};box-shadow:${shadow};background:linear-gradient(135deg,#6366F1,#4338CA);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:${size * 0.4}px;font-family:Sora,sans-serif;">
      ${initial}
    </div>`;
  }

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

function FlyToLocation({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

function MapMarker({ biz, highlighted, onHover }) {
  const icon = useMemo(
    () => createBusinessIcon(biz, highlighted),
    [biz, highlighted],
  );

  return (
    <Marker
      position={[biz.lat, biz.lng]}
      icon={icon}
      eventHandlers={{
        mouseover: () => onHover?.(biz.id),
        mouseout: () => onHover?.(null),
      }}
    >
      <Tooltip direction="top" offset={[0, -26]}>
        <strong>{biz.nombre}</strong>
        <br />
        <span style={{ fontSize: 11, color: '#64748B' }}>
          {TIPO_NEGOCIO_OPTIONS.find((t) => t.value === biz.tipo)?.label || biz.tipo}
        </span>
      </Tooltip>
      <Popup>
        <div style={{ minWidth: 200, fontFamily: 'Inter, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {biz.logo_url ? (
              <img src={biz.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8E8F5' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#4338CA)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>
                {(biz.nombre || '?')[0]}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{biz.nombre}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                {TIPO_NEGOCIO_OPTIONS.find((t) => t.value === biz.tipo)?.label} · {biz.ciudad}
              </div>
            </div>
          </div>
          {biz.valoracion_media && (
            <div style={{ marginBottom: 8 }}>
              <StarRating value={biz.valoracion_media} count={biz.total_resenas} size="sm" />
            </div>
          )}
          <Link
            to={`/negocio/${biz.slug}`}
            style={{ display: 'inline-block', background: '#6366F1', color: 'white', padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', width: '100%', textAlign: 'center' }}
          >
            Ver perfil
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}

export default function BusinessMap({ businesses, center, zoom, flyTo, hoveredId, onHover }) {
  const mappable = useMemo(
    () => businesses.filter((b) => b.lat && b.lng),
    [businesses],
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {flyTo && <FlyToLocation center={flyTo.center} zoom={flyTo.zoom} />}
      {mappable.map((biz) => (
        <MapMarker
          key={biz.id}
          biz={biz}
          highlighted={hoveredId === biz.id}
          onHover={onHover}
        />
      ))}
    </MapContainer>
  );
}
