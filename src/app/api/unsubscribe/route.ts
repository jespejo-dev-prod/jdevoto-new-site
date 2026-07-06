/**
 * GET  /api/unsubscribe  — Página de desuscripción para el usuario (click en enlace)
 * POST /api/unsubscribe  — One-click unsubscribe según RFC 8058 (mail clients automáticos)
 *
 * Gestiona la desuscripción de emails de campaña.
 * Recibe un token JWT firmado con el email del usuario.
 * Actualiza User.emailUnsubscribed = true y retorna una página HTML simple.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/client';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está configurado');
  return secret;
}

const htmlPage = (title: string, message: string, isError = false) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 12px; padding: 40px 48px; max-width: 420px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { margin: 0 0 12px; font-size: 22px; color: ${isError ? '#ef4444' : '#18181b'}; }
    p { margin: 0 0 24px; color: #71717a; font-size: 15px; line-height: 1.6; }
    a { display: inline-block; padding: 12px 28px; background: #18181b; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isError ? '❌' : '✅'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://jdevoto.cl">Volver al sitio</a>
  </div>
</body>
</html>`;

async function processUnsubscribe(token: string | null): Promise<NextResponse> {
  if (!token) {
    return new NextResponse(htmlPage('Enlace inválido', 'El enlace de desuscripción no es válido o ha expirado.', true), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { email: string; type: string };

    if (payload.type !== 'unsubscribe') {
      throw new Error('Tipo de token inválido');
    }

    const result = await prisma.user.updateMany({
      where: { email: payload.email, emailUnsubscribed: false },
      data: { emailUnsubscribed: true },
    });

    if (result.count === 0) {
      // Ya estaba desuscrito — respuesta igualmente exitosa (idempotente)
      return new NextResponse(
        htmlPage(
          'Ya estabas desuscrito',
          'Tu email ya no recibe campañas de JDevoto. Si esto fue un error, contáctanos en <a href="mailto:contacto@jdevoto.cl" style="color:#18181b">contacto@jdevoto.cl</a>.'
        ),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    return new NextResponse(
      htmlPage(
        'Te has desuscrito exitosamente',
        'Tu email no recibirá más campañas de JDevoto. Si esto fue un error, contáctanos en <a href="mailto:contacto@jdevoto.cl" style="color:#18181b">contacto@jdevoto.cl</a>.'
      ),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch {
    return new NextResponse(
      htmlPage('Enlace expirado', 'Este enlace de desuscripción ha expirado o no es válido. Por favor contáctanos directamente.', true),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/** GET: el usuario hace clic en el enlace desde su email */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  return processUnsubscribe(token);
}

/**
 * POST: one-click unsubscribe según RFC 8058.
 * Los clientes de email modernos hacen un POST automático al URL del header
 * List-Unsubscribe cuando el usuario pulsa "Cancelar suscripción" en la UI del cliente.
 * El token viene como query param (mismo URL que GET) o en el body como form-data.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let token = searchParams.get('token');

  // Algunos clientes de email envían el token como form-data
  if (!token) {
    try {
      const formData = await req.formData();
      token = formData.get('token') as string | null;
    } catch {
      // No era form-data, seguir con token=null
    }
  }

  const response = await processUnsubscribe(token);
  // RFC 8058: el cliente de email espera 2xx para confirmar el one-click
  // Devolver JSON si no es una página HTML (para compatibilidad con mail clients que no renderizan HTML)
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('text/html')) {
    return new NextResponse(null, { status: 200 });
  }
  return response;
}
