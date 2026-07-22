'use client';

import { useAnalytics } from '@/modules/analytics/presentation/hooks/useAnalytics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, Package, Loader2, Calendar
} from 'lucide-react';
import { STATUS_CONFIG } from '@/modules/orders/presentation/components/OrderStatusBadge';

const COLORS = ['#D4FF00', '#27272a', '#3f3f46', '#52525b', '#71717a'];

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Calculando métricas...</p>
      </div>
    );
  }

  if (!stats) return null;

  const { summary, dailySales, statusDistribution, topCustomers } = stats;

  return (
    <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Analítica de Negocio
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">Visualiza el rendimiento de tus ventas en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <Calendar className="h-4 w-4" />
          Últimos 30 días
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ingresos Totales" 
          value={summary.revenue} 
          prefix="$"
          trend={summary.revenueGrowth} 
          icon={DollarSign}
        />
        <StatCard 
          title="Pedidos Totales" 
          value={summary.ordersCount} 
          icon={ShoppingCart}
        />
        <StatCard 
          title="Ticket Promedio" 
          value={summary.avgOrderValue} 
          prefix="$"
          icon={Package}
        />
        <StatCard 
          title="Tasa de Crecimiento" 
          value={summary.revenueGrowth} 
          prefix=""
          suffix="%"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-8 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[32px] space-y-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Tendencia de Ventas Diarias
          </h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px' }}
                  itemStyle={{ color: '#D4FF00', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#D4FF00" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Trend Summary */}
          <div className="mt-6 flex items-center justify-around border-t border-zinc-800 pt-6">
            <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Venta Máxima</p>
              <p className="text-xl font-black text-white">
                ${dailySales.length > 0 ? Math.max(...dailySales.map((d: any) => d.total)).toLocaleString('es-CL') : '0'}
              </p>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Venta Promedio</p>
              <p className="text-xl font-black text-white">
                ${dailySales.length > 0 ? Math.round(dailySales.reduce((a: any, b: any) => a + b.total, 0) / dailySales.length).toLocaleString('es-CL') : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="lg:col-span-4 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[32px] flex flex-col shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-6">Estado de Pedidos</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px' }}
                  formatter={(value: any, name: any) => [value, STATUS_CONFIG[name as keyof typeof STATUS_CONFIG]?.label || name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Numeric Summary for Status */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            {statusDistribution.map((s: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[9px] font-bold uppercase tracking-tight text-zinc-500">
                    {STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG]?.label || s.status}
                  </span>
                </div>
                <span className="text-[10px] font-black text-white">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {/* Top Customers */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[32px] shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Ranking de Clientes (Top 5)
            </h3>
          </div>
          <div className="space-y-4">
            {topCustomers.map((customer: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-primary font-bold text-lg">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{customer.name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{customer.orders} Pedidos realizados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">${customer.revenue.toLocaleString('es-CL')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-primary/5 border border-primary/20 p-8 rounded-[32px] flex flex-col justify-center items-center text-center space-y-4 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <TrendingUp className="h-48 w-48 text-primary" />
          </div>
          <div className="h-16 w-16 bg-primary text-black rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20">
            <DollarSign className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Próximo Nivel: ML</h3>
          <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
            Estamos listos para integrar modelos de **Machine Learning** que predigan tus ventas futuras basándose en este historial. 
          </p>
          <button className="px-8 py-3 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary transition-all mt-4">
            Explorar Predicciones
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon, prefix = '', suffix = '' }: any) {
  const formattedValue = typeof value === 'number' 
    ? `${prefix}${Math.round(value).toLocaleString('es-CL')}${suffix}`
    : value;

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[28px] space-y-3 shadow-xl hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between">
        <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(Math.round(trend))}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-white mt-1 truncate">{formattedValue}</p>
      </div>
    </div>
  );
}
