import { prisma } from "@/lib/client";
import { OrderStatus } from "@prisma/client";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export class AnalyticsService {
  async getDashboardStats(
    salesRepId?: string, 
    period: '30d' | '60d' | '90d' | '120d' | 'all' | 'custom' = '30d',
    customStartDate?: string,
    customEndDate?: string
  ) {
    const now = new Date();
    let startDateObj: Date | undefined = undefined;
    let endDateObj: Date | undefined = undefined;
    let prevStartDateObj: Date | undefined = undefined;
    let prevEndDateObj: Date | undefined = undefined;

    if (period !== 'all') {
      if (period === 'custom' && customStartDate && customEndDate) {
        startDateObj = startOfDay(new Date(customStartDate));
        endDateObj = endOfDay(new Date(customEndDate));
        const diffTime = endDateObj.getTime() - startDateObj.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        prevEndDateObj = subDays(startDateObj, 1);
        prevStartDateObj = subDays(startDateObj, diffDays + 1);
      } else {
        const days = parseInt(period.replace('d', '')) || 30;
        startDateObj = subDays(now, days);
        endDateObj = now;
        prevEndDateObj = subDays(startDateObj, 1);
        prevStartDateObj = subDays(startDateObj, days + 1);
      }
    }

    const dateFilter = startDateObj && endDateObj ? { gte: startDateObj, lte: endDateObj } : undefined;
    const prevDateFilter = prevStartDateObj && prevEndDateObj ? { gte: prevStartDateObj, lte: prevEndDateObj } : undefined;

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
          ...(dateFilter ? { createdAt: dateFilter } : {}),
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] },
          company: {
            NOT: { razonSocial: { contains: 'test', mode: 'insensitive' } },
            ...(salesRepId ? { salesRepId } : {})
          }
        },
        _sum: { totalGross: true },
        _count: { _all: true }
      }),
      prevDateFilter ? prisma.order.aggregate({
        where: {
          createdAt: prevDateFilter,
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] },
          company: {
            NOT: { razonSocial: { contains: 'test', mode: 'insensitive' } },
            ...(salesRepId ? { salesRepId } : {})
          }
        },
        _sum: { totalGross: true },
        _count: { _all: true }
      }) : Promise.resolve({ _sum: { totalGross: 0 }, _count: { _all: 0 } }),
      salesRepId ? prisma.$queryRaw<Array<{ date: string; total: number }>>`
        SELECT 
          DATE_TRUNC('day', o."createdAt") as date,
          SUM(o."totalGross")::float as total
        FROM "orders" o
        JOIN "companies" c ON c.id = o."companyId"
        WHERE (${period} = 'all' OR (o."createdAt" >= ${startDateObj || new Date(0)} AND o."createdAt" <= ${endDateObj || new Date()}))
          AND o.status NOT IN ('CANCELLED', 'REJECTED')
          AND c."salesRepId" = ${salesRepId}
          AND c."razonSocial" NOT ILIKE '%test%'
        GROUP BY 1
        ORDER BY 1 ASC
      ` : prisma.$queryRaw<Array<{ date: string; total: number }>>`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          SUM("totalGross")::float as total
        FROM "orders"
        WHERE (${period} = 'all' OR ("createdAt" >= ${startDateObj || new Date(0)} AND "createdAt" <= ${endDateObj || new Date()}))
          AND status NOT IN ('CANCELLED', 'REJECTED')
          AND "companyId" IN (SELECT id FROM "companies" WHERE "razonSocial" NOT ILIKE '%test%')
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { 
          ...(dateFilter ? { createdAt: dateFilter } : {}),
          company: {
            NOT: { razonSocial: { contains: 'test', mode: 'insensitive' } },
            ...(salesRepId ? { salesRepId } : {})
          }
        }
      }),
      prisma.order.groupBy({
        by: ['companyId'],
        _sum: { totalGross: true },
        _count: { _all: true },
        orderBy: { _sum: { totalGross: 'desc' } },
        take: 5,
        where: { 
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
          company: {
            NOT: { razonSocial: { contains: 'test', mode: 'insensitive' } },
            ...(salesRepId ? { salesRepId } : {})
          }
        }
      })
    ]);

    const currentRevenue = Number(currentAggregation._sum.totalGross || 0);
    const currentOrdersCount = Number(currentAggregation._count._all || 0);

    const prevRevenue = Number(prevAggregation._sum.totalGross || 0);
    
    let revenueGrowth = 0;
    if (prevRevenue === 0) {
      revenueGrowth = currentRevenue > 0 ? 100 : 0;
    } else {
      revenueGrowth = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
    }

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
