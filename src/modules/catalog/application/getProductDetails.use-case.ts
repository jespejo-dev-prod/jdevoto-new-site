/**
 * modules/catalog/application/getProductDetails.use-case.ts
 *
 * Recupera los datos de un producto por slug para el critical path de la página.
 *
 * IMPORTANTE: Este use case NO llama al PriceService intencionalmente.
 * El precio B2B se calcula de forma asíncrona en el cliente (BuyBox → /api/catalog/price/[slug]).
 * Resultado: una sola query a la DB → HTML disponible en ~20ms.
 */

import { prisma } from "@/lib/client";
import { serializeDecimal } from "@/lib/utils";
import { NotFoundError } from "@/lib/errors";

export async function getProductDetailsUseCase(slugOrId: string) {
  const selectFields = {
    id: true,
    sku: true,
    name: true,
    slug: true,
    description: true,
    basePrice: true,
    stockQuantity: true,
    minOrderQty: true,
    unit: true,
    inner: true,
    weight: true,
    length: true,
    width: true,
    height: true,
    brandId: true,
    categoryId: true,
    specifications: true,
    category: { select: { id: true, name: true, slug: true, isOutlet: true } },
    brand: { select: { id: true, name: true, slug: true } },
    images: {
      select: { url: true, isPrimary: true, altText: true, position: true },
      orderBy: { position: "asc" as const },
    },
  };

  let product = await prisma.product.findUnique({
    where: { slug: slugOrId, isActive: true },
    select: selectFields,
  });

  // Si no se encuentra por slug, intentar buscar por ID
  if (!product) {
    product = await prisma.product.findUnique({
      where: { id: slugOrId, isActive: true },
      select: selectFields,
    });
  }

  if (!product) throw new NotFoundError("Producto", slugOrId);

  // Convierte recursivamente Decimal/BigInt de Prisma a Number para Client Components
  return serializeDecimal(product as any);
}
