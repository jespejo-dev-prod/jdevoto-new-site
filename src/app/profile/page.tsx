'use client';

import { useState } from 'react';
import { 
  User, Package, MapPin, Building2, Settings, 
  LogOut, ChevronRight, Search, ShoppingCart, 
  CheckCircle2, Clock, Truck, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('orders');

  const orders = [
    { id: 'AG-29384', date: '18 Mar 2026', total: 1761.16, status: 'En Tránsito', icon: Truck, color: 'text-blue-500' },
    { id: 'AG-28102', date: '05 Mar 2026', total: 450.00, status: 'Entregado', icon: CheckCircle2, color: 'text-green-500' },
    { id: 'AG-27591', date: '12 Feb 2026', total: 2890.50, status: 'Procesando', icon: Clock, color: 'text-orange-500' }
  ];

  const SidebarItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
        activeTab === id ? "bg-zinc-950 text-white shadow-xl shadow-zinc-950/20" : "text-zinc-400 hover:bg-zinc-100"
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      
      {/* HEADER */}
      <nav className="bg-zinc-950 text-white p-4 px-8 flex items-center justify-between border-b border-zinc-800 shadow-md">
         <Link href="/" className="text-2xl font-black italic tracking-tighter">antigravity<span className="text-primary">.</span></Link>
         <div className="flex items-center gap-8">
            <Link href="/cart" className="relative group cursor-pointer text-zinc-400 hover:text-primary transition-colors">
               <ShoppingCart className="h-6 w-6" />
            </Link>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-zinc-950 font-black text-xs shadow-lg">TP</div>
         </div>
      </nav>

      <main className="flex-grow max-w-[1400px] mx-auto w-full p-6 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* SIDEBAR DE PERFIL */}
           <div className="lg:col-span-3 space-y-2">
              <div className="p-8 mb-6 text-center space-y-4">
                 <div className="w-24 h-24 rounded-full bg-zinc-200 mx-auto flex items-center justify-center border-4 border-white shadow-xl">
                    <User className="h-12 w-12 text-zinc-400" />
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Tomás Pérez</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gestor de Compras B2B</p>
                 </div>
              </div>
              <SidebarItem id="orders" icon={Package} label="Mis Pedidos" />
              <SidebarItem id="company" icon={Building2} label="Datos Empresa" />
              <SidebarItem id="address" icon={MapPin} label="Direcciones" />
              <SidebarItem id="settings" icon={Settings} label="Seguridad" />
              <div className="pt-8 mt-8 border-t border-zinc-200">
                 <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all">
                    <LogOut className="h-4 w-4" /> Cerrar Sesión
                 </button>
              </div>
           </div>

           {/* CONTENIDO PRINCIPAL */}
           <div className="lg:col-span-9">
              {activeTab === 'orders' && (
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Historial de Pedidos</h1>
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300" />
                         <Input placeholder="Buscar pedido..." className="pl-10 rounded-xl h-10 w-64 bg-white border-zinc-200" />
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-white p-6 rounded-[32px] border border-zinc-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                           <div className="flex items-center gap-6">
                              <div className="h-14 w-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                                 <Package className="h-6 w-6" />
                              </div>
                              <div className="space-y-1">
                                 <div className="text-sm font-black text-zinc-900 uppercase">Orden #{order.id}</div>
                                 <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fecha: {order.date}</div>
                              </div>
                           </div>
                           <div className="flex items-center gap-12">
                              <div className="text-right">
                                 <div className="text-sm font-black text-zinc-900">${order.total.toLocaleString()}</div>
                                 <div className={cn("text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 justify-end", order.color)}>
                                    <order.icon className="h-3 w-3" /> {order.status}
                                 </div>
                              </div>
                              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100"><ChevronRight className="h-5 w-5" /></Button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'company' && (
                <div className="space-y-8">
                   <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Información Corporativa</h1>
                   <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Razón Social</Label>
                         <p className="text-sm font-black text-zinc-900">Tech Chile SpA</p>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">RUT Empresa</Label>
                         <p className="text-sm font-black text-zinc-900">77.293.483-K</p>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dirección Comercial</Label>
                         <p className="text-sm font-black text-zinc-900">Av. Vitacura 456, Oficina 102, Las Condes</p>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Crédito Disponible</Label>
                         <p className="text-sm font-black text-primary">$15,000,000 CLP</p>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8 text-center py-20">
                   <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Settings className="h-10 w-10 text-zinc-300" />
                   </div>
                   <h2 className="text-xl font-bold text-zinc-900">Configuración de Seguridad</h2>
                   <p className="text-sm text-zinc-500 max-w-sm mx-auto">Aquí podrás gestionar tus claves de acceso y la autenticación en dos pasos (2FA).</p>
                   <Button className="rounded-xl px-10">Actualizar Contraseña</Button>
                </div>
              )}
           </div>

        </div>
      </main>

      <footer className="bg-zinc-950 text-white py-12 px-12 border-t border-zinc-800 mt-auto">
         <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <span>© 2026 Antigravity Technology Chile Ltd.</span>
            <div className="flex gap-8">
               <span className="hover:text-primary cursor-pointer transition-colors">Soporte B2B</span>
               <span className="hover:text-primary cursor-pointer transition-colors">Privacidad</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
