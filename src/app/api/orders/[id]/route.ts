/**
 * app/api/orders/[id]/route.ts
 *
 * GET /api/orders/:id — Obtener detalle completo de un pedido
 */

import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { orderService } from "@/modules/orders/domain/order.service";
import { UserRole } from "@prisma/client";
import { ValidationError, BusinessRuleError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/client";

export const GET = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  const { id } = await ctx.params;

  const isCustomer = user.role === UserRole.BUYER || user.role === UserRole.COMPANY_ADMIN;
  const companyContext = isCustomer ? (user.companyId ?? undefined) : undefined;
  const salesRepContext = user.role === UserRole.SALES_REP ? user.id : undefined;

  const order = await orderService.getOrderById(id, companyContext, salesRepContext);

  return ok(order);
});

export const PATCH = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { id } = await ctx.params;
  const body = await req.json();
  
  if (body.shippingAddress) {
    if (!body.shippingAddress.street || !body.shippingAddress.region || !body.shippingAddress.comuna) {
      throw new ValidationError("La dirección de envío es incompleta. Falta calle/número, región o comuna.");
    }
  }
  
  // Validación estricta de IDOR para Vendedores (SALES_REP) siempre
  if (user.role === UserRole.SALES_REP) {
    const orderTarget = await prisma.order.findUnique({
      where: { id },
      include: { company: true }
    });
    if (!orderTarget) throw new NotFoundError("Pedido", id);
    if (orderTarget.company?.salesRepId !== user.id) {
      throw new BusinessRuleError("No tienes permiso para editar un pedido que no pertenece a tu cartera.", "FORBIDDEN_ORDER_UPDATE");
    }
  }

  // Por simplicidad en este paso, pasamos el body directamente al servicio.
  // En producción, esto debería validarse con un OrderUpdateSchema.
  const updatedOrder = await orderService.updateOrder(id, body);

  return ok(updatedOrder);
});

export const DELETE = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  // Solo administradores o vendedores pueden borrar borradores
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { id } = await ctx.params;
  await orderService.deleteOrder(id);

  return ok({ message: "Pedido eliminado correctamente" });
});
