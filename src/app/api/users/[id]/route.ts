import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logAuditAction } from "@/lib/audit";

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(7).regex(/[A-Z]/, "Debe contener al menos una mayúscula").regex(/[0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/, "Debe contener al menos un número o símbolo").optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.nativeEnum(UserRole).optional(),
  companyId: z.string().nullable().optional(),
});

export const GET = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const currentUser = extractUserFromRequest(req);
  requireRole(currentUser, [UserRole.ADMIN, UserRole.COMPANY_ADMIN]);
  
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (currentUser.role === UserRole.COMPANY_ADMIN && user.companyId !== currentUser.companyId) {
    return NextResponse.json({ error: "No tienes permisos para ver este usuario" }, { status: 403 });
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  return ok(userWithoutPassword);
});

export const PATCH = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const currentUser = extractUserFromRequest(req);
  requireRole(currentUser, [UserRole.ADMIN, UserRole.COMPANY_ADMIN]);
  
  const { id } = await params;
  const body = await req.json();
  const data = UpdateUserSchema.parse(body);

  // Buscar el usuario a editar
  const targetUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // Validación de permisos para COMPANY_ADMIN
  if (currentUser.role === UserRole.COMPANY_ADMIN) {
    if (targetUser.companyId !== currentUser.companyId) {
      return NextResponse.json({ error: "No tienes permisos para editar este usuario" }, { status: 403 });
    }
    if (data.role && (data.role === UserRole.ADMIN || data.role === UserRole.COMPANY_ADMIN)) {
      return NextResponse.json({ error: "No tienes permisos para asignar este rol" }, { status: 403 });
    }
  }

  const updateData: any = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.companyId !== undefined) updateData.companyId = data.companyId;

  if (data.email !== undefined) {
    const emailLower = data.email.toLowerCase();
    if (emailLower !== targetUser.email) {
      // Verificar unicidad de email
      const existing = await prisma.user.findUnique({
        where: { email: emailLower }
      });
      if (existing) {
        return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 });
      }
      updateData.email = emailLower;
    }
  }

  if (data.password !== undefined && data.password.trim() !== "") {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  if (data.role !== undefined && data.role !== targetUser.role) {
    const roleName = 
      data.role === 'ADMIN' ? 'Administrador' :
      data.role === 'COMPANY_ADMIN' ? 'Administrador de Empresa' :
      data.role === 'SALES_REP' ? 'Vendedor' : 'Comprador';
      
    const { sendUserUpdatedAdminNotification } = await import("@/lib/email");
    sendUserUpdatedAdminNotification(updatedUser.email, roleName, false).catch(err => {
      console.error("Error enviando notificación de actualización al admin", err);
    });
  }

  await logAuditAction({
    userId: currentUser.id,
    action: "USER_UPDATED",
    entity: "User",
    entityId: updatedUser.id,
    details: { targetEmail: updatedUser.email, changes: Object.keys(updateData) },
    req,
  });

  const { passwordHash: _, ...userWithoutPassword } = updatedUser;
  return ok(userWithoutPassword);
});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const currentUser = extractUserFromRequest(req);
  requireRole(currentUser, [UserRole.ADMIN, UserRole.COMPANY_ADMIN]);

  const { id } = await params;

  const targetUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (currentUser.role === UserRole.COMPANY_ADMIN && targetUser.companyId !== currentUser.companyId) {
    return NextResponse.json({ error: "No tienes permisos para eliminar este usuario" }, { status: 403 });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    // Si falla por foreign key (ej. orders, audit logs), desactivarlo
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  const roleName = 
    targetUser.role === 'ADMIN' ? 'Administrador' :
    targetUser.role === 'COMPANY_ADMIN' ? 'Administrador de Empresa' :
    targetUser.role === 'SALES_REP' ? 'Vendedor' : 'Comprador';

  const { sendUserDeletedAdminNotification } = await import("@/lib/email");
  sendUserDeletedAdminNotification(targetUser.email, roleName).catch(err => {
    console.error("Error enviando notificación de eliminación de usuario", err);
  });

  await logAuditAction({
    userId: currentUser.id,
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    details: { targetEmail: targetUser.email, action: "DELETED/DEACTIVATED" },
    req,
  });

  return ok({ success: true, message: "Usuario eliminado correctamente" });
});
