import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, created } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { Prisma, UserRole } from "@prisma/client";
import { RegisterCompanySchema } from "@/validations/company.schemas";
import { BusinessRuleError } from "@/lib/errors";
import { logAuditAction } from "@/lib/audit";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendNewUserPasswordEmail, sendNewCustomerAdminNotification, sendSetupPasswordEmail } from "@/lib/email";

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
  const hasDebt = searchParams.get("hasDebt") === "true";

  if (unassigned) {
    andConditions.push({ salesRepId: null });
  } else if (user.role === UserRole.SALES_REP) {
    andConditions.push({ salesRepId: user.id });
  }

  if (hasDebt) {
    andConditions.push({ creditUsed: { not: 0 } });
  }

  const whereClause: Prisma.CompanyWhereInput = { AND: andConditions };

  const needsTotals = (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && !unassigned;

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
  const { salesRepEmail, initialPassword, ...companyData } = RegisterCompanySchema.parse(body);

  // 1. Verificaciones de duplicidad
  const existingCompany = await prisma.company.findUnique({
    where: { rut: companyData.rut }
  });

  if (existingCompany) {
    throw new BusinessRuleError(
      `El RUT ${companyData.rut} ya se encuentra registrado en el sistema.`,
      "DUPLICATE_COMPANY"
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: companyData.email.toLowerCase() }
  });

  if (existingUser) {
    throw new BusinessRuleError(
      `El correo electrónico ${companyData.email} ya está en uso por otro usuario.`,
      "DUPLICATE_USER"
    );
  }

  // 2. Determinar el Vendedor
  let salesRepId: string | null = null;
  let sellerName = "Administrador";
  
  if (user.role === UserRole.SALES_REP) {
    // Si es vendedor, se asigna a sí mismo automáticamente
    salesRepId = user.id;
    sellerName = `${user.firstName} ${user.lastName}`.trim();
  } else if (salesRepEmail) {
    // Si es admin, puede asignar mediante email
    const salesRep = await prisma.user.findFirst({
      where: { email: salesRepEmail, role: UserRole.SALES_REP, isActive: true },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (!salesRep) {
      throw new BusinessRuleError(
        "El correo ingresado no corresponde a un vendedor activo",
        "INVALID_SALES_REP_EMAIL"
      );
    }
    
    salesRepId = salesRep.id;
    sellerName = `${salesRep.firstName} ${salesRep.lastName}`.trim();
  }

  // 3. Crear Empresa y Usuario en Transacción
  const isPasswordProvided = !!initialPassword;
  const rawPassword = isPasswordProvided ? initialPassword : crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const resetToken = isPasswordProvided ? null : crypto.randomBytes(32).toString("hex");

  const result = await prisma.$transaction(async (tx) => {
    const customer = await tx.company.create({
      data: {
        ...companyData,
        salesRepId,
      },
    });

    const newUser = await tx.user.create({
      data: {
        email: companyData.email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: companyData.razonSocial.substring(0, 50),
        lastName: "",
        role: UserRole.BUYER,
        companyId: customer.id,
        isActive: true,
      }
    });

    if (!isPasswordProvided && resetToken) {
      await tx.passwordResetToken.create({
        data: {
          email: newUser.email,
          token: resetToken,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 horas
        }
      });
    }

    return { customer, newUser };
  });

  // 4. Enviar correos en segundo plano (sin bloquear la respuesta)
  if (isPasswordProvided) {
    sendNewUserPasswordEmail(
      result.newUser.email, 
      initialPassword, 
      result.customer.razonSocial
    ).catch(err => console.error("Error enviando email de password:", err));
  } else {
    sendSetupPasswordEmail(
      result.newUser.email,
      resetToken as string,
      "Cliente B2B"
    ).catch(err => console.error("Error enviando email de setup password:", err));
  }

  sendNewCustomerAdminNotification(
    sellerName, 
    result.customer.razonSocial, 
    result.customer.rut, 
    result.newUser.email
  ).catch(err => console.error("Error enviando email a admin:", err));

  await logAuditAction({
    userId: user.id,
    action: "COMPANY_CREATED",
    entity: "Company",
    entityId: result.customer.id,
    details: { razonSocial: result.customer.razonSocial, rut: result.customer.rut, email: result.customer.email, salesRepEmail: salesRepEmail || null },
    req,
  });

  return created(result.customer);
});
