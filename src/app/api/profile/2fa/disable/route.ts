import { NextRequest } from 'next/server';
import { withApiHandler, ok } from '@/lib/api-handler';
import { extractUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/client';
import { ValidationError, BusinessRuleError, UnauthorizedError } from '@/lib/errors';
import bcrypt from 'bcryptjs';

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);

  let body;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError('Cuerpo de solicitud inválido');
  }

  const { password } = body;
  if (!password) {
    throw new ValidationError('La contraseña es obligatoria para desactivar 2FA');
  }

  // Obtener el hash de la contraseña del usuario
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    throw new UnauthorizedError('Usuario no encontrado');
  }

  // Verificar la contraseña
  const isValidPassword = await bcrypt.compare(password, dbUser.passwordHash);
  if (!isValidPassword) {
    throw new BusinessRuleError('Contraseña incorrecta', 'INVALID_PASSWORD');
  }

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
