import { prisma } from "@/lib/client";
import { OrderStatus } from "@prisma/client";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export class AnalyticsService {
  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const prevThirtyDaysAgo = subDays(thirtyDaysAgo, 30);

    // 1. Ejecutar todas las consultas independientes en paralelo
    const [
      currentAggregation,
      prevAggregation,
      dailySales,
      statusCounts,
      topCustomers
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
        },
        _sum: { totalGross: true },
        _count: { _all: true }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: prevThirtyDaysAgo, lt: thirtyDaysAgo },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
        },
        _sum: { totalGross: true },
        _count: { _all: true }
      }),
      prisma.$queryRaw<Array<{ date: string; total: number }>>`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          SUM("totalGross")::float as total
        FROM "orders"
        WHERE "createdAt" >= ${thirtyDaysAgo}
          AND status NOT IN ('CANCELLED', 'REJECTED')
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.order.groupBy({
        by: ['companyId'],
        _sum: { totalGross: true },
        _count: { _all: true },
        orderBy: { _sum: { totalGross: 'desc' } },
        take: 5,
        where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] } }
      })
    ]);

    const currentRevenue = Number(currentAggregation._sum.totalGross || 0);
    const currentOrdersCount = Number(currentAggregation._count._all || 0);

    const prevRevenue = Number(prevAggregation._sum.totalGross || 0);
    const revenueGrowth = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

    // 2. Obtener información de los clientes top
    const topCompanyIds = topCustomers.map(c => c.companyId);
    const customersInfo = topCompanyIds.length > 0 
      ? await prisma.company.findMany({
          where: { id: { in: topCompanyIds } },
          select: { id: true, razonSocial: true }
        })
      : [];

    const customerMap = new Map(customersInfo.map(info => [info.id, info.razonSocial]));

    const topCustomersFormatted = topCustomers.map(c => ({
      name: customerMap.get(c.companyId) || 'Desconocido',
      revenue: Number(c._sum.totalGross || 0),
      orders: Number(c._count._all)
    }));

    return {
      summary: {
        revenue: Math.round(currentRevenue),
        revenueGrowth: Math.round(revenueGrowth),
        ordersCount: currentOrdersCount,
        avgOrderValue: currentOrdersCount > 0 ? Math.round(currentRevenue / currentOrdersCount) : 0
      },
      dailySales: dailySales.map(d => ({
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
