import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { paymentService } from "@/modules/billing/domain/payment.service";

export const POST = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const context = url.searchParams.get('context') || 'checkout';
  const result = await paymentService.createPreference(id, context as 'checkout' | 'invoice');
  return ok(result);
});
