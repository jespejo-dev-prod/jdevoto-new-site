import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const searchParams = req.nextUrl.searchParams;
  const period = searchParams.get('period') || '30d';
  
  let startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate') as string) : new Date();
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate') as string) : new Date();

  if (!searchParams.get('startDate')) {
    if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '60d') startDate.setDate(startDate.getDate() - 60);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (period === 'all') startDate = new Date(0);
  }

  // 1. Top 10 most viewed products
  const topViewedProductsRaw = await prisma.analyticsDailyStat.groupBy({
    by: ['metricKey'],
    where: {
      metricType: 'product_viewed',
      date: { gte: startDate, lte: endDate }
    },
    _sum: { metricValue: true },
    orderBy: { _sum: { metricValue: 'desc' } },
    take: 10
  });

  // 2. Top 10 most clicked products
  const topClickedProductsRaw = await prisma.analyticsDailyStat.groupBy({
    by: ['metricKey'],
    where: {
      metricType: 'product_clicked',
      date: { gte: startDate, lte: endDate }
    },
    _sum: { metricValue: true },
    orderBy: { _sum: { metricValue: 'desc' } },
    take: 10
  });

  // 3. Top 10 search terms
  const topSearchTermsRaw = await prisma.analyticsDailyStat.groupBy({
    by: ['metricKey'],
    where: {
      metricType: 'search_performed',
      date: { gte: startDate, lte: endDate }
    },
    _sum: { metricValue: true },
    orderBy: { _sum: { metricValue: 'desc' } },
    take: 10
  });

  // 4. Top 10 most visited pages
  const topVisitedPagesRaw = await prisma.analyticsDailyStat.groupBy({
    by: ['metricKey'],
    where: {
      metricType: 'page_view',
      date: { gte: startDate, lte: endDate }
    },
    _sum: { metricValue: true },
    orderBy: { _sum: { metricValue: 'desc' } },
    take: 10
  });

  // 5. Conversion funnel counts
  const funnelEvents = ['page_view', 'product_viewed', 'added_to_cart', 'checkout_started', 'order_confirmed'];
  const funnelRaw = await prisma.analyticsDailyStat.groupBy({
    by: ['metricType'],
    where: {
      metricType: { in: funnelEvents },
      date: { gte: startDate, lte: endDate }
    },
    _sum: { metricValue: true }
  });

  const funnel: Record<string, number> = {};
  funnelEvents.forEach(e => funnel[e] = 0);
  funnelRaw.forEach(f => {
    funnel[f.metricType] = f._sum.metricValue || 0;
  });

  // 6. Cart abandonment rate
  const addedToCart = funnel['added_to_cart'] || 0;
  const orderConfirmed = funnel['order_confirmed'] || 0;
  const cartAbandonmentRate = addedToCart > 0 
    ? ((addedToCart - orderConfirmed) / addedToCart) * 100 
    : 0;

  return ok({
    topViewedProducts: topViewedProductsRaw.map(r => ({ productId: r.metricKey, views: r._sum.metricValue })),
    topClickedProducts: topClickedProductsRaw.map(r => ({ productId: r.metricKey, clicks: r._sum.metricValue })),
    topSearchTerms: topSearchTermsRaw.map(r => ({ term: r.metricKey, count: r._sum.metricValue })),
    topVisitedPages: topVisitedPagesRaw.map(r => ({ url: r.metricKey, visits: r._sum.metricValue })),
    funnel,
    cartAbandonmentRate
  });
});
