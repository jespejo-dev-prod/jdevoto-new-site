import { NextRequest } from 'next/server';
import { withApiHandler, ok } from '@/lib/api-handler';
import { extractUserFromRequest } from '@/lib/auth';
import { verifyTOTP } from '@/lib/totp';
import { prisma } from '@/lib/client';
import { BusinessRuleError } from '@/lib/errors';
import { z } from 'zod';

const VerifySchema = z.object({
  secret: z.string().length(16, 'El secreto debe ser de 16 caracteres'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  const body = await req.json();
  const { secret, code } = VerifySchema.parse(body);

  const isValid = verifyTOTP(code, secret);
  if (!isValid) {
    throw new BusinessRuleError('El código ingresado es incorrecto o ha expirado. Por favor, vuelve a intentarlo.', 'INVALID_TOTP_CODE');
  }

  // Guardar el secreto en la base de datos para activar oficialmente el 2FA
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorSecret: secret,
    },
  });

  return ok({
    success: true,
    message: 'Doble factor de autenticación (2FA) activado correctamente.'
  });
});
