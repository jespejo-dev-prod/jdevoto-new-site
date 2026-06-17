import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Rate limit en memoria (Edge-compatible, estado por worker)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 1000; // 1000 peticiones cada 15 min por IP (evita bloqueos de Next.js prefetch)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ==========================================
  // 1. BLOQUEO DE ARCHIVOS SENSIBLES
  // ==========================================
  const sensitivePatterns = ['.env', '.git', '.sql', '.yaml', '.yml'];
  if (sensitivePatterns.some(pattern => pathname.includes(pattern))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // ==========================================
  // 2. RATE LIMITING (MITIGACIÓN BOT/BRUTE FORCE)
  // ==========================================
  const ip = request.headers.get("x-forwarded-for") || 'unknown';
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.0.0.') || ip === 'localhost';
  const isDev = process.env.NODE_ENV === 'development';

  if (ip !== 'unknown' && !isLocal && !isDev) {
    const now = Date.now();
    const limitRecord = rateLimitMap.get(ip);

    if (limitRecord && limitRecord.resetAt > now) {
      limitRecord.count++;
      if (limitRecord.count > MAX_REQUESTS) {
        return new NextResponse('Too Many Requests. Please try again later.', { status: 429 });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }
  }

  // ==========================================
  // 3. VALIDACIÓN DE TOKENS JWT (CON `jose`)
  // ==========================================
  const refreshToken = request.cookies.get('refresh_token')?.value;
  let isAuthenticated = false;

  if (refreshToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(refreshToken, secret);
      isAuthenticated = true; // Firma criptográfica válida
    } catch (error) {
      // Si el token es falso o expiró, isAuthenticated queda en false
      isAuthenticated = false;
    }
  }

  // ==========================================
  // 4. LÓGICA DE RUTAS Y REDIRECCIONES
  // ==========================================
  const isProtectedRoute = pathname.startsWith('/dashboard')
    || pathname.startsWith('/orders')
    || pathname.startsWith('/checkout')
    || pathname.startsWith('/cart')
    || pathname.startsWith('/wishlist');

  const isGuestRoute = pathname === '/login'
    || pathname === '/register';

  // Redirigir a login si intenta entrar a zona protegida sin token real
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(url);
    if (refreshToken) {
      response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });
    }
    return response;
  }

  // Si no es ruta protegida, pero el token no es válido y existe la cookie, la limpiamos
  if (refreshToken && !isAuthenticated) {
    const response = NextResponse.next();
    response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });
    return response;
  }

  // Redirigir a dashboard si ya está autenticado e intenta ir a login
  if (isGuestRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si todo está bien, dejamos pasar la petición a Next.js (y se le aplicarán los headers de next.config.ts)
  return NextResponse.next();
}

/**
 * config.matcher
 *
 * Intercepta todas las rutas, INCLUYENDO /api para protegerla a nivel perimetral.
 * Solo excluimos assets estáticos e imágenes.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
