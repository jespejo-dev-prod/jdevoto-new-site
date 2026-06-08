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
    include: { company: { select: { id: true, rut: true, razonSocial: true, creditLimit: true, creditUsed: true, defaultDiscount: true, paymentTerms: true, paymentTermDiscount: true } } },
  });

  if (!user) {
    // No revelar si el email existe o no (seguridad)
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // 2. Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError("Credenciales inválidas");
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
      role: user.role,
      companyId: user.companyId,
      company: user.company,
    },
  };
}
