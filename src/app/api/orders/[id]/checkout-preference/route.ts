import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { paymentService } from "@/modules/billing/domain/payment.service";
import { extractUserFromRequest } from "@/lib/auth";

export const POST = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  const { id } = await ctx.params;
  const { prisma } = await import('@/lib/client');
  const order = await prisma.order.findUnique({ where: { id }, select: { companyId: true } });
  if (!order) {
    const { NotFoundError } = await import('@/lib/errors');
    throw new NotFoundError("Pedido", id);
  }
  const { requireOrderAccess } = await import('@/lib/auth');
  await requireOrderAccess(user, order.companyId);

  const url = new URL(req.url);
  const context = url.searchParams.get('context') || 'checkout';
  const result = await paymentService.createPreference(id, context as 'checkout' | 'invoice');
  return ok(result);
});
