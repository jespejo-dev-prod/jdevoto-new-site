import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export const PATCH = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params;

  // Update order status and payment status in database
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.CONFIRMED, // CONFIRMED represents an order confirmed for processing
    },
  });

  return ok(updatedOrder);
});
