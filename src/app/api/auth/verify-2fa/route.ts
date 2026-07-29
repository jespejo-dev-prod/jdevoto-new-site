import { NextRequest } from 'next/server';
import { withApiHandler, ok } from '@/lib/api-handler';
import { verifyTOTP } from '@/lib/totp';
import { prisma } from '@/lib/client';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { BusinessRuleError, UnauthorizedError } from '@/lib/errors';
import { logAuditAction } from '@/lib/audit';
import { z } from 'zod';

const Verify2FASchema = z.object({
  userId: z.string().min(1, 'El ID de usuario es obligatorio'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { userId, code } = Verify2FASchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: {
      company: {
        select: { id: true, rut: true, razonSocial: true, email: true, billingEmail: true, telefono: true, giro: true, creditLimit: true, creditUsed: true, defaultDiscount: true, paymentTerms: true, paymentTermDiscount: true, shippingStreet: true, shippingNumber: true, shippingApartment: true, shippingCommune: true, shippingCity: true, shippingRegion: true }
      }
    }
  });

  if (!user || !(user as any).twoFactorSecret) {
    throw new UnauthorizedError('Usuario no encontrado o 2FA no activo.');
  }

  const isValid = verifyTOTP(code, (user as any).twoFactorSecret);
  if (!isValid) {
    // Log failed audit action for security tracking
    await logAuditAction({
      action: '2FA_FAILED',
      userId: user.id,
      details: { email: user.email, reason: 'Código de 2FA incorrecto o expirado' },
      req,
    });
    throw new BusinessRuleError('El código ingresado es incorrecto o ha expirado.', 'INVALID_TOTP_CODE');
  }

  // Generar tokens
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  const refreshToken = signRefreshToken(user.id);

  // Guardar refresh token en DB con vigencia de 1 DÍA
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 día (24h)
    },
  });

  // Establecer cookie httpOnly con expiración de 1 día
  const { cookies } = await import('next/headers');
  (await cookies()).set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 día en segundos
  });

  await logAuditAction({
    action: 'LOGIN_SUCCESS_2FA',
    userId: user.id,
    details: { email: user.email, name: `${user.firstName} ${user.lastName}`.trim() },
    req,
  });

  return ok({
    access_token: accessToken,
    token_type: 'Bearer',
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
  });
});
