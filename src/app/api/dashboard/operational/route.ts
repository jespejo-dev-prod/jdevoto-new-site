import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { OrderStatus, UserRole } from "@prisma/client";
import { extractUserFromRequest, requireRole } from "@/lib/auth";

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  // 1. Total revenue & orders count in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [
    orderStats,
    totalCompanies,
    lowStockResult,
    recentOrders,
    lowStockProducts
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] },
        company: {
          NOT: { razonSocial: { contains: 'test', mode: 'insensitive' } },
          ...(user.role === UserRole.SALES_REP ? { salesRepId: user.id } : {})
        }
      },
      _sum: { totalGross: true },
      _count: { _all: true }
    }),
    prisma.company.count({ 
      where: { 
        isActive: true,
        ...(user.role === UserRole.SALES_REP ? { salesRepId: user.id } : {})
      } 
    }),
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count FROM products 
      WHERE "isActive" = true AND "isDeleted" = false AND "stockQuantity" <= "stockAlert"
    `,
    prisma.order.findMany({
      where: {
        company: {
          NOT: { razonSocial: { contains: 'test', mode: 'insensitive' } },
          ...(user.role === UserRole.SALES_REP ? { salesRepId: user.id } : {})
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        company: { select: { razonSocial: true } }
      }
    }),
    prisma.$queryRaw`
      SELECT id, name, sku, "stockQuantity"::int as stock, "stockAlert"::int as alert
      FROM products
      WHERE "isActive" = true AND "isDeleted" = false AND "stockQuantity" <= "stockAlert"
      ORDER BY "stockQuantity" ASC
      LIMIT 50
    `
  ]);
  
  const totalRevenue = Number(orderStats._sum.totalGross || 0);
  const totalOrders = Number(orderStats._count._all || 0);
  const lowStockCount = lowStockResult[0]?.count || 0;

  return ok({
    metrics: {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      totalCompanies,
      lowStockCount
    },
    recentOrders,
    lowStockProducts
  });
});
