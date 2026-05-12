import { useEffect, useState, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ESTADO_BUSINESS_META, TIPO_NEGOCIO_OPTIONS, getBusinessStats, getBusinessAppointments } from '../../services/businessService';
import StatusBadge from '../../components/shared/StatusBadge';
import {
  HiOutlineCalendar,
  HiOutlineStar,
  HiOutlineCheckBadge,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlineArrowRight,
  HiOutlineFaceSmile,
  HiOutlineBanknotes,
  HiOutlineWrenchScrewdriver,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';

export default function BusinessDashboard() {
  usePageTitle('Panel de Control');
  const { business, loadingBiz } = useOutletContext();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [todayItems, setTodayItems] = useState([]);
  const [loadingToday, setLoadingToday] = useState(true);

  const loadData = useCallback(async () => {
    setLoadingStats(true);
    setLoadingToday(true);
    try {
      const [statsRes, todayRes] = await Promise.all([
        getBusinessStats(),
        getBusinessAppointments({ range: 'today', limit: 5 }),
      ]);
      setStats(statsRes.data.data);
      setTodayItems(todayRes.data.data || []);
    } catch (err) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoadingStats(false);
      setLoadingToday(false);
    }
  }, []);

  useEffect(() => {
    if (business) loadData();
  }, [business, loadData]);

  if (loadingBiz) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="card p-8 text-center text-text-secondary">
        No se pudo cargar la información del negocio.
      </div>
    );
  }

  const tipoLabel  = TIPO_NEGOCIO_OPTIONS.find((t) => t.value === business.tipo)?.label || business.tipo;
  const estadoMeta = ESTADO_BUSINESS_META[business.estado] || ESTADO_BUSINESS_META.ACTIVO;

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      
      {/* ── PREMUM BUSINESS HERO ── */}
      <div className="profile-hero !mb-0">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-accent-500/20">
            {estadoMeta.label}
          </div>
          <h1 className="profile-hero-name">¡Hola, {business.nombre}! 👋</h1>
          <p className="profile-hero-email flex items-center gap-2">
            <HiOutlineMapPin className="w-5 h-5 text-accent-500" />
            {business.direccion}, {business.ciudad}
          </p>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Citas hoy</p>
              <p className="text-xl font-black text-white">{loadingStats ? '…' : (stats?.citas_hoy ?? 0)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Ingresos mes</p>
              <p className="text-xl font-black text-white">{loadingStats ? '…' : `${(stats?.ingresos_mes ?? 0).toFixed(0)}€`}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Valoración</p>
              <p className="text-xl font-black text-white">{loadingStats ? '…' : (stats?.valoracion_media ? `${stats.valoracion_media} ★` : '—')}</p>
            </div>
          </div>
        </div>

        {/* Business Logo / Brand Icon */}
        <div className="hidden md:block">
           <div className="w-32 h-32 rounded-[2.5rem] bg-white p-4 shadow-2xl flex items-center justify-center">
              {business.logo_url ? (
                <img src={business.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <HiOutlineBuildingOffice2 className="w-12 h-12 text-brand-200" />
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="profile-content-card !p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-brand-500 tracking-tight">Próximas citas del día</h2>
                <p className="text-text-secondary text-sm font-medium mt-1">Gestiona tus reservas de hoy rápidamente.</p>
              </div>
              <Link to="/business/citas" className="p-3 bg-brand-50 text-brand-500 rounded-2xl hover:bg-brand-500 hover:text-white transition-all group">
                <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loadingToday ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : todayItems.length === 0 ? (
              <div className="bg-surface-subtle border-2 border-dashed border-border-base rounded-[2.5rem] py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 text-text-muted mx-auto shadow-sm">
                  <HiOutlineFaceSmile className="w-8 h-8" />
                </div>
                <p className="font-black text-brand-500 mb-1 text-lg">Día tranquilo por ahora</p>
                <p className="text-sm text-text-secondary max-w-xs mx-auto">
                  Cuando recibas reservas para hoy, aparecerán en este listado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayItems.map((cita) => (
                  <div key={cita.id} className="flex items-center gap-6 bg-surface-subtle p-6 rounded-[2rem] hover:bg-white hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border border-transparent hover:border-brand-100 group">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white flex flex-col items-center justify-center text-brand-500 shadow-sm group-hover:bg-brand-500 group-hover:text-white transition-colors">
                      <p className="text-[10px] font-black uppercase leading-none mb-1">HORA</p>
                      <p className="text-lg font-black leading-none">{cita.hora_inicio.split(':')[0]}:{cita.hora_inicio.split(':')[1]}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-black text-brand-500 truncate text-lg">
                          {cita.servicio?.nombre || 'Servicio'}
                        </span>
                        <StatusBadge estado={cita.estado} />
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <HiOutlineUser className="w-4 h-4 text-accent-500" />
                          {cita.usuario?.nombre} {cita.usuario?.apellidos}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <HiOutlineClock className="w-4 h-4 text-brand-400" />
                          {cita.hora_fin}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-brand-500">{parseFloat(cita.precio_pagado || 0).toFixed(2)}€</p>
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-tighter">COBRADO</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Info & Actions */}
        <div className="space-y-8">
           <div className="profile-content-card !p-8">
              <h3 className="text-xl font-black text-brand-500 mb-6 tracking-tight">Estado Operativo</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                       <HiOutlineCheckBadge className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-text-muted uppercase tracking-widest">Estado</p>
                       <p className="text-sm font-black text-emerald-700">{estadoMeta.label}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                       <HiOutlineClock className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-text-muted uppercase tracking-widest">Antigüedad</p>
                       <p className="text-sm font-black text-blue-700">Desde {new Date(business.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                    </div>
                 </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-100">
                 <Link to="/business/perfil" className="profile-save-btn !w-full !px-0 flex justify-center items-center gap-3">
                    Configurar Negocio
                    <HiOutlineArrowRight className="w-4 h-4" />
                 </Link>
              </div>
           </div>

           <div className="bento-card bg-brand-500 text-white border-none shadow-brand p-8">
              <HiOutlineWrenchScrewdriver className="w-10 h-10 text-accent-400 mb-6" />
              <h3 className="text-xl font-black mb-2 tracking-tight">Tus Servicios</h3>
              <p className="text-brand-100/60 text-sm font-medium mb-8 leading-relaxed">
                Tienes <b>{stats?.servicios_activos ?? 0} servicios</b> publicados actualmente.
              </p>
              <Link to="/business/services" className="block text-center py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                Gestionar Catálogo
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard() { return null; }
function InfoRow() { return null; }
