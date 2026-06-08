'use client';

import { useState, useEffect } from 'react';
import { useOrders } from '@/modules/orders/presentation/hooks/useOrders';
import { OrderTable } from '@/modules/orders/presentation/components/OrderTable';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Loader2, 
  LayoutGrid, 
  List,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck
} from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

const TABS = [
  { id: '', label: 'Todas', icon: ShoppingBag },
  { id: OrderStatus.DRAFT, label: 'Borradores', icon: LayoutGrid },
  { id: OrderStatus.PENDING, label: 'En espera', icon: Clock },
  { id: OrderStatus.CONFIRMED, label: 'Confirmados', icon: CheckCircle2 },
  { id: OrderStatus.PROCESSING, label: 'En proceso', icon: List },
  { id: OrderStatus.SHIPPED, label: 'Enviados', icon: Truck },
  { id: OrderStatus.DELIVERED, label: 'Completados', icon: CheckCircle2 },
  { id: OrderStatus.CANCELLED, label: 'Cancelados', icon: XCircle },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useOrders({ 
    page, 
    status: activeTab,
    limit: 10,
    search: debouncedSearch,
    from: fromDate ? new Date(fromDate) : undefined,
    to: toDate ? new Date(toDate) : undefined,
  });

  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Pedidos B2B
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">
            Gestiona el ciclo de vida de las órdenes de tus clientes. 
            {meta && <span className="ml-2 text-primary/50 text-[10px] tracking-widest uppercase">Total DB: {meta.total}</span>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders/new">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Nuevo Pedido
            </button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-zinc-900/20 p-4 rounded-3xl border border-zinc-800/50">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Buscar por # de pedido o cliente..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-xs text-white focus:border-primary/50 outline-none transition-all"
          />
        </div>
        
        <div className="md:col-span-7 flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 h-12">
            <Clock className="h-4 w-4 text-zinc-500" />
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="bg-transparent text-xs text-zinc-400 focus:text-white outline-none w-full"
            />
            <span className="text-zinc-700 font-bold">—</span>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="bg-transparent text-xs text-zinc-400 focus:text-white outline-none w-full"
            />
          </div>
          
          {(searchTerm || fromDate || toDate) && (
            <button 
              onClick={() => { setSearchTerm(''); setFromDate(''); setToDate(''); setPage(1); }}
              className="px-4 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/40 p-1 rounded-2xl border border-zinc-800 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as OrderStatus | '');
                setPage(1);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                isActive 
                  ? "bg-zinc-800 text-primary shadow-lg shadow-black/20" 
                  : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {isActive && meta && (
                <span className="ml-1 bg-primary/10 px-1.5 py-0.5 rounded-md text-[10px]">
                  {meta.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Listado */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Consultando registros...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <OrderTable orders={orders} />
          
          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Mostrando página {meta.page} de {meta.totalPages} ({meta.total} pedidos)
              </p>
              <div className="flex gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 disabled:opacity-50 hover:text-white transition-all"
                >
                  Anterior
                </button>
                <button 
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 disabled:opacity-50 hover:text-white transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
