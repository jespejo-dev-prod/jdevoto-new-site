import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { id } = await params;
  
  const customer = await prisma.company.findUnique({
    where: { id }
  });

  if (!customer) throw new NotFoundError("Cliente", id);

  if (user.role === UserRole.SALES_REP && customer.salesRepId !== user.id) {
    throw new BusinessRuleError("No puedes desvincular un cliente que no pertenece a tu cartera.");
  }

  const updatedCompany = await prisma.company.update({
    where: { id },
    data: {
      salesRepId: null
    }
  });

  return ok({ message: "Cliente desvinculado de tu cartera.", company: updatedCompany });
});
