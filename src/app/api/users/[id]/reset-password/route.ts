import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";

/**
 * POST /api/users/[id]/reset-password
 * Inicia el flujo de restablecimiento de contraseña para un usuario.
 */
export const POST = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const adminUser = extractUserFromRequest(req);
  requireRole(adminUser, [UserRole.ADMIN]);

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) throw new NotFoundError("Usuario", id);

  // Aquí se generaría un token de reset y se enviaría por email.
  // Por ahora, simulamos el éxito del envío.
  
  console.log(`[AUTH] Admin ${adminUser.email} solicitó reset de password para ${user.email}`);

  return ok({ message: `Instrucciones de restablecimiento enviadas a ${user.email}` });
});
