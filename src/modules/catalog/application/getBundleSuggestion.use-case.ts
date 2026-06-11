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

  // 1. Obtener la categoría actual y resolver la categoría padre (incluyendo subcategorías)
  let categoryIds: string[] = [];
  if (categoryId) {
    const currentCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, parentId: true }
    });

    if (currentCategory) {
      const parentId = currentCategory.parentId || currentCategory.id;
      const subcategories = await prisma.category.findMany({
        where: { parentId: parentId },
        select: { id: true }
      });
      categoryIds = [parentId, ...subcategories.map(c => c.id)];
    } else {
      categoryIds = [categoryId];
    }
  }

  const categoryFilter = categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {};

  // 2. Intentar encontrar un producto de la misma marca dentro de la categoría padre
  let product = await prisma.product.findFirst({
    where: {
      ...categoryFilter,
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

  // 3. Fallback: buscar un producto de cualquier marca dentro de la categoría padre
  if (!product && categoryIds.length > 0) {
    product = await prisma.product.findFirst({
      where: {
        ...categoryFilter,
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
  }

  if (!product) return null;

  // Enriquece con precio B2B
  const [enriched] = await priceService.enrichProductsWithPrices([product as any], companyId);

  // Serializa recursivamente Decimals → Numbers para Client Components
  return serializeDecimal(enriched as any);
}
