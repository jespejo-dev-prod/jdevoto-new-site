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
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const whereClause = {
    AND: [
      { razonSocial: { not: "" } },
      {
        OR: [
          { razonSocial: { contains: search, mode: "insensitive" as const } },
          { rut: { contains: search, mode: "insensitive" as const } },
          { nombreFantasia: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { billingEmail: { contains: search, mode: "insensitive" as const } },
          {
            users: {
              some: {
                email: { contains: search, mode: "insensitive" as const }
              }
            }
          }
        ]
      }
    ]
  };

  const [customers, total, totals] = await Promise.all([
    prisma.company.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { razonSocial: "asc" },
    }),
    prisma.company.count({ where: whereClause }),
    prisma.company.aggregate({
      where: { razonSocial: { not: "" } },
      _sum: {
        creditLimit: true,
        creditUsed: true
      }
    })
  ]);

  return ok(customers, 200, {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    totals: {
      creditLimit: totals._sum.creditLimit ? Number(totals._sum.creditLimit) : 0,
      creditUsed: totals._sum.creditUsed ? Number(totals._sum.creditUsed) : 0
    }
  });
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
