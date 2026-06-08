import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ok, created } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(UserRole).default(UserRole.BUYER),
  companyId: z.string().optional(), // Si no se pasa, usa la del admin o company_admin
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.COMPANY_ADMIN]);

  const whereClause = user.role === UserRole.COMPANY_ADMIN 
    ? { companyId: user.companyId } 
    : {};

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      company: {
        select: { razonSocial: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return ok(users);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const currentUser = extractUserFromRequest(req);
  requireRole(currentUser, [UserRole.ADMIN, UserRole.COMPANY_ADMIN]);

  const body = await req.json();
  const data = CreateUserSchema.parse(body);

  // Validación de COMPANY_ADMIN
  if (currentUser.role === UserRole.COMPANY_ADMIN) {
    if (data.role === UserRole.ADMIN || data.role === UserRole.COMPANY_ADMIN) {
      return NextResponse.json({ error: "No tienes permisos para crear este tipo de rol" }, { status: 403 });
    }
    // Forzar siempre el companyId del COMPANY_ADMIN
    data.companyId = currentUser.companyId;
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  });

  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      companyId: data.companyId || currentUser.companyId,
    }
  });

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return created(userWithoutPassword);
});
