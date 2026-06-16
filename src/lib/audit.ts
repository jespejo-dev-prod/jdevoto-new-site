import { prisma } from "@/lib/client";
import { NextRequest } from "next/server";

import { fileLogger } from "./file-logger";

export type AuditAction = 
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_STATUS_CHANGED"
  | "USER_REGISTERED"
  | "USER_UPDATED"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "2FA_FAILED"
  | "LOGIN_SUCCESS_2FA";

interface AuditLogOptions {
  userId?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  details?: Record<string, any>;
  req?: NextRequest;
}

/**
 * Registra una acción en el AuditLog de la base de datos de manera asíncrona
 * (No interrumpe el flujo principal si falla)
 */
export function logAuditAction(options: AuditLogOptions) {
  // Ejecutamos en background sin await
  setTimeout(async () => {
    try {
      let ipAddress = undefined;
      if (options.req) {
        ipAddress = options.req.headers.get("x-forwarded-for") || undefined;
      }

      // 1. Guardar en Archivo Local
      fileLogger.audit(options.action, options.userId, ipAddress, options.details);

      // 2. Guardar en Base de Datos
      await prisma.auditLog.create({
        data: {
          userId: options.userId,
          action: options.action,
          entity: options.entity,
          entityId: options.entityId,
          details: options.details ? JSON.stringify(options.details) : null,
          ipAddress,
        }
      });
    } catch (error) {
      // Usamos console.error para no fallar el flujo
      console.error("[AUDIT_LOG_ERROR] Fallo al registrar auditoría:", error);
    }
  }, 0);
}
