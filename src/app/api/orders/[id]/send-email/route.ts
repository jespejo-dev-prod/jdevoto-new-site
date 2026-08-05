import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { orderService } from "@/modules/orders/domain/order.service";
import { sendOrderEmail } from "@/lib/email";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/client";

export const POST = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP, UserRole.COMPANY_ADMIN, UserRole.BUYER]);

  const { id } = await ctx.params;
  const order = await orderService.getOrderById(id);

  // Determine recipient email
  let customerEmail = (order.billingAddress as any)?.email;
  if (!customerEmail) {
    const orderCreator = await prisma.user.findUnique({ where: { id: order.createdById }, select: { email: true } });
    customerEmail = orderCreator?.email || "ventas@tutiendab2b.cl";
  }

  const body = await req.json().catch(() => ({}));
  const isTransferRequest = !!body.isTransferRequest;

  const result = await sendOrderEmail(order, customerEmail, isTransferRequest);

  if (!result.success) {
    throw new Error("No se pudo enviar el correo");
  }

  return ok({ 
    message: "Correo enviado correctamente", 
    messageId: result.messageId
  });
});
