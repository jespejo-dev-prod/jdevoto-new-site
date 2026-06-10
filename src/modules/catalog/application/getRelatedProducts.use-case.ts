/**
 * modules/catalog/application/getRelatedProducts.use-case.ts
 *
 * Recupera productos de la misma categoría para mostrar en la sección
 * "Productos Relacionados" de la página de detalle.
 *
 * Enriquece los resultados con precios B2B (companyId puede ser null
 * para devolver precios base en páginas públicas).
 */

import { prisma } from "@/lib/client";
import { serializeDecimal } from "@/lib/utils";
import { priceService } from "@/modules/pricing/domain/price.service";

export async function getRelatedProductsUseCase(
  categoryId: string | null,
  currentProductId: string,
  companyId: string | null,
  limit = 8
) {
  const hideSetting = await prisma.storeSettings.findUnique({
    where: { key: 'hideOutOfStock' },
  });
  const hideOutOfStock = hideSetting ? (hideSetting.value as boolean) === true : false;

  // Busca productos de la misma categoría excluyendo el producto actual
  const products = await prisma.product.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      id: { not: currentProductId },
      isActive: true,
      isDeleted: false,
      ...(hideOutOfStock ? { stockQuantity: { gt: 0 } } : {})
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sku: true,
      name: true,
      slug: true,
      basePrice: true,
      stockQuantity: true,
      minOrderQty: true,
      unit: true,
      inner: true,
      brandId: true,
      categoryId: true,
      category: { select: { id: true, name: true, isOutlet: true } },
      brand: { select: { id: true, name: true } },
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true, isPrimary: true },
      },
    },
  });

  if (products.length === 0) return [];

  // Enriquece con precios B2B y serializa Decimal → Number
  const enriched = await priceService.enrichProductsWithPrices(products as any, companyId);

  return enriched.map((p: any) => serializeDecimal(p as Record<string, unknown>));
}
