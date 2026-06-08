import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, created } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { RegisterCompanySchema } from "@/validations/company.schemas";
import { BusinessRuleError } from "@/lib/errors";

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const customers = await prisma.company.findMany({
    where: {
      OR: [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { rut: { contains: search, mode: 'insensitive' } },
        { nombreFantasia: { contains: search, mode: 'insensitive' } },
      ]
    },
    orderBy: { razonSocial: "asc" },
  });

  return ok(customers);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const body = await req.json();
  const { salesRepEmail, ...companyData } = RegisterCompanySchema.parse(body);

  let salesRepId: string | null = null;
  if (salesRepEmail) {
    const salesRep = await prisma.user.findFirst({
      where: { email: salesRepEmail, role: UserRole.SALES_REP, isActive: true },
      select: { id: true }
    });
    
    if (!salesRep) {
      throw new BusinessRuleError(
        "El correo ingresado no corresponde a un vendedor activo",
        "INVALID_SALES_REP_EMAIL"
      );
    }
    
    salesRepId = salesRep.id;
  }

  const customer = await prisma.company.create({
    data: {
      ...companyData,
      salesRepId,
    },
  });

  return created(customer);
});
