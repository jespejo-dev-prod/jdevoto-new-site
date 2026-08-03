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
import { ValidationError } from "@/lib/errors";

export const GET = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  const { id } = await ctx.params;

  // Si es BUYER, el servicio validará que el pedido pertenezca a su empresa
  const companyContext = user.role === UserRole.BUYER ? user.companyId ?? undefined : undefined;

  const order = await orderService.getOrderById(id, companyContext);

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
