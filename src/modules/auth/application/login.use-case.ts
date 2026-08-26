import { prisma } from "@/lib/client";
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña mínima de 6 caracteres"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export async function loginUseCase({ email, password }: LoginInput) {
  // 1. Buscar usuario activo
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase(), isActive: true },
    include: { company: { select: { id: true, rut: true, razonSocial: true, email: true, billingEmail: true, telefono: true, giro: true, creditLimit: true, creditUsed: true, defaultDiscount: true, paymentTerms: true, paymentTermDiscount: true, shippingStreet: true, shippingNumber: true, shippingApartment: true, shippingCommune: true, shippingCity: true, shippingRegion: true } } },
  });

  if (!user) {
    // No revelar si el email existe o no (seguridad)
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // 2. Verificar si la cuenta está bloqueada
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new UnauthorizedError(`Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo en ${remainingMinutes} minutos.`);
  }

  // 3. Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    // Incrementar intentos fallidos
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const lockDurationMs = 15 * 60 * 1000; // 15 minutos
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: newAttempts >= 10 ? new Date(Date.now() + lockDurationMs) : null
      }
    });

    throw new UnauthorizedError("Credenciales inválidas");
  }

  // Si el login es exitoso y tenía intentos fallidos previos, resetearlos
  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null }
    });
  }

  // 3. Si requiere 2FA, detener login y pedir código
  if ((user as any).twoFactorSecret) {
    return {
      requires2fa: true,
      userId: user.id,
      email: user.email,
    } as any;
  }

  // 3. Generar tokens
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  const refreshToken = signRefreshToken(user.id);

  // 4. Guardar refresh token en DB con vigencia de 1 DÍA
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 día (24h)
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      companyId: user.companyId,
      company: user.company,
    },
  };
}
