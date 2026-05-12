import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  HiOutlineUser, 
  HiOutlineCreditCard, 
  HiOutlineShieldCheck, 
  HiOutlineCamera,
  HiOutlineCheck,
  HiOutlineArrowDownTray,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineKey,
  HiOutlineAtSymbol,
  HiOutlinePhone,
  HiOutlineDevicePhoneMobile,
  HiOutlineLockClosed,
  HiOutlineInboxArrowDown,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useScrollLock } from '../hooks/useScrollLock';
import ModalPortal from '../components/shared/ModalPortal';
import { formatCardNumber, formatExpiry, detectBrand, CARD_COLORS, getCardGradient } from '../utils/cardHelpers';

/* ── Componente de Tarjeta Premium ── */
function BrandLogo({ brand }) {
  if (!brand) return null;
  return (
    <div className="absolute top-4 right-5 text-white/40 font-black text-sm tracking-tighter">
      {brand}
    </div>
  );
}

function MiniCard({ method }) {
  const gradient = getCardGradient(method.colorId);
  return (
    <div className={`relative rounded-[2rem] bg-gradient-to-br ${gradient} shadow-xl text-white overflow-hidden flex flex-col justify-between transition-transform hover:scale-[1.02] duration-500`}
      style={{ aspectRatio: '1.586 / 1', padding: '8% 10%' }}>
      <div className="flex justify-between items-start">
        <div className="w-10 h-6 bg-white/20 rounded-md backdrop-blur-sm border border-white/10" />
        <BrandLogo brand={method.brand} />
      </div>
      
      <div className="space-y-4">
        <p className="text-lg md:text-xl font-black tracking-[0.2em] font-mono leading-none">
          •••• •••• •••• {method.last4}
        </p>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[8px] uppercase tracking-widest text-white/50 font-black">Titular</p>
            <p className="text-[10px] font-black uppercase truncate max-w-[120px]">{method.titular}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[8px] uppercase tracking-widest text-white/50 font-black">Expira</p>
            <p className="text-[10px] font-black">{method.expiry}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ card, onConfirm, onCancel }) {
  useScrollLock(!!card);
  if (!card) return null;
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/20 animate-fade-in">
        <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl border border-border-base text-center animate-scale-in">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <HiOutlineTrash className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-brand-500 mb-4 tracking-tighter">¿Eliminar tarjeta?</h3>
          <p className="text-text-secondary font-medium text-sm leading-relaxed mb-10 px-4">
            Esta acción no se puede deshacer. Perderás este método de pago guardado.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={onConfirm} className="bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95">
              Sí, eliminar
            </button>
            <button onClick={onCancel} className="bg-surface-subtle text-text-primary font-black py-4 rounded-2xl transition-all hover:bg-surface-hover active:scale-95">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab]       = useState('info');
  const [saving, setSaving]             = useState(false);
  const [form, setForm]                 = useState({ 
    nombre: user?.nombre || '', 
    apellidos: user?.apellidos || '', 
    email: user?.email || '', 
    telefono: user?.telefono || '' 
  });
  const [passForm, setPassForm]         = useState({ current: '', new: '', confirm: '' });
  const [showAddCard, setShowAddCard]   = useState(false);
  const [cardForm, setCardForm]         = useState({ holderName: '', cardNumber: '', expiry: '', colorId: 'blue' });
  const [pendingDelete, setPendingDelete] = useState(null);

  const { methods, loadingMethods, addMethod, removeMethod } = usePaymentMethods();

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      updateUser(form);
      toast.success('Perfil actualizado correctamente');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passForm.new !== passForm.confirm) return toast.error('Las contraseñas no coinciden');
    try {
      await api.put('/auth/change-password', { current: passForm.current, new: passForm.new });
      toast.success('Contraseña actualizada');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/auth/avatar', formData);
      updateUser({ avatar: res.data.data.avatar });
      toast.success('Foto actualizada');
    } catch (err) {
      toast.error('Error al subir imagen');
    }
  };

  const initials = `${user?.nombre?.charAt(0) ?? ''}${user?.apellidos?.charAt(0) ?? ''}`.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-6 pb-24 animate-fade-up">
      
      {/* ── HIGH-END HERO ── */}
      <div className="profile-hero mt-10">
        <div className="relative">
          <div className="profile-avatar-wrapper group">
            {user?.avatar ? (
              <img src={user.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Avatar" />
            ) : (
              <span className="text-5xl font-black text-white/80">{initials}</span>
            )}
            <label className="absolute inset-0 bg-brand-500/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-300">
              <HiOutlineCamera className="w-10 h-10 text-white" />
              <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
            </label>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-accent-500/20">
            Usuario Verificado
          </div>
          <h1 className="profile-hero-name">{user?.nombre} {user?.apellidos}</h1>
          <p className="profile-hero-email flex items-center justify-center md:justify-start gap-2">
            <HiOutlineAtSymbol className="w-5 h-5 text-accent-500" />
            {user?.email}
          </p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Miembro desde</p>
              <p className="text-sm font-bold">Mayo 2024</p>
            </div>
            <button 
              onClick={() => navigate('/my-bookings')}
              className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5 hover:bg-white/20 transition-all text-left"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Reservas totales</p>
              <p className="text-sm font-bold flex items-center gap-2">
                12 completadas <HiOutlineArrowRight className="w-3 h-3 text-accent-500" />
              </p>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* ── SIDEBAR NAVIGATION ── */}
        <aside className="w-full lg:w-72 shrink-0">
          <nav className="space-y-2">
            <button
              onClick={() => navigate('/my-bookings')}
              className="profile-sidebar-btn group/res"
            >
              <div className="profile-tab-icon group-hover/res:bg-accent-500 group-hover/res:text-white transition-all">
                <HiOutlineInboxArrowDown className="w-5 h-5" />
              </div>
              <div className="flex-1 flex justify-between items-center">
                <span>Mis Reservas</span>
                <HiOutlineArrowRight className="w-4 h-4 opacity-0 group-hover/res:opacity-100 transition-all -translate-x-2 group-hover/res:translate-x-0" />
              </div>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`profile-sidebar-btn ${activeTab === 'info' ? 'active' : ''}`}
            >
              <div className="profile-tab-icon"><HiOutlineUser className="w-5 h-5" /></div>
              Información
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`profile-sidebar-btn ${activeTab === 'billing' ? 'active' : ''}`}
            >
              <div className="profile-tab-icon"><HiOutlineCreditCard className="w-5 h-5" /></div>
              Pagos y Facturación
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`profile-sidebar-btn ${activeTab === 'security' ? 'active' : ''}`}
            >
              <div className="profile-tab-icon"><HiOutlineShieldCheck className="w-5 h-5" /></div>
              Seguridad
            </button>
          </nav>

          <div className="mt-10 p-8 rounded-[2.5rem] bg-brand-50 border border-brand-100/50">
             <HiOutlineKey className="w-8 h-8 text-brand-500 mb-4" />
             <p className="text-sm font-black text-brand-500 mb-2 tracking-tight">Privacidad Total</p>
             <p className="text-xs text-brand-700/60 font-medium leading-relaxed">
               Tus datos están protegidos bajo cifrado de grado militar conforme a la RGPD europea.
             </p>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 w-full space-y-8">
          
          {/* TAB: INFORMACIÓN BÁSICA */}
          {activeTab === 'info' && (
            <div className="animate-fade-in space-y-8">
              <div className="profile-content-card">
                <div className="profile-content-header flex justify-between items-center">
                  <div>
                    <h2 className="profile-content-title">Datos Básicos</h2>
                    <p className="text-text-secondary text-sm font-medium mt-1">Información de contacto y personal.</p>
                  </div>
                  <HiOutlineInformationCircle className="w-8 h-8 text-brand-100" />
                </div>
                
                <div className="profile-content-body grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-brand-500 ml-1">Nombre</label>
                    <div className="relative group">
                      <HiOutlineUser className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                      <input
                        value={form.nombre}
                        onChange={e => setForm({ ...form, nombre: e.target.value })}
                        className="input-field pl-14"
                        placeholder="Tu nombre"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-brand-500 ml-1">Apellidos</label>
                    <div className="relative group">
                      <HiOutlineUser className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                      <input
                        value={form.apellidos}
                        onChange={e => setForm({ ...form, apellidos: e.target.value })}
                        className="input-field pl-14"
                        placeholder="Tus apellidos"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-brand-500 ml-1">Email Principal</label>
                    <div className="relative group">
                      <HiOutlineAtSymbol className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors opacity-50" />
                      <input
                        value={form.email}
                        disabled
                        className="input-field pl-14 bg-surface-subtle cursor-not-allowed border-dashed"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-brand-500 ml-1">Teléfono Móvil</label>
                    <div className="relative group">
                      <HiOutlinePhone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-500 transition-colors" />
                      <input
                        value={form.telefono}
                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                        className="input-field pl-14"
                        placeholder="+34 600 000 000"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 pt-6 flex justify-end">
                    <button onClick={handleSave} disabled={saving} className="profile-save-btn flex items-center gap-3">
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><HiOutlineCheck className="w-5 h-5" />Guardar Cambios</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAGOS Y FACTURACIÓN */}
          {activeTab === 'billing' && (
            <div className="animate-fade-in space-y-10">
              <div className="profile-content-card">
                <div className="profile-content-header flex justify-between items-center">
                  <div>
                    <h2 className="profile-content-title">Billetera Digital</h2>
                    <p className="text-text-secondary text-sm font-medium mt-1">Gestiona tus tarjetas y preferencias de pago.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddCard(!showAddCard)}
                    className="flex items-center gap-2 bg-brand-50 text-brand-500 font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-brand-500 hover:text-white transition-all shadow-sm"
                  >
                    {showAddCard ? <HiOutlineXMark className="w-4 h-4" /> : <HiOutlinePlus className="w-4 h-4" />}
                    {showAddCard ? 'Cancelar' : 'Añadir Tarjeta'}
                  </button>
                </div>

                <div className="profile-content-body">
                  {/* Grid de Tarjetas Existentes */}
                  {!showAddCard && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {loadingMethods ? (
                        [1,2].map(n => <div key={n} className="aspect-[1.586/1] bg-surface-subtle animate-pulse rounded-[2rem]" />)
                      ) : methods.length > 0 ? (
                        methods.map(m => (
                          <div key={m.id} className="relative group">
                            <MiniCard method={m} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem] backdrop-blur-[2px]">
                              <button 
                                onClick={() => setPendingDelete(m)}
                                className="bg-white text-red-500 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
                              >
                                <HiOutlineTrash className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 py-16 text-center border-2 border-dashed border-border-base rounded-[3rem]">
                           <HiOutlineCreditCard className="w-16 h-16 text-text-muted/20 mx-auto mb-6" />
                           <p className="text-text-muted font-bold tracking-tight">No tienes tarjetas guardadas.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulario Añadir Tarjeta (Apple Style) */}
                  {showAddCard && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-brand-500">Nombre en la tarjeta</label>
                          <input
                            value={cardForm.holderName}
                            onChange={e => setCardForm({ ...cardForm, holderName: e.target.value.toUpperCase() })}
                            className="input-field"
                            placeholder="MARÍA GARCÍA"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-brand-500">Número de Tarjeta</label>
                          <input
                            value={cardForm.cardNumber}
                            onChange={e => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })}
                            className="input-field font-mono text-lg"
                            placeholder="•••• •••• •••• ••••"
                            maxLength="19"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-brand-500">Expiración</label>
                            <input
                              value={cardForm.expiry}
                              onChange={e => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                              className="input-field"
                              placeholder="MM/AA"
                              maxLength="5"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-brand-500">Color</label>
                            <div className="flex gap-2 p-1 bg-surface-subtle rounded-2xl">
                              {CARD_COLORS.map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => setCardForm({ ...cardForm, colorId: c.id })}
                                  className={`w-full h-8 rounded-xl transition-all ${cardForm.colorId === c.id ? 'ring-2 ring-brand-500 scale-90' : 'opacity-40 hover:opacity-100'}`}
                                  style={{ backgroundColor: c.swatch }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => { addMethod(cardForm); setShowAddCard(false); toast.success('Tarjeta añadida'); }}
                          className="btn-primary w-full py-5 rounded-[2rem] mt-4"
                        >
                          Vincular Tarjeta Segura
                        </button>
                      </div>
                      
                      <div className="hidden lg:block">
                        <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-6 text-center">Vista Previa</p>
                        <div className="max-w-sm mx-auto">
                          <MiniCard method={{ 
                            titular: cardForm.holderName || 'NOMBRE TITULAR', 
                            last4: cardForm.cardNumber.replace(/\s/g,'').slice(-4) || '••••', 
                            brand: detectBrand(cardForm.cardNumber), 
                            expiry: cardForm.expiry || 'MM/AA', 
                            colorId: cardForm.colorId 
                          }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SEGURIDAD */}
          {activeTab === 'security' && (
            <div className="animate-fade-in space-y-10">
              <div className="profile-content-card">
                <div className="profile-content-header flex justify-between items-center">
                  <div>
                    <h2 className="profile-content-title">Credenciales de Acceso</h2>
                    <p className="text-text-secondary text-sm font-medium mt-1">Cambia tu contraseña para mantener la cuenta segura.</p>
                  </div>
                  <HiOutlineLockClosed className="w-8 h-8 text-brand-100" />
                </div>
                
                <div className="profile-content-body max-w-xl space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-brand-500 ml-1">Contraseña Actual</label>
                    <input
                      type="password"
                      value={passForm.current}
                      onChange={e => setPassForm({ ...passForm, current: e.target.value })}
                      className="input-field"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-brand-500 ml-1">Nueva Contraseña</label>
                      <input
                        type="password"
                        value={passForm.new}
                        onChange={e => setPassForm({ ...passForm, new: e.target.value })}
                        className="input-field"
                        placeholder="Min. 8 caracteres"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-brand-500 ml-1">Repetir Nueva</label>
                      <input
                        type="password"
                        value={passForm.confirm}
                        onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
                        className="input-field"
                        placeholder="Repetir..."
                      />
                    </div>
                  </div>
                  <button onClick={handleChangePassword} className="btn-primary w-full py-4 rounded-2xl shadow-brand mt-4">
                    Actualizar Credenciales
                  </button>
                </div>
              </div>

              {/* RGPD y Backup Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bento-card bg-brand-500 text-white border-none shadow-brand">
                    <HiOutlineArrowDownTray className="w-10 h-10 text-accent-400 mb-6" />
                    <h3 className="text-xl font-black mb-3 tracking-tight">Portabilidad de Datos</h3>
                    <p className="text-brand-100/60 text-sm font-medium mb-8 leading-relaxed">
                      Descarga toda tu información personal y reservas en formato JSON.
                    </p>
                    <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Exportar Datos (.json)
                    </button>
                 </div>
                 <div className="bento-card border-dashed border-2 border-red-100 hover:border-red-500/20">
                    <div className="flex items-center gap-3 text-red-500 mb-6">
                       <HiOutlineExclamationTriangle className="w-8 h-8" />
                       <span className="text-xs font-black uppercase tracking-widest">Zona de Peligro</span>
                    </div>
                    <h3 className="text-xl font-black text-brand-500 mb-3 tracking-tight">Cerrar mi Cuenta</h3>
                    <p className="text-text-secondary text-sm font-medium mb-8 leading-relaxed">
                      Elimina tu cuenta y todos tus datos de forma permanente.
                    </p>
                    <button className="w-full py-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Borrar Cuenta
                    </button>
                 </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <ConfirmDeleteModal 
        card={pendingDelete} 
        onConfirm={() => { removeMethod(pendingDelete.id); toast.success('Tarjeta eliminada'); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function HiOutlineInformationCircle(props) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
