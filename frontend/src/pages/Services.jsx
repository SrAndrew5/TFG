import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineClock, HiOutlineBanknotes, HiOutlineUser } from 'react-icons/hi2';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/services')
      .then((res) => setServices(res.data.data))
      .catch(() => toast.error('Error al cargar servicios'))
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
        <h1 className="text-3xl font-bold text-surface-100">Servicios</h1>
        <p className="text-surface-400 mt-1">Elige un servicio y reserva tu cita</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service, i) => (
          <div
            key={service.id}
            className="glass-card p-6 hover:border-primary-500/30 transition-all duration-500 group animate-slide-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Category badge */}
            {service.categoria && (
              <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20 mb-4">
                {service.categoria}
              </span>
            )}

            <h3 className="text-lg font-semibold text-surface-100 group-hover:text-primary-300 transition-colors">
              {service.nombre}
            </h3>

            {service.descripcion && (
              <p className="text-sm text-surface-400 mt-2 line-clamp-2">{service.descripcion}</p>
            )}

            <div className="flex items-center gap-4 mt-4 text-sm text-surface-400">
              <span className="flex items-center gap-1">
                <HiOutlineClock className="w-4 h-4" />
                {service.duracion_min} min
              </span>
              <span className="flex items-center gap-1">
                <HiOutlineBanknotes className="w-4 h-4" />
                {parseFloat(service.precio).toFixed(2)}€
              </span>
            </div>

            {/* Employees */}
            {service.empleados?.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <HiOutlineUser className="w-4 h-4 text-surface-500" />
                <div className="flex -space-x-2">
                  {service.empleados.slice(0, 3).map((emp) => (
                    <div
                      key={emp.id}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold border-2 border-surface-900"
                      title={`${emp.nombre} ${emp.apellidos}`}
                    >
                      {emp.nombre?.charAt(0)}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-surface-500">
                  {service.empleados.length} profesional{service.empleados.length > 1 ? 'es' : ''}
                </span>
              </div>
            )}

            <button
              onClick={() => navigate(`/book/${service.id}`)}
              className="btn-primary w-full mt-5 text-sm"
            >
              Reservar cita
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
