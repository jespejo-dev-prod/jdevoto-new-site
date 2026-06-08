'use client';

import { Wallet, Package, TrendingUp, CreditCard } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts';
import { TransactionTable } from '@/components/dashboard/transaction-table';
import { motion } from 'framer-motion';

const generateData = (base: number) => 
  Array.from({ length: 10 }, () => ({ value: base + Math.random() * 20 }));

export function AdminDashboard() {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">Panel de Control (Admin)</h1>
          <p className="text-sm text-zinc-500">Bienvenido al centro de operaciones de la plataforma B2B.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all border border-zinc-800">
            Descargar Reporte
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Nominal Balance"
          value="7,500.00"
          unit="USD"
          change="1.19%"
          trend="up"
          icon={Wallet}
          data={generateData(50)}
        />
        <StatsCard 
          title="Total Stock Product"
          value="3,142"
          unit="ITEMS"
          change="0.29%"
          trend="up"
          icon={Package}
          data={generateData(30)}
        />
        <StatsCard 
          title="Nominal Revenue"
          value="21,430.00"
          unit="USD"
          change="0.29%"
          trend="up"
          icon={TrendingUp}
          data={generateData(80)}
        />
        <StatsCard 
          title="Nominal Expense"
          value="12,980.00"
          unit="USD"
          change="0.15%"
          trend="down"
          icon={CreditCard}
          data={generateData(40)}
        />
      </div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnalyticsCharts />
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <TransactionTable />
      </motion.div>
    </>
  );
}
