import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export const PATCH = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return order;
    }

    const updated = await tx.order.update({
      where: { id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
      },
    });

    if (order.paymentMethod === 'credit_b2b') {
      await tx.company.update({
        where: { id: order.companyId },
        data: {
          creditUsed: {
            decrement: Number(order.totalGross),
          },
        },
      });
    }

    return updated;
  });

  return ok(updatedOrder);
});
