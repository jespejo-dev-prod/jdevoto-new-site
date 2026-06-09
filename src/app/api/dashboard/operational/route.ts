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
  
  const summaryOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] }
    },
    select: { totalGross: true }
  });
  
  const totalRevenue = summaryOrders.reduce((sum, o) => sum + Number(o.totalGross), 0);
  const totalOrders = summaryOrders.length;

  // 2. Count of active companies
  const totalCompanies = await prisma.company.count({ where: { isActive: true } });

  // 3. Low stock count (total in system)
  const lowStockResult: any[] = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM products 
    WHERE "isActive" = true AND "isDeleted" = false AND "stockQuantity" <= "stockAlert"
  `;
  const lowStockCount = lowStockResult[0]?.count || 0;

  // 4. Recent orders (latest 5)
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      company: { select: { razonSocial: true } }
    }
  });

  // 5. Low stock products (all below threshold)
  const lowStockProducts = await prisma.$queryRaw`
    SELECT id, name, sku, "stockQuantity"::int as stock, "stockAlert"::int as alert
    FROM products
    WHERE "isActive" = true AND "isDeleted" = false AND "stockQuantity" <= "stockAlert"
    ORDER BY "stockQuantity" ASC
  `;

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
