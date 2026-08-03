'use client';


import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { TransactionTable } from '@/components/dashboard/transaction-table';

export function BuyerDashboard() {
  const { user } = useAuth();
  const companyName = user?.company?.razonSocial || "tu empresa";

  return (
    <>
      {/* Welcome Section */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">¡Hola, {user?.firstName}!</h1>
          <p className="text-sm text-zinc-500">Comprando a nombre de {companyName}.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/40 border border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">¿Listo para hacer un nuevo pedido?</h3>
            <p className="text-sm text-zinc-400">Explora nuestro catálogo B2B y aprovecha los precios exclusivos para tu empresa.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/orders/new">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Realizar Pedido
              </button>
            </Link>
            <Link href="/products">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 text-sm font-bold transition-all flex items-center justify-center gap-2">
                Ir al Catálogo
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 mt-4">Tus Compras Recientes</h2>
        <TransactionTable />
      </div>
    </>
  );
}
