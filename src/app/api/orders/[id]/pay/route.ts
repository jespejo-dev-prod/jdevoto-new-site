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

    if (order.paymentStatus === PaymentStatus.PAID && !isTransferOnly && newPaymentMethod !== 'credit_b2b') {
      wasAlreadyPaid = true;
      return order;
    }

    if (isTransferOnly) {
      if (order.paymentMethod === 'credit_b2b') {
        await tx.company.update({
          where: { id: order.companyId },
          data: { creditUsed: { decrement: Number(order.totalGross) } }
        });
      }
      return await tx.order.update({
        where: { id },
        data: { paymentMethod: 'transfer' },
      });
    }

    if (newPaymentMethod === 'credit_b2b') {
      if (order.paymentMethod !== 'credit_b2b') {
        await tx.company.update({
          where: { id: order.companyId },
          data: { creditUsed: { increment: Number(order.totalGross) } }
        });
        return await tx.order.update({
          where: { id },
          data: { paymentMethod: 'credit_b2b' },
        });
      }
      return order;
    }

    const updated = await tx.order.update({
      where: { id },
      data: {
        paymentMethod: newPaymentMethod || order.paymentMethod,
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
        const { sendOrderStatusUpdateEmail } = await import("@/lib/email");
        let customerEmail = (populatedOrder.billingAddress as any)?.email;
        if (!customerEmail) {
          customerEmail = populatedOrder.createdBy?.email || "ventas@tutiendab2b.cl";
        }
        await sendOrderStatusUpdateEmail(populatedOrder, customerEmail);
      }
    } catch (emailErr) {
      console.error("Error al enviar correo tras pago:", emailErr);
    }
  }

  return ok(updatedOrder);
});
