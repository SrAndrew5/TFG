import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineUsers, HiOutlineMapPin, HiOutlineBanknotes, HiOutlineComputerDesktop, HiOutlineWrenchScrewdriver } from 'react-icons/hi2';

const typeIcons = { MESA: '🪑', SALA: '🏢', PUESTO: '💻', DESPACHO: '🚪' };
const typeLabels = { MESA: 'Mesa', SALA: 'Sala', PUESTO: 'Puesto', DESPACHO: 'Despacho' };

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/resources')
      .then((res) => setResources(res.data.data))
      .catch(() => toast.error('Error al cargar recursos'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? resources.filter((r) => r.tipo === filter) : resources;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-surface-100">Espacios Coworking</h1>
        <p className="text-surface-400 mt-1">Reserva mesas, salas y despachos</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${!filter ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:bg-surface-700'}`}>
          Todos
        </button>
        {Object.entries(typeLabels).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${filter === key ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:bg-surface-700'}`}>
            {typeIcons[key]} {label}
          </button>
        ))}
      </div>

      {/* Resource cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((resource, i) => (
          <div key={resource.id} className="glass-card p-6 hover:border-primary-500/30 transition-all duration-500 group animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">{typeIcons[resource.tipo]}</span>
              <span className="badge bg-surface-800 text-surface-400 border border-surface-700">{typeLabels[resource.tipo]}</span>
            </div>

            <h3 className="text-lg font-semibold text-surface-100 group-hover:text-primary-300 transition-colors">{resource.nombre}</h3>
            {resource.descripcion && <p className="text-sm text-surface-400 mt-2 line-clamp-2">{resource.descripcion}</p>}

            <div className="space-y-2 mt-4 text-sm text-surface-400">
              <div className="flex items-center gap-2"><HiOutlineUsers className="w-4 h-4" />Capacidad: {resource.capacidad}</div>
              {resource.ubicacion && <div className="flex items-center gap-2"><HiOutlineMapPin className="w-4 h-4" />{resource.ubicacion}</div>}
              <div className="flex items-center gap-2"><HiOutlineBanknotes className="w-4 h-4" />{parseFloat(resource.precio_hora).toFixed(2)}€/hora</div>
              {resource.equipamiento && <div className="flex items-center gap-2"><HiOutlineWrenchScrewdriver className="w-4 h-4" /><span className="line-clamp-1">{resource.equipamiento}</span></div>}
            </div>

            <button onClick={() => navigate(`/book-resource/${resource.id}`)} className="btn-primary w-full mt-5 text-sm">
              Reservar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
