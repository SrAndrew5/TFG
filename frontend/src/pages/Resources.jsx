import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineBanknotes, HiOutlineUsers, HiOutlineMapPin } from 'react-icons/hi2';

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/resources')
      .then((res) => setResources(res.data.data))
      .catch(() => toast.error('Error al cargar la sala de Coworking'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-surface-100">Espacios Coworking</h1>
        <p className="text-surface-400 mt-1">Descubre nuestros puestos, mesas y despachos privados y reserva el tuyo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((resource, i) => (
          <div
            key={resource.id}
            className="glass-card p-6 hover:border-primary-500/30 transition-all duration-500 group animate-slide-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Tipo de recurso */}
            <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20 mb-4 inline-block">
              {resource.tipo}
            </span>

            <h3 className="text-lg font-semibold text-surface-100 group-hover:text-primary-300 transition-colors">
              {resource.nombre}
            </h3>

            {resource.descripcion && (
              <p className="text-sm text-surface-400 mt-2 line-clamp-2">{resource.descripcion}</p>
            )}

            <div className="flex flex-col gap-2 mt-4 text-sm text-surface-400">
              <span className="flex items-center gap-2">
                <HiOutlineBanknotes className="w-4 h-4" />
                {parseFloat(resource.precio_hora).toFixed(2)}€ / hora
              </span>
              <span className="flex items-center gap-2">
                <HiOutlineUsers className="w-4 h-4" />
                Capacidad: {resource.capacidad} persona{resource.capacidad > 1 ? 's' : ''}
              </span>
              {resource.ubicacion && (
                <span className="flex items-center gap-2">
                  <HiOutlineMapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{resource.ubicacion}</span>
                </span>
              )}
            </div>

            <button
              onClick={() => navigate(`/book-resource/${resource.id}`)}
              className="btn-primary w-full mt-5 text-sm"
            >
              Reservar Espacio
            </button>
          </div>
        ))}

        {resources.length === 0 && (
          <div className="col-span-full py-12 text-center text-surface-400">
            No hay recursos de Coworking disponibles en este momento.
          </div>
        )}
      </div>
    </div>
  );
}
