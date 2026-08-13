import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UnauthorizedError } from "@/lib/errors";
import { ok, withApiHandler } from "@/lib/api-handler";

export const POST = withApiHandler(async (req: NextRequest) => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    throw new UnauthorizedError("Refresh token missing");
  }

  // Verificar el token (lanza error si el JWT es inválido o expiró a nivel de firma)
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    cookieStore.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  // Buscar el token en la base de datos (con o sin revoked, para poder detectar reutilización)
  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      token: refreshToken,
    },
    include: { 
      user: { 
        include: { 
          company: { 
            select: { id: true, rut: true, razonSocial: true, email: true, billingEmail: true, telefono: true, giro: true, creditLimit: true, creditUsed: true, defaultDiscount: true, paymentTerms: true, paymentTermDiscount: true, shippingStreet: true, shippingNumber: true, shippingApartment: true, shippingCommune: true, shippingCity: true, shippingRegion: true } 
          } 
        } 
      } 
    },
  });

  if (!storedToken || !storedToken.user || !storedToken.user.isActive) {
    cookieStore.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    throw new UnauthorizedError("Invalid refresh token or inactive user");
  }

  // ⚠️ ALERTA DE SEGURIDAD: Detección de Reutilización
  if (storedToken.revoked) {
    // Si el token ya fue revocado pero vuelve a presentarse, significa que
    // o un atacante o el usuario legítimo está usando un token previamente rotado.
    // Invalidamos TODOS los tokens activos de este usuario para forzar re-autenticación completa.
    await prisma.refreshToken.updateMany({
      where: {
        userId: storedToken.userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    console.error(
      `[SECURITY ALERT] Intento de reutilización de refresh token revocado. Usuario: ${storedToken.userId}. Todos los tokens han sido revocados por seguridad.`
    );
    cookieStore.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    throw new UnauthorizedError("Sesión invalidada por razones de seguridad.");
  }

  // Verificar expiración temporal
  if (storedToken.expiresAt < new Date()) {
    cookieStore.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    throw new UnauthorizedError("Expired refresh token");
  }

  // 1. En lugar de rotar el refresh token en CADA recarga de página (lo que causa race conditions
  // con múltiples pestañas o React Strict Mode), simplemente extendemos su vigencia (Rolling Session).
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  // 2. Generar SOLO nuevo access token
  const newAccessToken = signAccessToken({
    sub: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
    companyId: storedToken.user.companyId,
  });

  // 3. Escribir la cookie con el MISMO refresh token pero nueva expiración
  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 día en segundos
  });

  return ok({
    access_token: newAccessToken,
    user: {
      id: storedToken.user.id,
      email: storedToken.user.email,
      firstName: storedToken.user.firstName,
      lastName: storedToken.user.lastName,
      phone: storedToken.user.phone,
      role: storedToken.user.role,
      companyId: storedToken.user.companyId,
      company: storedToken.user.company,
      twoFactorEnabled: !!storedToken.user.twoFactorSecret,
    }
  });
});
