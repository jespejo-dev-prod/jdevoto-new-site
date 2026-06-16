import { NextRequest } from 'next/server';
import { withApiHandler, ok } from '@/lib/api-handler';
import { extractUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/client';

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);

  // Eliminar el secreto de 2FA para desactivarlo
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorSecret: null,
    },
  });

  return ok({
    success: true,
    message: 'Doble factor de autenticación (2FA) desactivado correctamente.'
  });
});
