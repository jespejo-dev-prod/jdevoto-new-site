'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { ShoppingCart, Users, UserPlus, DollarSign, Loader2, ArrowUpRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { TransactionTable } from '@/components/dashboard/transaction-table';
import { AssignCustomerModal } from '@/modules/customers/presentation/components/AssignCustomerModal';

export function SalesRepDashboard() {
  const { user } = useAuth();
  const { fetcher } = useApi();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['sales-rep-operational-dashboard'],
    queryFn: () => fetcher('/api/dashboard/operational'),
    refetchInterval: 30000,
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  return (
    <>
      {/* Welcome Section */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">¡Hola, {user?.firstName}!</h1>
          <p className="text-sm text-zinc-500">Panel de gestión para Vendedores (Sales Rep).</p>
        </div>
      </div>

      {/* Metrics Section */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-1">Ventas Totales (30d)</p>
                <h3 className="text-2xl font-bold text-white">{formatCurrency(data.metrics.totalRevenue)}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-1">Pedidos (30d)</p>
                <h3 className="text-2xl font-bold text-white">{data.metrics.totalOrders}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-1">Clientes en Cartera</p>
                <h3 className="text-2xl font-bold text-white">{data.metrics.totalCompanies}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {/* Nuevo Pedido */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/40 border border-zinc-800 hover:border-primary/50 transition-colors rounded-2xl p-6 flex flex-col justify-between gap-6 group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Realizar Pedido</h3>
            <p className="text-sm text-zinc-400">Ir al catálogo para realizar pedidos a nombre de tus clientes asignados.</p>
          </div>
          <div className="w-full flex flex-col gap-3">
            <Link href="/dashboard/orders/new" className="w-full">
              <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 text-sm font-bold transition-all shadow-lg shadow-primary/20">
                Realizar Pedido
              </button>
            </Link>
            <Link href="/products" className="w-full">
              <button className="w-full py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 text-sm font-bold transition-all">
                Ir al Catálogo
              </button>
            </Link>
          </div>
        </div>

        {/* Añadir Cliente */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/40 border border-zinc-800 hover:border-sky-500/50 transition-colors rounded-2xl p-6 flex flex-col justify-between gap-6 group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6 text-sky-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Añadir Cliente</h3>
            <p className="text-sm text-zinc-400">Registrar una nueva empresa cliente para poder gestionar sus compras.</p>
          </div>
          <Link href="/dashboard/customers?action=new" className="w-full">
            <button className="w-full py-3 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-sm font-bold transition-all border border-sky-500/20">
              Crear Nuevo Cliente
            </button>
          </Link>
        </div>

        {/* Vincular Cliente Existente */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/40 border border-zinc-800 hover:border-purple-500/50 transition-colors rounded-2xl p-6 flex flex-col justify-between gap-6 group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Vincular Cliente</h3>
            <p className="text-sm text-zinc-400">Busca una empresa que ya existe en el sistema y asígnala a tu cartera.</p>
          </div>
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="w-full py-3 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-sm font-bold transition-all border border-purple-500/20"
          >
            Vincular Existente
          </button>
        </div>

        {/* Ver Cartera */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/40 border border-zinc-800 hover:border-emerald-500/50 transition-colors rounded-2xl p-6 flex flex-col justify-between gap-6 group lg:col-span-3">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Mi Cartera</h3>
            <p className="text-sm text-zinc-400">Ver y gestionar los clientes que tienes asignados actualmente.</p>
          </div>
          <Link href="/dashboard/customers" className="w-full">
            <button className="w-full py-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-bold transition-all border border-emerald-500/20">
              Ver Clientes
            </button>
          </Link>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Pedidos de tu cartera</h2>
        <TransactionTable />
      </div>
      <AssignCustomerModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
      />
    </>
  );
}
