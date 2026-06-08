import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, signAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UnauthorizedError } from "@/lib/errors";
import { ok, withApiHandler } from "@/lib/api-handler";

export const POST = withApiHandler(async (req: NextRequest) => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    throw new UnauthorizedError("Refresh token missing");
  }

  // Verificar el token
  const payload = verifyToken(refreshToken);

  // Buscar en la base de datos
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.sub,
      token: refreshToken,
      revoked: false,
    },
    include: { 
      user: { 
        include: { 
          company: { 
            select: { id: true, rut: true, razonSocial: true, creditLimit: true, creditUsed: true, defaultDiscount: true, paymentTerms: true, paymentTermDiscount: true } 
          } 
        } 
      } 
    },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  // Generar nuevo access token
  const newAccessToken = signAccessToken({
    sub: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
    companyId: storedToken.user.companyId,
  });

  return ok({
    access_token: newAccessToken,
    user: {
      id: storedToken.user.id,
      email: storedToken.user.email,
      firstName: storedToken.user.firstName,
      lastName: storedToken.user.lastName,
      role: storedToken.user.role,
      companyId: storedToken.user.companyId,
      company: storedToken.user.company,
    }
  });
});
