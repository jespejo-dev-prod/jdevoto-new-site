'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
 Search, 
 ChevronRight,
 LayoutDashboard,
 Menu,
 ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { useDashboard } from '@/app/dashboard/layout';
import { useAuth } from '@/context/auth-context';
import { translateRole } from '@/lib/role-translations';

const segmentMap: Record<string, string> = {
 dashboard: 'Panel',
 orders: 'Pedidos',
 new: 'Nuevo',
 edit: 'Editar',
 products: 'Productos',
 categories: 'Categorías',
 marcas: 'Marcas',
 descuentos: 'Descuentos',
 customers: 'Clientes',
 'my-company': 'Mi Empresa',
 users: 'Equipo',
 pagos: 'Pagos',
 analytics: 'Métricas',
};

export function DashboardHeader() {
 const { setSidebarOpen } = useDashboard();
 const pathname = usePathname();
 const router = useRouter();
 const searchParams = useSearchParams();
 const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
 const { user, logout } = useAuth();
 const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

 useEffect(() => {
 const handleOutsideClick = (e: MouseEvent) => {
 const target = e.target as HTMLElement;
 if (!target.closest('.dashboard-user-dropdown-container')) {
 setIsUserDropdownOpen(false);
 }
 };
 document.addEventListener('mousedown', handleOutsideClick);
 return () => document.removeEventListener('mousedown', handleOutsideClick);
 }, []);

 // Sync search input with URL search param changes
 useEffect(() => {
 setSearchValue(searchParams.get('search') || '');
 }, [searchParams]);

 const handleSearchSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const query = searchValue.trim();
 if (!query) {
 // Clear search if empty
 if (pathname.startsWith('/dashboard/orders')) {
 router.push('/dashboard/orders');
 } else {
 router.push('/dashboard/products');
 }
 return;
 }

 if (pathname.startsWith('/dashboard/orders')) {
 router.push(`/dashboard/orders?search=${encodeURIComponent(query)}`);
 } else {
 router.push(`/dashboard/products?search=${encodeURIComponent(query)}`);
 }
 };

 // Dynamic breadcrumbs generation
 const pathSegments = pathname.split('/').filter(Boolean);
 const breadcrumbs = pathSegments.map((segment, index) => {
 const href = '/' + pathSegments.slice(0, index + 1).join('/');
 
 // Display"Detalle" if segment is an ID (looks like cuid with 25 chars)
 let label = segmentMap[segment] || segment;
 if (segment.length === 25 && /^[a-z0-9]+$/.test(segment)) {
 label = 'Detalle';
 }

 return {
 href,
 label,
 isLast: index === pathSegments.length - 1
 };
 });

 return (
  <header className="h-20 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
  <div className="flex items-center gap-2 text-base min-w-0">
 {/* Toggle Button for mobile viewports (< lg) */}
 <button 
 onClick={() => setSidebarOpen(true)}
 className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer mr-2 shrink-0 active:scale-95"
 title="Abrir menú"
 >
 <Menu className="h-4 w-4" />
 </button>

  {/* Dynamic Desktop Breadcrumbs (visible sm+) */}
  <div className="hidden sm:flex items-center gap-2 text-base min-w-0">
  <LayoutDashboard className="h-5 w-5 text-zinc-500 shrink-0" />
  <Link href="/dashboard" className="text-zinc-500 hover:text-white font-medium whitespace-nowrap transition-colors">
  Home
  </Link>
  {breadcrumbs.map((crumb) => (
  <div key={crumb.href} className="flex items-center gap-2 min-w-0">
  <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
 {crumb.isLast ? (
 <span className="text-white font-semibold whitespace-nowrap truncate">
 {crumb.label}
 </span>
 ) : (
 <Link href={crumb.href} className="text-zinc-500 hover:text-white font-medium whitespace-nowrap transition-colors truncate">
 {crumb.label}
 </Link>
 )}
 </div>
 ))}
 </div>

  {/* Mobile View Title (visible < sm) */}
  <div className="flex sm:hidden items-center text-sm font-black text-white uppercase tracking-widest shrink-0">
 Panel B2B
 </div>
 </div>

 <div className="flex items-center gap-4">
  {/* Contextual Search Input */}
  <form onSubmit={handleSearchSubmit} className="relative w-48 sm:w-72">
  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
  <input 
  type="text"
  placeholder={pathname.startsWith('/dashboard/orders') ?"Buscar pedidos..." :"Buscar productos..."}
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl h-11 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-primary/50 outline-none transition-all"
  />
 </form>

 <div className="h-px w-6 bg-zinc-800 rotate-90 hidden sm:block" />

 <div className="flex items-center gap-2">
 <NotificationBell />
 
 <div className="h-px w-4 bg-zinc-800 rotate-90" />

  {/* Menú de usuario con Dropdown */}
  <div className="relative dashboard-user-dropdown-container flex items-center">
  <button
  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
  className="relative group cursor-pointer flex items-center gap-3 focus:outline-none p-2 rounded-xl hover:bg-zinc-900 transition-colors"
  title="Menú de usuario"
  >
  <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm">
  {user?.firstName?.[0]}{user?.lastName?.[0]}
  </div>
  </div>
  <span className="text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors hidden md:inline-block">
  {user?.firstName}
  </span>
  <ChevronDown className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors hidden md:inline-block" />
  </button>

  {isUserDropdownOpen && (
  <div className="absolute right-0 top-full mt-2 w-72 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 flex flex-col gap-2 z-50 text-left">
  <div className="px-4 py-3 border-b border-zinc-900 mb-2 flex flex-col gap-1">
  <p className="text-base font-bold text-white truncate">
  {user?.firstName} {user?.lastName}
  </p>
  {user?.company?.razonSocial && user?.role !== 'SALES_REP' && user?.role !== 'ADMIN' && (
    <p className="text-sm font-medium text-zinc-400 truncate">{user.company.razonSocial}</p>
  )}
  <p className="text-sm font-medium text-zinc-500 truncate">{user?.email}</p>
  {user?.role && (
    <span className="inline-block mt-1 px-2 py-0.5 bg-zinc-800/80 text-zinc-400 text-[10px] font-bold rounded-md uppercase tracking-wider w-fit">
      {translateRole(user.role)}
    </span>
  )}
  </div>
  
  <Link
  href="/profile"
  className="px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-white font-bold text-base transition-all"
  onClick={() => setIsUserDropdownOpen(false)}
  >
  Mi Perfil
  </Link>
  
  <Link
  href="/"
  className="px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-900/50 hover:text-white font-bold text-base transition-all"
  onClick={() => setIsUserDropdownOpen(false)}
  >
  Ir a la Tienda
  </Link>

  <div className="h-px bg-zinc-900 my-2" />

  <button
  onClick={async () => {
  setIsUserDropdownOpen(false);
  await logout();
  }}
  className="w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-950/20 font-bold text-base transition-all cursor-pointer"
  >
  Cerrar sesión
  </button>
  </div>
  )}
 </div>
 </div>
 </div>
 </header>
 );
}
