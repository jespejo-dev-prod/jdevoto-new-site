import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, created } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { Prisma, UserRole } from "@prisma/client";
import { RegisterCompanySchema } from "@/validations/company.schemas";
import { BusinessRuleError } from "@/lib/errors";
import { logAuditAction } from "@/lib/audit";

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const andConditions: Prisma.CompanyWhereInput[] = [
    { razonSocial: { not: "" } },
    {
      OR: [
        { razonSocial: { contains: search, mode: "insensitive" } },
        { rut: { contains: search, mode: "insensitive" } },
        { nombreFantasia: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { billingEmail: { contains: search, mode: "insensitive" } },
        {
          users: {
            some: {
              email: { contains: search, mode: "insensitive" },
              isActive: true
            }
          }
        }
      ]
    }
  ];

  const unassigned = searchParams.get("unassigned") === "true";

  if (unassigned) {
    andConditions.push({ salesRepId: null });
  } else if (user.role === UserRole.SALES_REP) {
    andConditions.push({ salesRepId: user.id });
  }

  const whereClause: Prisma.CompanyWhereInput = { AND: andConditions };

  const needsTotals = user.role === UserRole.ADMIN && !unassigned;

  const [customers, total, totals] = await Promise.all([
    prisma.company.findMany({
      where: whereClause,
      include: {
        salesRep: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { razonSocial: "asc" },
    }),
    prisma.company.count({ where: whereClause }),
    needsTotals ? prisma.company.aggregate({
      where: { razonSocial: { not: "" } },
      _sum: {
        creditLimit: true,
        creditUsed: true
      }
    }) : Promise.resolve({ _sum: { creditLimit: null, creditUsed: null } })
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
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const body = await req.json();
  const { salesRepEmail, ...companyData } = RegisterCompanySchema.parse(body);

  let salesRepId: string | null = null;
  
  if (user.role === UserRole.SALES_REP) {
    // Si es vendedor, se asigna a sí mismo automáticamente
    salesRepId = user.id;
  } else if (salesRepEmail) {
    // Si es admin, puede asignar mediante email
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

  await logAuditAction({
    userId: user.id,
    action: "COMPANY_CREATED",
    entity: "Company",
    entityId: customer.id,
    details: { razonSocial: customer.razonSocial, rut: customer.rut, email: customer.email, salesRepEmail: salesRepEmail || null },
    req,
  });

  return created(customer);
});
