import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { analyticsService } from "@/modules/analytics/domain/analytics.service";
import { ForbiddenError } from "@/lib/errors";
import { UserRole } from "@prisma/client";

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);

  // Solo ADMIN y SALES_REP pueden ver analítica global
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SALES_REP) {
    throw new ForbiddenError("No tienes permisos para ver la analítica");
  }

  const url = new URL(req.url);
  const period = (url.searchParams.get("period") as '30d' | '60d' | '90d' | '120d' | 'all' | 'custom') || 'all';
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;

  const salesRepId = user.role === UserRole.SALES_REP ? user.id : undefined;
  const stats = await analyticsService.getDashboardStats(salesRepId, period, startDate, endDate);

  return ok(stats);
});
