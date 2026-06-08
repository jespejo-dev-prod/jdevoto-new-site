/**
 * lib/errors.ts
 *
 * Jerarquía de errores de dominio.
 * Permite distinguir errores de negocio de errores inesperados.
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 — Datos de entrada inválidos
export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400);
    this.details = details;
  }
}

// 401 — No autenticado
export class UnauthorizedError extends AppError {
  constructor(message = "No autenticado") {
    super(message, "UNAUTHORIZED", 401);
  }
}

// 403 — Sin permisos
export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado") {
    super(message, "FORBIDDEN", 403);
  }
}

// 404 — Recurso no encontrado
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id
      ? `${resource} con id '${id}' no encontrado`
      : `${resource} no encontrado`;
    super(msg, "NOT_FOUND", 404);
  }
}

// 409 — Conflicto de negocio
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

// 422 — Error de regla de negocio
export class BusinessRuleError extends AppError {
  constructor(message: string, code = "BUSINESS_RULE_VIOLATION") {
    super(message, code, 422);
  }
}

// 500 — Error interno
export class InternalError extends AppError {
  constructor(message = "Error interno del servidor") {
    super(message, "INTERNAL_ERROR", 500);
  }
}
