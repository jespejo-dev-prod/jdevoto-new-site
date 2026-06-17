import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export const PATCH = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params;

  let wasAlreadyPaid = false;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      wasAlreadyPaid = true;
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

  // Enviar correo de confirmación de pago
  if (!wasAlreadyPaid) {
    try {
      const populatedOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  images: { where: { isPrimary: true }, take: 1 }
                }
              }
            }
          },
          company: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (populatedOrder) {
        const { sendOrderEmail } = await import("@/lib/email");
        let customerEmail = (populatedOrder.billingAddress as any)?.email;
        if (!customerEmail) {
          customerEmail = populatedOrder.createdBy?.email || "ventas@tutiendab2b.cl";
        }
        await sendOrderEmail(populatedOrder, customerEmail);
      }
    } catch (emailErr) {
      console.error("Error al enviar correo tras pago simulado:", emailErr);
    }
  }

  return ok(updatedOrder);
});
