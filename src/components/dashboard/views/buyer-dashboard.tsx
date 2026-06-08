'use client';

import { motion } from 'framer-motion';
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
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">¡Hola, {user?.firstName}!</h1>
          <p className="text-sm text-zinc-500">Comprando a nombre de {companyName}.</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/40 border border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">¿Listo para hacer un nuevo pedido?</h3>
            <p className="text-sm text-zinc-400">Explora nuestro catálogo B2B y aprovecha los precios exclusivos para tu empresa.</p>
          </div>
          <Link href="/products">
            <button className="px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Ir al Catálogo
            </button>
          </Link>
        </div>
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-white mb-4 mt-4">Tus Compras Recientes</h2>
        <TransactionTable />
      </motion.div>
    </>
  );
}
