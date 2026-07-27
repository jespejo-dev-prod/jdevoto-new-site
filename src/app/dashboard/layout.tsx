'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { QueryProvider } from '@/providers/query-provider';

interface DashboardContextType {
 isSidebarOpen: boolean;
 setSidebarOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType>({
 isSidebarOpen: false,
 setSidebarOpen: () => {},
});

export function useDashboard() {
 return useContext(DashboardContext);
}

export default function DashboardLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const { isAuthenticated, loading } = useAuth();
 const [isSidebarOpen, setSidebarOpen] = useState(false);
 const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Mientras verifica auth, muestra pantalla en negro (sin flash)
  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 flex-col gap-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">{loading ? 'Cargando sesión...' : 'Redirigiendo al login...'}</p>
      </div>
    );
  }

 return (
 <QueryProvider>
 <DashboardContext.Provider value={{ isSidebarOpen, setSidebarOpen }}>
 <div className="flex min-h-screen bg-zinc-950 text-zinc-400 font-sans selection:bg-primary/30 selection:text-primary-foreground relative overflow-x-hidden">
 <Sidebar />
 <div className="flex-1 flex flex-col min-w-0">
 <DashboardHeader />
 <main className="flex-1 flex flex-col min-w-0">
 {children}
 </main>
 </div>
 </div>
 </DashboardContext.Provider>
 </QueryProvider>
 );
}
