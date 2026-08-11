/**
 * app/api/orders/[id]/repeat/route.ts
 *
 * POST /api/orders/:id/repeat — Repetir un pedido anterior cargando sus productos al carrito con precios B2B actuales
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { priceService } from "@/modules/pricing/domain/price.service";
import { NotFoundError, ForbiddenError, BusinessRuleError } from "@/lib/errors";
import { UserRole, OrderStatus } from "@prisma/client";
import { orderService } from "@/modules/orders/domain/order.service";

export const POST = withApiHandler(async (req: NextRequest, ctx: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  const { id } = await ctx.params;

  // 1. Obtener la orden con sus items
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 }
            }
          }
        }
      }
    }
  });

  if (!order) throw new NotFoundError("Pedido", id);

  // 2. Verificar permisos / Alcance de la empresa
  const { requireOrderAccess } = await import('@/lib/auth');
  await requireOrderAccess(user, order.companyId);

  // 3. Extraer los productos de los items de la orden
  const companyId = order.companyId;
  const productsRaw = order.items
    .map(item => item.product)
    .filter(product => product && product.isActive);

  if (productsRaw.length === 0) {
    throw new BusinessRuleError("El pedido no contiene ningún producto activo disponible en el catálogo actualmente.", "NO_ACTIVE_PRODUCTS");
  }

  // 4. Enriquecer los productos con precios comerciales B2B actuales para la empresa cliente de una sola vez
  const enrichedProducts = await priceService.enrichProductsWithPrices(productsRaw, companyId);

  // 5. Mapear al formato que espera el carrito en el frontend
  const itemsToLoad = order.items.map(item => {
    const product = enrichedProducts.find(p => p.id === item.productId);
    if (!product) return null; // Omitir si el producto ya no está activo

    // Ajustar la cantidad al stock disponible actual de forma segura
    const quantityToLoad = Math.min(item.quantity, Number(product.stockQuantity));
    
    if (quantityToLoad <= 0) return null; // Omitir si el stock actual es 0

    return {
      product: {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        images: product.images,
        minOrderQty: product.minOrderQty,
        stockQuantity: Number(product.stockQuantity),
        price: product.price
      },
      quantity: quantityToLoad
    };
  }).filter(Boolean);

  if (itemsToLoad.length === 0) {
    throw new BusinessRuleError("Todos los productos del pedido anterior no cuentan con stock disponible en este momento.", "OUT_OF_STOCK_PRODUCTS");
  }

  const directCheckout = req.nextUrl.searchParams.get("directCheckout") === "true";
  
  if (directCheckout) {

    const newOrder = await orderService.createOrder({
      companyId: order.companyId,
      createdById: user.id,
      items: itemsToLoad.map(item => ({
        productId: item!.product.id,
        quantity: item!.quantity
      })),
      notes: `Pedido clonado a partir de ${order.orderNumber}${order.notes ? `\n\nNotas originales: ${order.notes}` : ''}`,
      status: OrderStatus.PENDING,
      paymentMethod: order.paymentMethod || "Transferencia",
      shippingAddress: (order.shippingAddress as Record<string, unknown>) || undefined,
      billingAddress: (order.billingAddress as Record<string, unknown>) || undefined,
    });

    return ok({ isDirect: true, orderId: newOrder.id, orderNumber: newOrder.orderNumber });
  }

  return ok(itemsToLoad);
});
