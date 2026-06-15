'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Building2, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { TransactionTable } from '@/components/dashboard/transaction-table';

export function CompanyAdminDashboard() {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">Panel de {companyName}</h1>
          <p className="text-sm text-zinc-500">Administra tus compras y accesos de equipo.</p>
        </div>
        <div className="flex gap-3 flex-wrap shrink-0">
          <Link href="/dashboard/my-company">
            <button className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all border border-zinc-800 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Editar mi Empresa
            </button>
          </Link>
          <Link href="/products">
            <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Nuevo Pedido
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Quick Actions / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-zinc-400 font-semibold text-base">Crédito Disponible</p>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white">
            ${Math.round(Number(user?.company?.creditLimit || 0) - Number(user?.company?.creditUsed || 0)).toLocaleString('es-CL')}
          </h3>
        </div>

        <Link href="/dashboard/orders" className="group">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-36 hover:bg-zinc-800 transition-colors">
            <div className="flex justify-between items-start">
              <p className="text-zinc-400 font-semibold text-base group-hover:text-white transition-colors">Ver Mis Compras</p>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Revisa el estado de tus pedidos recientes.</p>
          </div>
        </Link>

        <Link href="/dashboard/users" className="group">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-36 hover:bg-zinc-800 transition-colors">
            <div className="flex justify-between items-start">
              <p className="text-zinc-400 font-semibold text-base group-hover:text-white transition-colors">Gestionar Equipo</p>
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Agrega o elimina usuarios de tu empresa.</p>
          </div>
        </Link>
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-white mb-4 mt-4">Mis Compras Recientes</h2>
        <TransactionTable />
      </motion.div>
    </>
  );
}
