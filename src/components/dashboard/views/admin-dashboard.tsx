'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { 
  ShoppingCart, 
  Building2, 
  TrendingUp, 
  Package, 
  Loader2, 
  AlertTriangle,
  Plus,
  ArrowRight,
  Database,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderStatusBadge } from '@/modules/orders/presentation/components/OrderStatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AdminDashboard() {
  const { fetcher } = useApi();
  const router = useRouter();
  
  const { data, isLoading } = useQuery({
    queryKey: ['operational-dashboard'],
    queryFn: () => fetcher('/api/dashboard/operational'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando panel operativo...</p>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, recentOrders = [], lowStockProducts = [] } = data;

  return (
    <div className="space-y-8">
      
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Centro de Mando Operativo
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">Gestión en tiempo real de pedidos, stock y clientes corporativos.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ventas (Últimos 30 días)" 
          value={formatCurrency(metrics.totalRevenue)} 
          description="Suma neta de pedidos activos"
          icon={TrendingUp}
          color="text-primary"
        />
        <StatCard 
          title="Pedidos Recibidos" 
          value={metrics.totalOrders} 
          description="Órdenes totales último período"
          icon={ShoppingCart}
          color="text-blue-500"
        />
        <StatCard 
          title="Stock Crítico" 
          value={metrics.lowStockCount} 
          description="Productos con bajo stock"
          icon={AlertTriangle}
          color={metrics.lowStockCount > 0 ? "text-amber-500" : "text-zinc-500"}
          badge={metrics.lowStockCount > 0 ? `${metrics.lowStockCount} alertas` : undefined}
        />
        <StatCard 
          title="Clientes Registrados" 
          value={metrics.totalCompanies} 
          description="Empresas B2B activas en sistema"
          icon={Building2}
          color="text-purple-500"
        />
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-6 shadow-2xl">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/orders/new">
            <div className="bg-zinc-950/50 border border-zinc-850 hover:border-primary/40 rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-white uppercase tracking-wider">Crear Pedido B2B</p>
                <p className="text-sm text-zinc-400 font-semibold mt-0.5">Ingresar orden manual</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/products/import-stock">
            <div className="bg-zinc-950/50 border border-zinc-850 hover:border-primary/40 rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-white uppercase tracking-wider">Importar Stock</p>
                <p className="text-sm text-zinc-400 font-semibold mt-0.5">Cargar catálogo por Excel</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/customers">
            <div className="bg-zinc-950/50 border border-zinc-850 hover:border-primary/40 rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-white uppercase tracking-wider">Ver Clientes</p>
                <p className="text-sm text-zinc-400 font-semibold mt-0.5">Cartera de clientes B2B</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/analytics">
            <div className="bg-zinc-950/50 border border-zinc-850 hover:border-primary/40 rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-zinc-850 flex items-center justify-center text-zinc-400 group-hover:scale-105 transition-transform">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-white uppercase tracking-wider">Métricas de Negocio</p>
                <p className="text-sm text-zinc-400 font-semibold mt-0.5">Gráficos de ventas y tendencias</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Grid: Orders & Stock Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders (Left Column - 7/12) */}
        <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Últimos Pedidos Recibidos
              </h3>
              <Link href="/dashboard/orders" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5">
                Ver Todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left">
                <thead className="bg-zinc-950/40 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Pedido</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 rounded-r-xl text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-600 text-sm italic uppercase tracking-wider font-bold">
                        No se registran pedidos recientes
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order: any) => (
                      <tr 
                        key={order.id} 
                        onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                        className="text-base group hover:bg-zinc-950/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-4 font-mono font-medium text-white truncate max-w-[90px]">
                          #{order.orderNumber.split('-').pop()}
                        </td>
                        <td className="px-4 py-4 text-sky-400 font-bold truncate max-w-[150px]">
                          {order.company.razonSocial}
                        </td>
                        <td className="px-4 py-4 font-bold text-white text-[17px]">
                          {formatCurrency(Number(order.totalGross))}
                        </td>
                        <td className="px-4 py-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <button className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-primary hover:text-white rounded-lg transition-all shadow-md cursor-pointer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts (Right Column - 5/12) */}
        <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Alertas de Stock Crítico
              </h3>
              <span className="text-xs font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                {metrics.lowStockCount} crítico
              </span>
            </div>

            {/* Scrollable list of critical stock products */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {lowStockProducts.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 text-sm italic uppercase tracking-wider font-bold">
                  Excelente: Todo el catálogo con stock óptimo
                </div>
              ) : (
                lowStockProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3.5 bg-zinc-950/50 border border-zinc-850 rounded-2xl group hover:border-amber-500/20 transition-all">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-white truncate max-w-[180px]">{p.name}</p>
                      <p className="text-sm text-sky-400 font-mono mt-0.5">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-amber-500">{p.stock} unidades</p>
                      <p className="text-sm text-zinc-500 font-medium">Alerta: {p.alert}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, color, badge }: any) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[28px] space-y-4 shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between min-h-[160px]">
      <div className="flex items-center justify-between">
        <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {badge && (
          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-white mt-1 truncate">{value}</p>
        <p className="text-[13px] text-zinc-400 mt-1 font-semibold leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
