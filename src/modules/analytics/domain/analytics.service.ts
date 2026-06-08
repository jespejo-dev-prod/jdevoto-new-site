import { prisma } from "@/lib/client";
import { OrderStatus } from "@prisma/client";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export class AnalyticsService {
  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const prevThirtyDaysAgo = subDays(thirtyDaysAgo, 30);

    // 1. Métricas de Resumen (Last 30 days)
    const currentPeriodOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
      },
      select: { totalGross: true }
    });

    const prevPeriodOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: prevThirtyDaysAgo, lt: thirtyDaysAgo },
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
      },
      select: { totalGross: true }
    });

    const currentRevenue = currentPeriodOrders.reduce((sum, o) => sum + Number(o.totalGross), 0);
    const prevRevenue = prevPeriodOrders.reduce((sum, o) => sum + Number(o.totalGross), 0);
    const revenueGrowth = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

    // 2. Tendencia de Ventas Diarias
    const dailySales = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        SUM("totalGross")::float as total
      FROM "orders"
      WHERE "createdAt" >= ${thirtyDaysAgo}
        AND status NOT IN ('CANCELLED', 'REJECTED')
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // 3. Distribución por Estado
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    // 4. Top Clientes (Empresas)
    const topCustomers = await prisma.order.groupBy({
      by: ['companyId'],
      _sum: { totalGross: true },
      _count: { _all: true },
      orderBy: { _sum: { totalGross: 'desc' } },
      take: 5,
      where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] } }
    });

    const customersInfo = await prisma.company.findMany({
      where: { id: { in: topCustomers.map(c => c.companyId) } },
      select: { id: true, razonSocial: true }
    });

    const topCustomersFormatted = topCustomers.map(c => ({
      name: customersInfo.find(info => info.id === c.companyId)?.razonSocial || 'Desconocido',
      revenue: Number(c._sum.totalGross || 0),
      orders: Number(c._count._all)
    }));

    return {
      summary: {
        revenue: Math.round(currentRevenue),
        revenueGrowth: Math.round(revenueGrowth),
        ordersCount: currentPeriodOrders.length,
        avgOrderValue: currentPeriodOrders.length > 0 ? Math.round(currentRevenue / currentPeriodOrders.length) : 0
      },
      dailySales: (dailySales as any[]).map(d => ({
        date: format(new Date(d.date), 'dd MMM'),
        total: Math.round(d.total)
      })),
      statusDistribution: statusCounts.map(s => ({
        status: s.status,
        count: Number(s._count._all)
      })),
      topCustomers: topCustomersFormatted
    };
  }
}

export const analyticsService = new AnalyticsService();
