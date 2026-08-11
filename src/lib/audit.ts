import { prisma } from "@/lib/client";
import { NextRequest } from "next/server";


import { notifyAdminAction } from "./admin-notifications";

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
  | "USER_DELETED"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "CATALOG_IMPORTED"
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_DELETED"
  | "BRAND_CREATED"
  | "BRAND_UPDATED"
  | "BRAND_DELETED"
  | "PROMOTION_CREATED"
  | "PROMOTION_UPDATED"
  | "PROMOTION_DELETED"
  | "COMPANY_CREATED"
  | "COMPANY_UPDATED"
  | "COMPANY_DELETED"
  | "PAYMENT_METHOD_CREATED"
  | "PAYMENT_METHOD_UPDATED"
  | "PAYMENT_METHOD_DELETED"
  | "SETTINGS_UPDATED"
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
export async function logAuditAction(options: AuditLogOptions) {
  try {
    let ipAddress = undefined;
    if (options.req) {
      ipAddress = options.req.headers.get("x-forwarded-for") || undefined;
    }

    // Guardar en Base de Datos
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

    // 3. Notificar al Admin si aplica
    await notifyAdminAction(options.action, options.userId, options.details);
  } catch (error) {
    // Usamos console.error para no fallar el flujo
    console.error("[AUDIT_LOG_ERROR] Fallo al registrar auditoría:", error);
  }
}
