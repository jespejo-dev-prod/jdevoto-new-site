'use client';

import { useEffect } from 'react';
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
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/app/dashboard/layout';

const menuItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: PieChart, label: 'Sales Overview', href: '/dashboard/sales' },
  { icon: ClipboardList, label: 'Top Products', href: '/dashboard/top-products' },
  { icon: Layers, label: 'Stock Status', href: '/dashboard/stock' },
];

const mainItems = [
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { 
    icon: Package, 
    label: 'Products', 
    href: '/dashboard/products',
    subItems: [
      { label: 'Product List', href: '/dashboard/products' },
      { label: 'Actualizar Catálogo (CSV/Excel)', href: '/dashboard/products/import-stock' },
      { label: 'Product', href: '/dashboard/products/new' },
      { label: 'Category', href: '/dashboard/categories' },
    ]
  },
  { icon: Tag, label: 'Categorías', href: '/dashboard/categories' },
  { icon: Shield, label: 'Marcas', href: '/dashboard/marcas' },
  { icon: Ticket, label: 'Descuentos', href: '/dashboard/descuentos' },
  { icon: ShoppingCart, label: 'Orders', href: '/dashboard/orders' },
  { icon: Building2, label: 'Customers', href: '/dashboard/customers' },
  { icon: Building2, label: 'My Company', href: '/dashboard/my-company' },
  { icon: Users, label: 'Team', href: '/dashboard/users' },
  { icon: CreditCard, label: 'Pagos', href: '/dashboard/pagos' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isSidebarOpen, setSidebarOpen } = useDashboard();
  
  // Close sidebar on mobile when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const filteredMenuItems = menuItems.filter(item => {
    if (user?.role === "BUYER" || user?.role === "COMPANY_ADMIN") {
      return item.label === "Home";
    }
    return true;
  });

  const filteredMainItems = mainItems.filter(item => {
    if (user?.role === "BUYER") {
      return item.label === "Orders";
    }
    if (user?.role === "COMPANY_ADMIN") {
      return item.label === "Orders" || item.label === "Team" || item.label === "My Company";
    }
    // Descuentos solo para ADMIN
    if (item.label === "Descuentos" && user?.role !== "ADMIN") return false;
    // Pagos solo para ADMIN
    if (item.label === "Pagos" && user?.role !== "ADMIN") return false;
    // Team y My Company solo para ADMIN o COMPANY_ADMIN
    if ((item.label === "Team" || item.label === "My Company") && user?.role !== "ADMIN") return false;
    return true;
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 px-2 mb-8">
          <img 
            src="https://www.jdevoto.cl/wp-content/uploads/2024/06/logo-svg.png" 
            alt="JDevoto Logo" 
            className="h-10 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        <nav className="space-y-6">
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">Main Menu</span>
            </div>
            <ul className="space-y-1">
              {filteredMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-zinc-900 text-white shadow-sm" 
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-zinc-500")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">Management</span>
            </div>
            <ul className="space-y-1">
              {filteredMainItems.map((item) => (
                <li key={item.label} className="space-y-1">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      pathname === item.href 
                        ? "bg-zinc-900 text-white" 
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.subItems && <ChevronRight className={cn("h-3 w-3 transition-transform", pathname.startsWith(item.href) && "rotate-90")} />}
                  </Link>
                  
                  {item.subItems && pathname.startsWith(item.href) && (
                    <ul className="ml-9 space-y-1 border-l border-zinc-800 pl-4 py-1">
                      {item.subItems.map((sub) => (
                        <li key={sub.label}>
                          <Link 
                            href={sub.href}
                            className={cn(
                              "block py-1.5 text-xs font-medium transition-colors",
                              pathname === sub.href ? "text-primary" : "text-zinc-600 hover:text-zinc-400"
                            )}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        
        <div className="rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-4 text-center hidden xs:block">
          <p className="text-[11px] font-bold text-white mb-1">¿Necesitas ayuda?</p>
          <p className="text-[10px] text-zinc-500 mb-3">Agenda una llamada con nuestro equipo.</p>
          <button className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-semibold transition-colors border border-zinc-700">
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full z-50 overflow-y-auto animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
