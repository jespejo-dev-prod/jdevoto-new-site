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

  const stats = await analyticsService.getDashboardStats();

  return ok(stats);
});
