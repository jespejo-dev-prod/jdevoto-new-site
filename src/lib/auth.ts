/**
 * lib/auth.ts
 *
 * Utilidades de autenticación: JWT y extracción del usuario desde el Request.
 */

import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import type { AuthenticatedUser, TokenPayload } from "@/types/domain";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}

// ============================================================
// GENERACIÓN DE TOKENS
// ============================================================

export function signAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "1d" } as jwt.SignOptions);
}

// ============================================================
// VERIFICACIÓN
// ============================================================

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    throw new UnauthorizedError("Token inválido o expirado");
  }
}

// ============================================================
// EXTRACCIÓN DEL USUARIO DESDE EL REQUEST
// ============================================================

/**
 * Extrae y valida el token JWT del header Authorization.
 * Lanza UnauthorizedError si falta o es inválido.
 */
export function extractUserFromRequest(req: NextRequest): AuthenticatedUser {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Header Authorization requerido");
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    companyId: payload.companyId,
    firstName: "",
    lastName: "",
  };
}

// ============================================================
// GUARD DE ROLES
// ============================================================

/**
 * Verifica que el usuario tenga uno de los roles permitidos.
 * Uso: requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP])
 */
export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: UserRole[]
): void {
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `Rol '${user.role}' no tiene acceso a este recurso`
    );
  }
}
