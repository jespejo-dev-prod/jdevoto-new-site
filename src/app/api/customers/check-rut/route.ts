import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";


export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SALES_REP]);

  const { searchParams } = new URL(req.url);
  let rut = searchParams.get("rut") || "";

  if (!rut) {
    return ok({ exists: false });
  }

  // Use the same normalization logic
  const cleaned = rut.replace(/\./g, "").replace(/\s/g, "").toUpperCase();
  if (cleaned.includes("-")) {
    const [body, dv] = cleaned.split("-");
    rut = `${body}-${dv}`;
  } else if (cleaned.length > 1) {
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    rut = `${body}-${dv}`;
  } else {
    rut = cleaned;
  }

  const existingCompany = await prisma.company.findUnique({
    where: { rut },
    select: { id: true, razonSocial: true }
  });

  return ok({ 
    exists: !!existingCompany,
    company: existingCompany || null
  });
});
