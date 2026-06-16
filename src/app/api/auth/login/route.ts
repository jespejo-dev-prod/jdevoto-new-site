/**
 * app/api/auth/login/route.ts
 *
 * POST /api/auth/login — Autenticación de usuario (email + password)
 * Controlador delegado al Caso de Uso (Clean Architecture).
 */

import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { LoginSchema, loginUseCase } from "@/modules/auth/application/login.use-case";
import { logAuditAction } from "@/lib/audit";

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const input = LoginSchema.parse(body);

  let result;
  try {
    result = await loginUseCase(input);
  } catch (err: any) {
    // Registrar intento fallido antes de lanzar el error al handler global
    logAuditAction({
      action: "LOGIN_FAILED",
      details: { email: input.email, reason: err.message },
      req,
    });
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

  logAuditAction({
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
