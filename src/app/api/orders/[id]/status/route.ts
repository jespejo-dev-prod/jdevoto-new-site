import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { orderService } from "@/modules/orders/domain/order.service";
import { logAuditAction } from "@/lib/audit";
import { UpdateOrderStatusSchema } from "@/validations/order.schemas";
import { UserRole, OrderStatus } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";

export const PATCH = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP, UserRole.COMPANY_ADMIN, UserRole.BUYER]);

  const { id } = await ctx.params;
  const body = await req.json();
  const { status, internalNotes } = UpdateOrderStatusSchema.parse(body);

  // Si es un cliente (BUYER o COMPANY_ADMIN), aplicar restricciones severas
  if (user.role === UserRole.BUYER || user.role === UserRole.COMPANY_ADMIN) {
    if (status !== OrderStatus.CANCELLED) {
      throw new ForbiddenError("No estás autorizado para realizar este cambio de estado.");
    }

    const order = await orderService.getOrderById(id);

    if (order.companyId !== user.companyId) {
      throw new ForbiddenError("No puedes modificar un pedido que no pertenece a tu empresa.");
    }

    if (
      order.status !== OrderStatus.DRAFT &&
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new ForbiddenError("Solo puedes cancelar pedidos en estado Borrador, Pendiente o Confirmado.");
    }
  }

  const updated = await orderService.updateOrderStatus(id, status, internalNotes);

  logAuditAction({
    action: "ORDER_STATUS_CHANGED",
    userId: user.id,
    entity: "Order",
    entityId: id,
    details: { newStatus: status, internalNotes },
    req,
  });

  return ok(updated);
});
