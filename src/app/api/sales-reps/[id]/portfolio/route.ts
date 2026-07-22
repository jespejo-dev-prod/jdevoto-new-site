import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UserRole } from "@prisma/client";

export const GET = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { id } = await params;

  const rep = await prisma.user.findUnique({
    where: { id, role: UserRole.SALES_REP, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      assignedCompanies: {
        select: {
          id: true,
          razonSocial: true,
          rut: true,
        },
        orderBy: { razonSocial: "asc" },
      },
    },
  });

  if (!rep) {
    return ok({ assignedCompanies: [] });
  }

  return ok(rep);
});
