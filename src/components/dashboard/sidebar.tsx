'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
 Home, 
 BarChart3, 
 Package, 
 ShoppingCart, 
 Users, 
 LogOut, 
 ChevronRight,
 Layers,
 PieChart,
 Tag,
 ClipboardList,
 Shield,
 Building2,
 Ticket,
 CreditCard,
 X,
 Sliders,
 Mail,
 Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/app/dashboard/layout';

const menuItems = [
 { icon: Home, label: 'Inicio', href: '/dashboard' },
 { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/analytics' },
];

const mainItems = [
 { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/analytics' },
 { 
 icon: Package, 
 label: 'Productos', 
 href: '/dashboard/products',
 subItems: [
 { label: 'Lista de Productos', href: '/dashboard/products' },
 { label: 'Actualizar Catálogo (CSV/Excel)', href: '/dashboard/products/import-stock' },
 { label: 'Nuevo Producto', href: '/dashboard/products/new' },
 { label: 'Categorías', href: '/dashboard/categories' },
 ]
 },
 { icon: Tag, label: 'Categorías', href: '/dashboard/categories' },
 { icon: Shield, label: 'Marcas', href: '/dashboard/marcas' },
 { icon: Ticket, label: 'Descuentos', href: '/dashboard/descuentos' },
 { icon: ShoppingCart, label: 'Pedidos', href: '/dashboard/orders' },
 { icon: Building2, label: 'Clientes', href: '/dashboard/customers' },
 { icon: Building2, label: 'Mi Empresa', href: '/dashboard/my-company' },
 { icon: Users, label: 'Equipo', href: '/dashboard/users' },
 { icon: Briefcase, label: 'Vendedores', href: '/dashboard/vendedores' },
 { icon: CreditCard, label: 'Pagos', href: '/dashboard/pagos' },
 { icon: CreditCard, label: 'Cuenta Corriente', href: '/dashboard/cuenta-corriente' },
 { icon: Sliders, label: 'Slider Home', href: '/dashboard/slider' },
 { icon: Mail, label: 'Emails Masivos', href: '/dashboard/emails' },
];

export function Sidebar() {
 const pathname = usePathname();
 const { user, logout } = useAuth();
 const { isSidebarOpen, setSidebarOpen } = useDashboard();
 
 const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

 // Close sidebar on mobile when navigating
 useEffect(() => {
 setSidebarOpen(false);
 }, [pathname, setSidebarOpen]);

 useEffect(() => {
   mainItems.forEach(item => {
     if (item.subItems && pathname.startsWith(item.href)) {
       setOpenMenus(prev => ({ ...prev, [item.label]: true }));
     }
   });
 }, [pathname]);

 const toggleMenu = (e: React.MouseEvent, label: string) => {
   e.preventDefault();
   setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
 };

 const filteredMenuItems = menuItems.filter(item => {
 if (user?.role ==="BUYER" || user?.role ==="COMPANY_ADMIN") {
 return item.label ==="Inicio";
 }
 return true;
 });

 const filteredMainItems = mainItems.filter(item => {
 if (user?.role ==="BUYER") {
 return item.label ==="Pedidos" || item.label ==="Cuenta Corriente";
 }
 if (user?.role ==="COMPANY_ADMIN") {
 return item.label ==="Pedidos" || item.label ==="Equipo" || item.label ==="Mi Empresa" || item.label ==="Cuenta Corriente";
 }
 // Cuenta Corriente visible para ADMIN (BUYER y COMPANY_ADMIN tienen su logica arriba)
 if (item.label ==="Cuenta Corriente") {
   return user?.role ==="ADMIN";
 }
 // Slider Home solo para ADMIN
 if (item.label ==="Slider Home" && user?.role !=="ADMIN") return false;
 // Descuentos solo para ADMIN
 if (item.label ==="Descuentos" && user?.role !=="ADMIN") return false;
 // Pagos solo para ADMIN
 if (item.label ==="Pagos" && user?.role !=="ADMIN") return false;
 // My Company no es para ADMIN (ya está cubierto COMPANY_ADMIN arriba)
 if (item.label ==="Mi Empresa") return false;
 // Team solo para ADMIN o COMPANY_ADMIN
 if (item.label === 'Equipo' && user?.role !== 'ADMIN') return false;
 // Vendedores solo para ADMIN
 if (item.label === 'Vendedores' && user?.role !== 'ADMIN') return false;
 // Emails Masivos solo para ADMIN
 if (item.label === 'Emails Masivos' && user?.role !== 'ADMIN') return false;

  // SALES_REP no debe ver las siguientes pestañas
  if (user?.role === 'SALES_REP') {
    if (['Productos', 'Categorías', 'Marcas'].includes(item.label)) {
      return false;
    }
  }

 return true;
 });

 const sidebarContent = (
 <div className="flex flex-col h-full bg-zinc-950">
 <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
 <Link href="/" className="flex items-center gap-3 px-2 mb-8 w-fit hover:opacity-85 transition-opacity">
 <img 
 src="/home/devoto.png" 
 alt="JDevoto Logo" 
 className="h-12 w-auto"
 />
 </Link>

 <nav className="space-y-6">
 <div>
 <div className="px-3 mb-3 flex items-center justify-between">
 <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Menú Principal</span>
 </div>
 <ul className="space-y-1">
 {filteredMenuItems.map((item) => {
 const isActive = pathname === item.href;
 return (
 <li key={item.label}>
 <Link
 href={item.href}
 className={cn(
"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
 isActive 
 ?"bg-zinc-900 text-white shadow-sm" 
 :"text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
 )}
 >
 <item.icon className={cn("h-5 w-5", isActive ?"text-primary" :"text-zinc-500")} />
 {item.label}
 </Link>
 </li>
 );
 })}
 </ul>
 </div>

 <div>
 <div className="px-3 mb-3 flex items-center justify-between">
 <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Gestión</span>
 </div>
 <ul className="space-y-1">
 {filteredMainItems.map((item) => {
    const label = item.label === 'Clientes' && user?.role === 'SALES_REP' ? 'Mis Clientes' : item.label;
    const isActive = pathname === item.href;
    
    return (
    <li key={item.label} className="space-y-1">
 {item.subItems ? (
 <button
 onClick={(e) => toggleMenu(e, item.label)}
 className={cn(
"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
 pathname.startsWith(item.href)
 ?"bg-zinc-900 text-white" 
 :"text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
 )}
 >
 <item.icon className="h-5 w-5 shrink-0" />
  <span className="flex-1 text-left">{label}</span>
 <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", openMenus[item.label] &&"rotate-90")} />
 </button>
 ) : (
 <Link
 href={item.href}
 className={cn(
"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
 isActive 
 ?"bg-zinc-900 text-white" 
 :"text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
 )}
 >
 <item.icon className="h-5 w-5 shrink-0" />
  <span className="flex-1 text-left">{label}</span>
 </Link>
 )}
 
 {item.subItems && openMenus[item.label] && (
 <ul className="ml-9 space-y-1.5 border-l border-zinc-800 pl-4 py-2">
 {item.subItems.map((sub) => (
 <li key={sub.label}>
 <Link 
 href={sub.href}
 className={cn(
"block py-1 text-sm font-bold transition-colors",
 pathname === sub.href ?"text-primary" :"text-zinc-500 hover:text-zinc-300"
 )}
 >
 {sub.label}
 </Link>
 </li>
 ))}
 </ul>
 )}
 </li>
 );
 })}
 </ul>
 </div>
 </nav>
 </div>

 <div className="mt-auto p-4 border-t border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm shrink-0">
 <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-4 text-center hidden xs:block">
 <p className="text-xs font-bold text-white mb-1">¿Necesitas ayuda?</p>
 <p className="text-[11px] font-medium text-zinc-500 mb-3">Agenda una llamada con nuestro equipo.</p>
 <button className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors border border-zinc-700">
 Agendar llamada
 </button>
 </div>
 </div>
 </div>
 );

 return (
 <>
 {/* Desktop Sidebar (visible only on lg and larger screen sizes) */}
 <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex-col h-screen sticky top-0 overflow-y-auto hidden lg:flex shrink-0">
 {sidebarContent}
 </aside>

 {/* Mobile Sidebar Drawer (visible only on viewports < lg) */}
 {isSidebarOpen && (
 <div className="fixed inset-0 z-50 lg:hidden flex">
 <div 
 className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
 onClick={() => setSidebarOpen(false)}
 />
 <aside className="relative w-full bg-zinc-950 flex flex-col h-full z-50 overflow-y-auto">
 <button 
 onClick={() => setSidebarOpen(false)}
 className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors p-2 z-50"
 aria-label="Cerrar menú"
 >
 <X className="h-6 w-6" />
 </button>
 {sidebarContent}
 </aside>
 </div>
 )}
 </>
 );
}
