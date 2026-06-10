/**
 * modules/catalog/application/getBundleSuggestion.use-case.ts
 *
 * Recupera un producto complementario para la sección "Sugerencia de compra"
 * de la página de detalle. Busca en la misma marca Y categoría del producto actual.
 *
 * Retorna null si no existe un producto complementario.
 */

import { prisma } from "@/lib/client";
import { serializeDecimal } from "@/lib/utils";
import { priceService } from "@/modules/pricing/domain/price.service";

export async function getBundleSuggestionUseCase(
  categoryId: string | null,
  brandId: string | null,
  currentProductId: string,
  companyId: string | null
) {
  const hideSetting = await prisma.storeSettings.findUnique({
    where: { key: 'hideOutOfStock' },
  });
  const hideOutOfStock = hideSetting ? (hideSetting.value as boolean) === true : false;

  // Busca UN producto de la misma marca y categoría (excluye el actual)
  const product = await prisma.product.findFirst({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(brandId ? { brandId } : {}),
      id: { not: currentProductId },
      isActive: true,
      isDeleted: false,
      ...(hideOutOfStock ? { stockQuantity: { gt: 0 } } : {})
    },
    select: {
      id: true,
      sku: true,
      name: true,
      slug: true,
      basePrice: true,
      minOrderQty: true,
      inner: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  });

  if (!product) return null;

  // Enriquece con precio B2B
  const [enriched] = await priceService.enrichProductsWithPrices([product as any], companyId);

  // Serializa recursivamente Decimals → Numbers para Client Components
  return serializeDecimal(enriched as any);
}
