/**
 * app/api/auth/login/route.ts
 *
 * POST /api/auth/login — Autenticación de usuario (email + password)
 * Controlador delegado al Caso de Uso (Clean Architecture).
 */

import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { LoginSchema, loginUseCase } from "@/modules/auth/application/login.use-case";
import { logAuditAction } from "@/lib/audit";

interface FailedAttempts {
  count: number;
  blockedUntil: number;
}

const loginAttempts = new Map<string, FailedAttempts>();

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export const POST = withApiHandler(async (req: NextRequest) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (attempt) {
    if (attempt.blockedUntil > now) {
      const remainingMinutes = Math.ceil((attempt.blockedUntil - now) / 60000);
      return NextResponse.json({
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: `Demasiados intentos fallidos. Tu dirección IP ha sido bloqueada. Por favor, intenta de nuevo en ${remainingMinutes} ${remainingMinutes === 1 ? 'minuto' : 'minutos'}.`
        }
      }, { status: 429 });
    } else if (attempt.blockedUntil > 0) {
      // El bloqueo ya expiró. Reseteamos el contador de intentos.
      loginAttempts.delete(ip);
    }
  }

  const body = await req.json();
  const input = LoginSchema.parse(body);

  let result;
  try {
    result = await loginUseCase(input);
    // En caso de éxito, limpiamos los intentos fallidos de esta IP
    loginAttempts.delete(ip);
  } catch (err: any) {
    // Registrar intento fallido antes de lanzar el error al handler global
    const current = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.blockedUntil = Date.now() + 10 * 60 * 1000; // 10 minutos
    }
    loginAttempts.set(ip, current);

    await logAuditAction({
      action: "LOGIN_FAILED",
      details: { email: input.email, reason: err.message },
      req,
    });

    if (current.count >= 5) {
      return NextResponse.json({
        success: false,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Demasiados intentos fallidos. Tu dirección IP ha sido bloqueada por 10 minutos."
        }
      }, { status: 429 });
    }

    throw err;
  }

  if (result.requires2fa) {
    return ok({
      requires_2fa: true,
      userId: result.userId,
      email: result.email,
    });
  }

  // Establecer cookie httpOnly con expiración de 1 día (24 horas)
  const { cookies } = await import("next/headers");
  (await cookies()).set("refresh_token", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 día en segundos
  });

  await logAuditAction({
    action: "LOGIN_SUCCESS",
    userId: result.user.id,
    details: { email: result.user.email, name: `${result.user.firstName} ${result.user.lastName}`.trim() },
    req,
  });

  return ok({
    access_token: result.accessToken,
    token_type: "Bearer",
    user: result.user,
  });
});
