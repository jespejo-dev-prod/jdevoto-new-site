import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, noContent, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * DELETE /api/users/[id]/sessions
 * Cierra todas las sesiones activas de un usuario eliminando sus Refresh Tokens.
 */
export const DELETE = withApiHandler(async (req: NextRequest, { params }: RouteContext<{ id: string }>) => {
  const adminUser = extractUserFromRequest(req);
  requireRole(adminUser, [UserRole.ADMIN]);

  const { id } = await params;

  // Eliminar todos los refresh tokens asociados al usuario
  await prisma.refreshToken.deleteMany({
    where: { userId: id }
  });

  return noContent();
});
