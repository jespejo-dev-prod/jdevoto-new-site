import { cookies } from "next/headers";
import { verifyRefreshToken } from "./auth";
import { prisma } from "./client";
import { AuthenticatedUser } from "@/types/domain";

/**
 * getServerUser
 * 
 * Recupera el usuario autenticado desde un Server Component
 * leyendo la cookie httpOnly 'refresh_token'.
 */
export async function getServerUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) return null;

    // El refresh_token en este sistema contiene { sub: userId, type: 'refresh' }
    const payload = verifyRefreshToken(refreshToken);
    
    if (!payload.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!user || (!user.companyId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'SALES_REP')) return null;

    return user as AuthenticatedUser;
  } catch (error) {
    // Si el token es inválido o expira, devolvemos null
    // La protección de rutas real la maneja proxy.ts
    return null;
  }
}
