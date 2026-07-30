import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { OrderStatus, PaymentStatus, UserRole } from "@prisma/client";
import { extractUserFromRequest, requireRole } from "@/lib/auth";

export const PATCH = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const newPaymentMethod = body.paymentMethod;

  let wasAlreadyPaid = false;
  let isTransferOnly = newPaymentMethod === 'transfer';

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    // Role check: Admin/Sales Rep or owner company
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SALES_REP;
    if (!isAdmin && order.companyId !== user.companyId) {
      throw new Error("No tienes permisos para pagar este pedido");
    }

    if (order.paymentStatus === PaymentStatus.PAID && !isTransferOnly) {
      wasAlreadyPaid = true;
      return order;
    }

    if (isTransferOnly) {
      return await tx.order.update({
        where: { id },
        data: { paymentMethod: 'transfer' },
      });
    }

    const updated = await tx.order.update({
      where: { id },
      data: {
        paymentMethod: newPaymentMethod || order.paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
      },
    });

    const finalPaymentMethod = newPaymentMethod || order.paymentMethod;
    if (finalPaymentMethod === 'credit_b2b') {
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
