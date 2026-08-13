/**
 * POST /api/users/:id/resend-welcome
 * 
 * Reenvía el correo de bienvenida/setup de contraseña a un usuario.
 * Solo ADMIN y SUPER_ADMIN pueden usar este endpoint.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { UserRole } from "@prisma/client";

export const POST = withApiHandler(async (req: NextRequest, ctx: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const { id } = await ctx.params;

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
  });

  if (!targetUser) throw new NotFoundError("Usuario", id);

  // Generate a new password reset token (1 hour expiry)
  const crypto = require("crypto");
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { email: targetUser.email } });
  
  // Create new token
  await prisma.passwordResetToken.create({
    data: { email: targetUser.email, token, expires }
  });

  const roleName = 
    targetUser.role === 'ADMIN' ? 'Administrador' :
    targetUser.role === 'SUPER_ADMIN' ? 'Super Administrador' :
    targetUser.role === 'COMPANY_ADMIN' ? 'Administrador de Empresa' :
    targetUser.role === 'SALES_REP' ? 'Vendedor' : 'Comprador';

  const { sendSetupPasswordEmail } = await import("@/lib/email");
  await sendSetupPasswordEmail(targetUser.email, token, roleName);

  return ok({ 
    message: `Correo de bienvenida reenviado exitosamente a ${targetUser.email}` 
  });
});
