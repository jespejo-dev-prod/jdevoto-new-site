'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  ChevronRight,
  LayoutDashboard,
  Menu
} from 'lucide-react';
import Link from 'next/link';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { useDashboard } from '@/app/dashboard/layout';

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
    
    // Display "Detalle" if segment is an ID (looks like cuid with 25 chars)
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
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm min-w-0">
        {/* Toggle Button for mobile viewports (< lg) */}
        <button 
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer mr-2 shrink-0 active:scale-95"
          title="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Dynamic Desktop Breadcrumbs (visible sm+) */}
        <div className="hidden sm:flex items-center gap-2 text-sm min-w-0">
          <LayoutDashboard className="h-4 w-4 text-zinc-500 shrink-0" />
          <Link href="/dashboard" className="text-zinc-500 hover:text-white font-medium whitespace-nowrap transition-colors">
            Home
          </Link>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.href} className="flex items-center gap-2 min-w-0">
              <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />
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
        <div className="flex sm:hidden items-center text-xs font-black text-white uppercase tracking-widest shrink-0">
          Panel B2B
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Contextual Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-40 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input 
            type="text"
            placeholder={pathname.startsWith('/dashboard/orders') ? "Buscar pedidos..." : "Buscar productos..."}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl h-9 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-primary/50 outline-none transition-all"
          />
        </form>

        <div className="h-px w-6 bg-zinc-800 rotate-90 hidden sm:block" />

        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
