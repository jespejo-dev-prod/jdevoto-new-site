'use client';

import { 
  Search, 
  ChevronRight,
  LayoutDashboard,
  UserPlus,
  Menu
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { useDashboard } from '@/app/dashboard/layout';

export function DashboardHeader() {
  const { user } = useAuth();
  const { setSidebarOpen } = useDashboard();

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-35 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm min-w-0">
        {/* Toggle Button for mobile viewports (< lg) */}
        <button 
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer mr-2 shrink-0 active:scale-95"
          title="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Desktop Breadcrumbs (visible sm+) */}
        <div className="hidden sm:flex items-center gap-2 text-sm min-w-0">
          <LayoutDashboard className="h-4 w-4 text-zinc-500 shrink-0" />
          <span className="text-zinc-500 font-medium whitespace-nowrap">Home</span>
          <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />
          <span className="text-zinc-500 font-medium whitespace-nowrap">Dashboard</span>
          <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />
          <span className="text-white font-semibold whitespace-nowrap truncate">Analytics</span>
        </div>

        {/* Mobile View Title (visible < sm) */}
        <div className="flex sm:hidden items-center text-xs font-black text-white uppercase tracking-widest shrink-0">
          Panel B2B
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden md:flex items-center gap-2 mr-4">
          <div className="flex -space-x-2 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="inline-block h-7 w-7 rounded-full ring-2 ring-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 border border-zinc-700">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-zinc-950 bg-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-500 border border-zinc-800">
              +9
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold transition-colors border border-zinc-700">
            <UserPlus className="h-3 w-3" />
            Invite
          </button>
          <NotificationBell />
        </div>

        <div className="h-px w-6 bg-zinc-800 rotate-90 hidden sm:block" />

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Buscar">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
