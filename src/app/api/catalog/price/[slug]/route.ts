/**
 * GET /api/catalog/price/[slug]
 *
 * Retorna el precio B2B calculado para el usuario autenticado.
 * Si no hay usuario autenticado, retorna el precio base con IVA 19%.
 *
 * Patrón Opción A:
 *   - La página de producto renderiza con precio base estático (instantáneo)
 *   - El BuyBox llama a este endpoint al montar para obtener precio B2B
 *   - Users sin login → precio base con IVA
 *   - Users con empresa → precio de su lista B2B
 */

import { withApiHandler, ok } from "@/lib/api-handler";
import { getServerUser } from "@/lib/server-auth";
import { prisma } from "@/lib/client";
import { priceService } from "@/modules/pricing/domain/price.service";
import { NotFoundError } from "@/lib/errors";

export const GET = withApiHandler(async (_req, { params }) => {
  const { slug } = await (params as Promise<{ slug: string }>);

  // Cargar producto base con categoría (necesaria para detectar Outlet)
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: { category: true },
  });

  if (!product) throw new NotFoundError("Producto", slug);

  // Usuario autenticado — puede ser null si no está logueado
  const user = await getServerUser();
  const companyId = user?.companyId || null;

  // Motor de precios B2B (con cache unstable_cache de Next.js)
  const [enriched] = await priceService.enrichProductsWithPrices(
    [product],
    companyId
  );

  return ok({
    price: {
      unitNetPrice: Number(enriched.price.unitNetPrice),
      unitGrossPrice: Number(enriched.price.unitGrossPrice),
      discountPercent: Number(enriched.price.discountPercent),
      discountedNetPrice: Number(enriched.price.discountedNetPrice),
      taxAmount: Number(enriched.price.taxAmount),
      priceSource: enriched.price.priceSource,
    },
    stockQuantity: Number(product.stockQuantity),
  });
});
