/**
 * lib/api-handler.ts
 *
 * withApiHandler — HOF (Higher-Order Function) que envuelve todos los Route Handlers.
 *
 * Responsabilidades:
 *  1. Captura errores de dominio y los convierte en respuestas HTTP coherentes.
 *  2. Estandariza el formato de respuesta { success, data } / { success, error }.
 *  3. Proporciona una capa de logging centralizada.
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
} from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/client";
import { fileLogger } from "@/lib/file-logger";
import type { ApiError, ApiSuccess } from "@/types/domain";

type Handler<T = Record<string, string>> = (req: NextRequest, ctx: RouteContext<T>) => Promise<NextResponse>;

export interface RouteContext<T = Record<string, string>> {
  params: Promise<T>;
}

export function withApiHandler<T = Record<string, string>>(handler: Handler<T>): Handler<T> {
  return async (req: NextRequest, ctx: RouteContext<T>): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return await handleError(error, req);
    }
  };
}

async function handleError(error: unknown, req?: NextRequest): Promise<NextResponse<ApiError>> {
  // Error de validación Zod
  if (error instanceof ZodError) {
    return NextResponse.json<ApiError>(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Datos de entrada inválidos",
          details: error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  // Errores de dominio conocidos
  const isAppError = error && typeof error === 'object' && ('isAppError' in error || (error as any).isAppError === true || error instanceof AppError);
  if (isAppError) {
    const appError = error as any;
    const body: ApiError = {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.code === "VALIDATION_ERROR" ? appError.details : undefined,
      },
    };
    return NextResponse.json<ApiError>(body, { status: appError.statusCode });
  }

  // Errores de Prisma (ej: duplicados)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[]) || [];
      const field = target.includes("name") ? "nombre" : target.includes("slug") ? "slug" : "campo";
      
      const body: ApiError = {
        success: false,
        error: {
          code: "CONFLICT",
          message: `Ya existe un registro con ese ${field}`,
        },
      };
      return NextResponse.json<ApiError>(body, { status: 409 });
    }
  }

  // Error inesperado
  console.error("[API_ERROR]", error);

  // Registrar el error en la base de datos (SystemErrorLog)
  if (req) {
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      // Intentar extraer userId si está en el contexto
      let userId = undefined;
      const authHeader = req.headers.get("authorization");
      // (No desencriptaremos todo aquí por velocidad, pero si existiera un middleware de Context, se sacaría)
      const ipAddress = req.headers.get("x-forwarded-for") || undefined;

      // 1. Guardar en archivo local
      fileLogger.error(errorName, errorMessage, ipAddress, req.nextUrl.pathname, stack);

      // 2. Guardar en Base de Datos
      await prisma.systemErrorLog.create({
        data: {
          path: req.nextUrl.pathname,
          method: req.method,
          errorName,
          message: errorMessage,
          stack,
          ipAddress,
        }
      });
    } catch (logError) {
      console.error("Fallo al guardar SystemErrorLog:", logError);
    }
  }

  return NextResponse.json<ApiError>(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno del servidor",
      },
    },
    { status: 500 }
  );
}

// ============================================================
// Helpers de respuesta
// ============================================================

export function ok<T>(
  data: T,
  status = 200,
  meta?: Record<string, unknown>
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json<ApiSuccess<T>>(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status }
  );
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
