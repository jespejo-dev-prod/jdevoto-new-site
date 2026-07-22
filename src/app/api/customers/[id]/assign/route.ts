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

  if (!customer.isActive) {
    throw new BusinessRuleError("No se puede asignar un cliente inactivo.");
  }

  if (customer.salesRepId && customer.salesRepId !== user.id && user.role !== UserRole.ADMIN) {
    throw new BusinessRuleError("Este cliente ya está asignado a otro vendedor.");
  }

  const updatedCompany = await prisma.company.update({
    where: { id },
    data: {
      salesRepId: user.id
    }
  });

  return ok({ message: "Cliente asignado correctamente.", company: updatedCompany });
});
