import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineUser,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineCamera,
  HiOutlineCheck
} from 'react-icons/hi2';

export default function UserProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('¡Perfil actualizado con éxito!');
    }, 1000);
  };

  const TABS = [
    { id: 'info', icon: HiOutlineUser, label: 'Información Personal' },
    { id: 'billing', icon: HiOutlineCreditCard, label: 'Métodos de Pago' },
    { id: 'security', icon: HiOutlineShieldCheck, label: 'Seguridad' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* ── Encabezado ── */}
      <div className="page-header border-b border-border-base pb-6">
        <h1 className="page-title text-3xl mb-2">Mi Perfil</h1>
        <p className="page-subtitle text-base">Gestiona tus datos personales y configuración de cuenta.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ── Menú Lateral ── */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap lg:whitespace-normal cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-brand-50 text-brand-700 shadow-[inset_3px_0_0_#6366F1]'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-brand-500' : 'text-text-muted'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Área de Contenido Principal ── */}
        <main className="flex-1 w-full relative">
          
          {/* TAB: INFORMACIÓN PERSONAL */}
          {activeTab === 'info' && (
            <div className="bg-white rounded-3xl shadow-sm border border-border-base p-6 sm:p-10 animate-fade-in">
              
              <h2 className="text-xl font-bold text-text-primary mb-8" style={{ fontFamily: 'Sora, sans-serif' }}>
                Detalles Básicos
              </h2>

              <div className="flex flex-col sm:flex-row gap-10 items-center sm:items-start mb-10">
                
                {/* ── Avatar Edit ── */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-brand relative bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                    <span className="text-4xl font-extrabold text-white tracking-widest uppercase">
                      {user?.nombre?.charAt(0)}{user?.apellidos?.charAt(0)}
                    </span>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-brand-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <HiOutlineCamera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full border border-border-base shadow-sm flex items-center justify-center hover:bg-surface-elevated text-brand-600 transition-colors"
                  >
                    <HiOutlineCamera className="w-5 h-5" />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                </div>

                <div className="flex-1 w-full space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Nombre</label>
                      <input 
                        type="text" 
                        defaultValue={user?.nombre || ''}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Apellidos</label>
                      <input 
                        type="text" 
                        defaultValue={user?.apellidos || ''}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Correo Electrónico</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || ''}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Número de Teléfono</label>
                    <input 
                      type="tel" 
                      placeholder="+34 600 000 000"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border-base pt-6 flex justify-end">
                <button onClick={handleSave} disabled={saving} className="btn-primary w-48 flex justify-center items-center">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <HiOutlineCheck className="w-4.5 h-4.5 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB: PAGOS (Placeholder limpio) */}
          {activeTab === 'billing' && (
            <div className="bg-white rounded-3xl shadow-sm border border-border-base p-6 sm:p-10 animate-fade-in text-center py-20">
              <div className="w-16 h-16 bg-surface-elevated rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-muted">
                <HiOutlineCreditCard className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>No hay métodos de pago</h2>
              <p className="text-text-secondary max-w-sm mx-auto">Añade tu primera tarjeta para agilizar el pago de tus reservas de peluquería o espacios.</p>
              <button className="btn-secondary mt-6 bg-white border-border-strong hover:bg-surface-elevated">
                Añadir tarjeta
              </button>
            </div>
          )}

          {/* TAB: SEGURIDAD (Placeholder limpio) */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl shadow-sm border border-border-base p-6 sm:p-10 animate-fade-in text-center py-20">
              <div className="w-16 h-16 bg-surface-elevated rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-muted">
                <HiOutlineShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Configuración de Seguridad</h2>
              <p className="text-text-secondary max-w-md mx-auto">Aquí podrás cambiar tu contraseña o habilitar el inicio de sesión en dos pasos (2FA) en el futuro.</p>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
