'use client';

import { useState, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Search, 
  Filter, 
  Download,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export function TransactionTable() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !accessToken) return;
    
    // Fetch last 5 orders for this user/company
    fetch('/api/orders?limit=5', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setOrders(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'CONFIRMED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PROCESSING': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'SHIPPED': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'DELIVERED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      PROCESSING: 'En Proceso',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
      REJECTED: 'Rechazado'
    };
    return labels[status] || status;
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Mis Pedidos <span className="text-zinc-500 font-medium">{orders.length}</span>
          </h3>
          <p className="text-sm text-zinc-500">Últimos pedidos realizados en la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="pl-8 pr-4 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-700 w-40"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[200px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2">
            <p className="text-sm font-medium">No hay pedidos recientes</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-zinc-400 uppercase tracking-wider bg-zinc-950/50">
                <th className="px-6 py-4">N° Pedido</th>
                <th className="px-6 py-4">Detalle</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {orders.map((tx) => (
                <tr 
                  key={tx.id} 
                  onClick={() => router.push(`/dashboard/orders/${tx.id}`)}
                  className="text-sm group hover:bg-zinc-800/20 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-zinc-800/50 text-zinc-500 group-hover:text-primary transition-colors">
                        <ChevronRight className="h-3 w-3" />
                      </div>
                      <span className="text-zinc-300 font-bold">{tx.orderNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-semibold text-sm">{tx.companyName}</p>
                      <p className="text-xs text-sky-400 font-bold mt-0.5">{tx.itemCount} producto{tx.itemCount !== 1 ? 's' : ''}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-primary text-[15px]">
                    ${Number(tx.totalGross).toLocaleString('es-CL')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider ${getStatusColor(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 font-medium">
                    {new Date(tx.createdAt).toLocaleDateString('es-CL', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="p-4 bg-zinc-950/30 border-t border-zinc-800/50 text-center">
        <a href="/dashboard/orders" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
          Ver todas las transacciones
        </a>
      </div>
    </div>
  );
}
