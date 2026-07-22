import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const AssignSchema = z.object({
  salesRepId: z.string(),
  companyId: z.string(),
  action: z.enum(["assign", "remove"])
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const body = await req.json();
  const { salesRepId, companyId, action } = AssignSchema.parse(body);

  if (action === "assign") {
    // Verificar si ya pertenece a otro vendedor
    const company = await prisma.company.findUnique({ where: { id: companyId }});
    if (company?.salesRepId && company.salesRepId !== salesRepId) {
      throw new Error("Este cliente ya se encuentra asignado a otro vendedor.");
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { salesRepId }
    });
  } else {
    // Check if it's currently assigned to this sales rep before removing
    const company = await prisma.company.findUnique({ where: { id: companyId }});
    if (company?.salesRepId === salesRepId) {
      await prisma.company.update({
        where: { id: companyId },
        data: { salesRepId: null }
      });
    }
  }

  return ok({ success: true });
});
