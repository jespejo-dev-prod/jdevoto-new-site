/**
 * app/api/orders/route.ts
 *
 * GET  /api/orders  — Lista de pedidos (filtrado por rol)
 * POST /api/orders  — Crear un nuevo pedido B2B
 */

import { NextRequest } from "next/server";
import { withApiHandler, ok, created } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import { orderService } from "@/modules/orders/domain/order.service";
import {
  CreateOrderSchema,
  GetOrdersQuerySchema,
} from "@/validations/order.schemas";
import { ForbiddenError } from "@/lib/errors";
import { UserRole, OrderStatus } from "@prisma/client";

// ============================================================
// GET /api/orders
// ============================================================

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);

  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const query = GetOrdersQuerySchema.parse(rawParams);

  // BUYER y COMPANY_ADMIN solo pueden ver pedidos de su propia empresa
  // ADMIN y SALES_REP pueden filtrar por cualquier empresa
  const companyContext =
    (user.role === UserRole.BUYER || user.role === UserRole.COMPANY_ADMIN) ? user.companyId ?? undefined : undefined;

  const result = await orderService.listOrders(query, companyContext);

  return ok(result.data, 200, { pagination: result.meta });
});

// ============================================================
// POST /api/orders
// ============================================================

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);

  // Todos los roles autenticados pueden crear pedidos,
  // pero BUYER solo puede crear para su propia empresa.
  const body = await req.json();
  const data = CreateOrderSchema.parse(body);

  // Aplicar restricción de empresa para BUYER y COMPANY_ADMIN
  if (user.role === UserRole.BUYER || user.role === UserRole.COMPANY_ADMIN) {
    if (data.companyId !== user.companyId) {
      throw new ForbiddenError(
        "No puedes crear pedidos para otra empresa"
      );
    }

    if (
      data.status &&
      data.status !== OrderStatus.DRAFT &&
      data.status !== OrderStatus.PENDING &&
      data.status !== OrderStatus.CONFIRMED
    ) {
      throw new ForbiddenError(
        `No estás autorizado a crear un pedido con estado '${data.status}'`
      );
    }
  }

  const order = await orderService.createOrder({
    companyId: data.companyId,
    createdById: user.id,
    items: data.items,
    notes: data.notes,
    status: data.status,
    paymentMethod: data.paymentMethod,
    createdAt: data.createdAt,
    shippingAddress: data.shippingAddress as Record<string, unknown> | undefined,
    billingAddress: data.billingAddress as Record<string, unknown> | undefined,
  });

  logAuditAction({
    action: "ORDER_CREATED",
    userId: user.id,
    entity: "Order",
    entityId: order.id,
    details: { totalAmount: order.totalGross, companyId: order.companyId },
    req,
  });


  return created(order);
});
