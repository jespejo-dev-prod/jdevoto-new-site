'use client';

import { useState, useEffect } from 'react';
import { 
  User, Package, MapPin, Building2, Settings, 
  LogOut, ShieldCheck, Key, QrCode, Lock, CheckCircle2,
  Phone, Mail, MapPinned
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, accessToken, loading, logout, refresh } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);

  // User details states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Company details states
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyRazonSocial, setCompanyRazonSocial] = useState('');
  const [companyRut, setCompanyRut] = useState('');
  const [companyGiro, setCompanyGiro] = useState('');

  // Shipping address states
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingNumber, setShippingNumber] = useState('');
  const [shippingApartment, setShippingApartment] = useState('');
  const [shippingCommune, setShippingCommune] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingRegion, setShippingRegion] = useState('');

  // 2FA state from localStorage
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [isSettingUp2fa, setIsSettingUp2fa] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?callbackUrl=/profile');
    }
  }, [user, loading, router]);

  // Sync user details when user context loads
  useEffect(() => {
    if (user) {
      const defaultPhone = user.phone || user.company?.telefono || '+56 9 1234 5678';
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(defaultPhone);

      if (user.company) {
        setCompanyEmail(user.company.email || user.email || '');
        setCompanyPhone(user.company.telefono || user.phone || '+56 9 1234 5678');
        setCompanyRazonSocial(user.company.razonSocial || '');
        setCompanyRut(user.company.rut || '');
        setCompanyGiro(user.company.giro || 'Venta de artículos electrónicos');

        setShippingStreet(user.company.shippingStreet || 'Av. Providencia');
        setShippingNumber(user.company.shippingNumber || '1234');
        setShippingApartment(user.company.shippingApartment || 'Of 502');
        setShippingCommune(user.company.shippingCommune || 'PROVIDENCIA');
        setShippingCity(user.company.shippingCity || 'Santiago');
        setShippingRegion(user.company.shippingRegion || 'METROPOLITANA DE SANTIAGO');
      }

      // Check 2FA status using user.twoFactorSecret
      const is2faActive = !!(user as any).twoFactorSecret;
      setTwoFactorEnabled(is2faActive);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
        <PublicHeader />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">Cargando...</div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone
        })
      });

      if (!res.ok) {
        throw new Error('Error al actualizar tus datos personales.');
      }

      await refresh();
      toast.success('Datos personales actualizados con éxito.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          companyEmail,
          companyPhone
        })
      });

      if (!res.ok) {
        throw new Error('Error al actualizar los datos de la empresa.');
      }

      await refresh();
      toast.success('Datos de la empresa actualizados con éxito.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          shippingStreet,
          shippingNumber,
          shippingApartment,
          shippingCommune,
          shippingCity,
          shippingRegion
        })
      });

      if (!res.ok) {
        throw new Error('Error al actualizar la dirección de despacho.');
      }

      await refresh();
      toast.success('Dirección de despacho corporativa actualizada con éxito.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle2fa = async () => {
    if (twoFactorEnabled) {
      setIsSaving(true);
      try {
        const res = await fetch('/api/profile/2fa/disable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || data.message || 'Error al desactivar 2FA');
        }
        await refresh();
        setTwoFactorEnabled(false);
        setShow2faSetup(false);
        toast.success('Doble factor de autenticación (2FA) desactivado.');
      } catch (err: any) {
        toast.error(err.message || 'Error al desactivar 2FA');
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsSettingUp2fa(true);
      try {
        const res = await fetch('/api/profile/2fa/setup', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || data.message || 'Error al obtener la configuración de 2FA');
        }
        setQrCodeUrl(data.data.qrCodeUrl);
        setSetupSecret(data.data.secret);
        setShow2faSetup(true);
      } catch (err: any) {
        toast.error(err.message || 'Error al iniciar la configuración de 2FA');
      } finally {
        setIsSettingUp2fa(false);
      }
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.trim().length !== 6) {
      toast.error('El código debe ser de 6 dígitos.');
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          secret: setupSecret,
          code: mfaCode,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Código incorrecto o expirado');
      }
      
      await refresh();
      setTwoFactorEnabled(true);
      setShow2faSetup(false);
      setMfaCode('');
      toast.success('¡Doble factor de autenticación (2FA) activado con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al verificar el código de 2FA');
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador de Sistema',
    COMPANY_ADMIN: 'Administrador de Empresa',
    BUYER: 'Comprador Corporativo',
    SALES_REP: 'Representante de Ventas',
  };
  const roleLabel = roleLabels[user.role] || user.role || 'Usuario';

  const SidebarItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
        activeTab === id 
          ? "bg-zinc-900 text-white shadow-xl border border-zinc-800" 
          : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <PublicHeader />

      <main className="flex-grow max-w-[1400px] mx-auto w-full p-6 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* BARRA LATERAL DEL PERFIL */}
          <div className="lg:col-span-3 space-y-6">
             <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[40px] text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-zinc-800 flex items-center justify-center text-primary font-black text-2xl mx-auto shadow-lg shadow-primary/5">
                   {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                 <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tighter">{user.firstName} {user.lastName}</h2>
                    <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider mt-1">{roleLabel}</p>
                    {user.company?.rut && (
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">
                          RUT: {user.company.rut}
                       </p>
                    )}
                 </div>
             </div>

             <div className="bg-zinc-900/20 border border-zinc-900/60 p-4 rounded-[32px] space-y-1">
                <SidebarItem id="account" icon={User} label="Mi Cuenta" />
                {(user.role === 'ADMIN' || user.role === 'COMPANY_ADMIN') && user.company && <SidebarItem id="company" icon={Building2} label="Datos de Empresa" />}
                {(user.role === 'ADMIN' || user.role === 'COMPANY_ADMIN') && user.company && <SidebarItem id="shipping" icon={MapPinned} label="Dirección Despacho" />}
                <SidebarItem id="settings" icon={Settings} label="Seguridad" />
                
                <div className="pt-4 mt-4 border-t border-zinc-900">
                   <button 
                     onClick={logout}
                     className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                   >
                      <LogOut className="h-4 w-4" /> Cerrar Sesión
                   </button>
                </div>
             </div>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="lg:col-span-9">
             {/* PESTAÑA: MI CUENTA */}
             {activeTab === 'account' && (
               <div className="space-y-8">
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Mi Cuenta</h1>
                  
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3 text-sm text-zinc-400">
                    <span className="text-base leading-none">👤</span>
                    <div>
                      <span className="font-bold text-zinc-200 block mb-0.5">Información de Cuenta Personal</span>
                      <p>
                        Estás editando tus datos de contacto personales. Estos datos son únicos de tu cuenta de usuario y no afectan la información legal de facturación de la organización
                        {user?.role === 'COMPANY_ADMIN' ? (
                          <>
                            , la cual puedes gestionar en{' '}
                            <a href="/dashboard/my-company" className="text-primary hover:underline">
                              Mi Empresa
                            </a>.
                          </>
                        ) : (
                          '.'
                        )}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="bg-zinc-900/40 p-8 sm:p-10 rounded-[40px] border border-zinc-800 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Nombre</Label>
                           <Input 
                             type="text" 
                             value={firstName} 
                             onChange={(e) => setFirstName(e.target.value)} 
                             required
                             className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Apellido</Label>
                           <Input 
                             type="text" 
                             value={lastName} 
                             onChange={(e) => setLastName(e.target.value)} 
                             required
                             className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email de Contacto</Label>
                           <Input 
                             type="email" 
                             value={email} 
                             onChange={(e) => setEmail(e.target.value)} 
                             required
                             className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Teléfono</Label>
                           <Input 
                             type="text" 
                             placeholder="+56 9 1234 5678"
                             value={phone} 
                             onChange={(e) => setPhone(e.target.value)} 
                             className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                           />
                        </div>
                     </div>
                     
                     <div className="flex justify-end pt-4">
                        <Button 
                          type="submit" 
                          disabled={isSaving}
                          className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest"
                        >
                          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                     </div>
                  </form>
               </div>
             )}

              {/* PESTAÑA: DATOS DE EMPRESA */}
              {activeTab === 'company' && user.company && (user.role === 'ADMIN' || user.role === 'COMPANY_ADMIN') && (
                <div className="space-y-8">
                   <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Datos de Empresa</h1>
                   
                   <form onSubmit={handleUpdateCompany} className="bg-zinc-900/40 p-8 sm:p-10 rounded-[40px] border border-zinc-800 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Razón Social</Label>
                            <Input 
                              type="text" 
                              value={companyRazonSocial} 
                              disabled
                              className="bg-zinc-900/30 border-zinc-850 text-zinc-400 rounded-xl h-11 cursor-not-allowed select-none"
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">RUT Empresa</Label>
                            <Input 
                              type="text" 
                              value={companyRut} 
                              disabled
                              className="bg-zinc-900/30 border-zinc-850 text-zinc-400 rounded-xl h-11 cursor-not-allowed select-none"
                            />
                         </div>
                         <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Giro Comercial</Label>
                            <Input 
                              type="text" 
                              value={companyGiro} 
                              disabled
                              className="bg-zinc-900/30 border-zinc-850 text-zinc-400 rounded-xl h-11 cursor-not-allowed select-none"
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email de la Empresa</Label>
                            <Input 
                              type="email" 
                              value={companyEmail} 
                              onChange={(e) => setCompanyEmail(e.target.value)} 
                              required
                              className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Teléfono de la Empresa</Label>
                            <Input 
                              type="text" 
                              value={companyPhone} 
                              onChange={(e) => setCompanyPhone(e.target.value)} 
                              className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                            />
                         </div>
                      </div>
                      
                      <div className="flex justify-end pt-4">
                         <Button 
                           type="submit" 
                           disabled={isSaving}
                           className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest"
                         >
                           {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                         </Button>
                      </div>
                   </form>
                </div>
              )}

             {/* PESTAÑA: DIRECCIÓN DESPACHO */}
             {activeTab === 'shipping' && user.company && (user.role === 'ADMIN' || user.role === 'COMPANY_ADMIN') && (
               <div className="space-y-8">
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Dirección de Despacho</h1>
                  
                  {user.company ? (
                    <form onSubmit={handleUpdateShipping} className="bg-zinc-900/40 p-8 sm:p-10 rounded-[40px] border border-zinc-800 space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-2">
                             <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Calle / Avenida</Label>
                             <Input 
                               type="text" 
                               placeholder="Av. Vitacura"
                               value={shippingStreet} 
                               onChange={(e) => setShippingStreet(e.target.value)} 
                               required
                               className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                             />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Número</Label>
                             <Input 
                               type="text" 
                               placeholder="123"
                               value={shippingNumber} 
                               onChange={(e) => setShippingNumber(e.target.value)} 
                               required
                               className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                             />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Depto / Oficina</Label>
                             <Input 
                               type="text" 
                               placeholder="Oficina 402"
                               value={shippingApartment} 
                               onChange={(e) => setShippingApartment(e.target.value)} 
                               className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                             />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Comuna</Label>
                             <Input 
                               type="text" 
                               placeholder="Las Condes"
                               value={shippingCommune} 
                               onChange={(e) => setShippingCommune(e.target.value)} 
                               required
                               className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                             />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Ciudad</Label>
                             <Input 
                               type="text" 
                               placeholder="Santiago"
                               value={shippingCity} 
                               onChange={(e) => setShippingCity(e.target.value)} 
                               required
                               className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                             />
                          </div>
                          <div className="md:col-span-3 space-y-2">
                             <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Región</Label>
                             <Input 
                               type="text" 
                               placeholder="Región Metropolitana"
                               value={shippingRegion} 
                               onChange={(e) => setShippingRegion(e.target.value)} 
                               required
                               className="bg-zinc-900/60 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                             />
                          </div>
                       </div>
                       
                       <div className="flex justify-end pt-4">
                          <Button 
                            type="submit" 
                            disabled={isSaving}
                            className="rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest"
                          >
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                          </Button>
                       </div>
                    </form>
                  ) : (
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-8 text-center text-zinc-400 text-sm">
                      Tu cuenta no tiene asociada ninguna empresa B2B para envíos.
                    </div>
                  )}
               </div>
             )}

             {/* PESTAÑA: SEGURIDAD (MFA / 2FA) */}
             {activeTab === 'settings' && (
               <div className="space-y-8">
                  <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Seguridad</h1>
                  
                  <div className="bg-zinc-900/40 p-8 sm:p-10 rounded-[40px] border border-zinc-800 space-y-8">
                     
                     {/* 2FA Card */}
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
                        <div className="space-y-2 max-w-lg">
                           <div className="flex items-center gap-2.5">
                              <ShieldCheck className={cn("h-6 w-6", twoFactorEnabled ? "text-primary" : "text-zinc-400")} />
                              <h3 className="text-lg font-black text-white uppercase tracking-tight">Autenticación de Doble Factor (2FA)</h3>
                           </div>
                           <p className="text-sm text-zinc-300 leading-relaxed">
                              Añade una capa extra de protección a tu cuenta corporativa. Al iniciar sesión, se te solicitará un código dinámico generado por tu aplicación de autenticación (Google Authenticator, Microsoft Authenticator, etc.).
                           </p>
                        </div>
                        
                        <div className="shrink-0 flex items-center">
                           <Button 
                             onClick={handleToggle2fa} 
                             disabled={isSaving || isSettingUp2fa}
                             variant={twoFactorEnabled ? "destructive" : "default"}
                             className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest h-11"
                           >
                              {isSettingUp2fa ? 'Generando...' : isSaving ? 'Procesando...' : twoFactorEnabled ? 'Desactivar 2FA' : 'Activar 2FA'}
                           </Button>
                        </div>
                     </div>

                     {/* 2FA SETUP FLOW */}
                     {show2faSetup && (
                       <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 space-y-6 max-w-xl mx-auto animate-in zoom-in duration-300">
                          <div className="text-center space-y-2">
                             <h4 className="text-sm font-bold text-white uppercase tracking-wider">Configurar Autenticador</h4>
                             <p className="text-[11px] text-zinc-500">Escanea el código QR con tu aplicación preferida e ingresa el código de 6 dígitos generado.</p>
                          </div>

                          <div className="flex justify-center bg-white p-4 rounded-2xl w-40 h-40 mx-auto shadow-inner">
                             {qrCodeUrl ? (
                               <img src={qrCodeUrl} alt="Código QR de 2FA" className="h-full w-full object-contain" />
                             ) : (
                               <QrCode className="h-full w-full text-zinc-950 animate-pulse" />
                             )}
                          </div>

                          <div className="text-center">
                             <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Clave secreta alternativa:</span>
                             <p className="font-mono text-xs text-primary font-bold tracking-wider mt-1 select-all">{setupSecret || 'Generando clave...'}</p>
                          </div>

                          <form onSubmit={handleVerify2fa} className="space-y-4 max-w-xs mx-auto">
                             <div className="space-y-2 text-center">
                                <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Código de Verificación</Label>
                                <Input 
                                  type="text" 
                                  maxLength={6}
                                  placeholder="123456" 
                                  value={mfaCode}
                                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                  required
                                  className="text-center font-mono text-lg tracking-[0.3em] bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 focus:border-primary/50 outline-none"
                                />
                             </div>
                             
                             <div className="flex gap-3 pt-2">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  disabled={isSaving}
                                  onClick={() => setShow2faSetup(false)} 
                                  className="w-1/2 rounded-xl text-zinc-400 hover:text-white"
                                >
                                   Cancelar
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={isSaving}
                                  className="w-1/2 rounded-xl"
                                >
                                   {isSaving ? 'Verificando...' : 'Verificar'}
                                </Button>
                             </div>
                          </form>
                       </div>
                     )}

                     {/* Password Update Card */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                           <Key className="h-6 w-6 text-zinc-400" />
                           <h3 className="text-lg font-black text-white uppercase tracking-tight">Claves de Acceso</h3>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed max-w-lg">
                           Las credenciales de acceso se sincronizan con las directivas corporativas de tu empresa. Si deseas restablecer tu clave o si detectas actividad inusual, puedes solicitar un enlace de restablecimiento.
                        </p>
                        <div className="pt-2">
                           <Link href="/forgot-password">
                             <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest h-11">
                                Restablecer Contraseña
                             </Button>
                           </Link>
                        </div>
                     </div>

                  </div>
               </div>
             )}
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
