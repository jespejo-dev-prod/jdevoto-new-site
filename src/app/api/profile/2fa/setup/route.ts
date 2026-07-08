import { NextRequest } from 'next/server';
import { withApiHandler, ok } from '@/lib/api-handler';
import { extractUserFromRequest } from '@/lib/auth';
import { generateBase32Secret } from '@/lib/totp';

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  
  // Generar un secreto base32 de 16 caracteres
  const secret = generateBase32Secret();
  
  // Construir la URL otpauth estándar de Google Authenticator
  const issuer = 'J. Devoto B2B';
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  
  // Generar URL del código QR mediante una API pública ligera y rápida
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

  return ok({
    secret,
    qrCodeUrl
  });
});
