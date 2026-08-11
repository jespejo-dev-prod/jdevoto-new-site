import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { OrderStatus, PaymentStatus, UserRole } from "@prisma/client";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { ValidationError } from "@/lib/errors";

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
      throw new ValidationError("Pedido no encontrado");
    }

    const { requireOrderAccess } = await import('@/lib/auth');
    await requireOrderAccess(user, order.companyId);

    if (order.paymentStatus === PaymentStatus.PAID && !isTransferOnly && newPaymentMethod !== 'credit_b2b') {
      wasAlreadyPaid = true;
      return order;
    }

    const oldPaymentMethod = order.paymentMethod;
    const isCreditB2B = newPaymentMethod === 'credit_b2b';
    const wasCreditB2B = oldPaymentMethod === 'credit_b2b';

    // Validación y ajuste de crédito B2B
    if (isCreditB2B && !wasCreditB2B) {
      const company = await tx.company.findUnique({ where: { id: order.companyId } });
      if (!company) throw new ValidationError("Empresa no encontrada");
      
      const rowsAffected = await tx.$executeRaw`
        UPDATE "companies"
        SET "creditUsed" = "creditUsed" + ${Number(order.totalGross)}
        WHERE "id" = ${order.companyId}
          AND "creditLimit" - "creditUsed" >= ${Number(order.totalGross)}
      `;

      if (rowsAffected === 0) {
        throw new ValidationError("Crédito B2B insuficiente (o consumido por otra operación concurrente).");
      }
    } else if (!isCreditB2B && wasCreditB2B) {
      // Liberar crédito si cambia de B2B a otro método
      await tx.company.update({
        where: { id: order.companyId },
        data: { creditUsed: { decrement: Number(order.totalGross) } }
      });
    }

    if (isTransferOnly) {
      return await tx.order.update({
        where: { id },
        data: { paymentMethod: 'transfer' }, // Transfer stays PENDING until admin approves
      });
    }

    if (isCreditB2B) {
      return await tx.order.update({
        where: { id },
        data: { 
          paymentMethod: 'credit_b2b',
          status: OrderStatus.CONFIRMED, // B2B orders are auto-confirmed
          // En compras B2B el pago en sí queda pendiente hasta la fecha de vencimiento (30/60/90 días)
        },
      });
    }

    // Para Webpay/MercadoPago (cuando el webhook llama a esta ruta)
    return await tx.order.update({
      where: { id },
      data: {
        paymentMethod: newPaymentMethod || oldPaymentMethod,
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
      },
    });
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
        const { sendOrderStatusUpdateEmail, sendOrderEmail } = await import("@/lib/email");
        let customerEmail = (populatedOrder.billingAddress as any)?.email;
        if (!customerEmail) {
          customerEmail = populatedOrder.createdBy?.email || "ventas@tutiendab2b.cl";
        }
        
        // Si es solo cambio a transferencia, enviamos el correo original de pedido que incluye
        // los datos bancarios. Si es un pago exitoso (B2B o Webpay), enviamos la actualización de estado.
        if (isTransferOnly) {
          sendOrderEmail(populatedOrder, customerEmail).catch(emailErr => {
            console.error("Error al enviar correo de instrucciones de transferencia:", emailErr);
          });
        } else {
          sendOrderStatusUpdateEmail(populatedOrder, customerEmail).catch(emailErr => {
            console.error("Error al enviar correo tras pago exitoso:", emailErr);
          });
        }
      }
    } catch (emailErr) {
      console.error("Error en preparación de correo:", emailErr);
    }
  }

  return ok(updatedOrder);
});
