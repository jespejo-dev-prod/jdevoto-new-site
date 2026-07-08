import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { priceService } from "@/modules/pricing/domain/price.service";

interface RawValidationItem {
  sku: string;
  quantity: number;
}

export const POST = withApiHandler(async (req: NextRequest) => {
  // 1. Obtener usuario autenticado y su contexto B2B
  const user = extractUserFromRequest(req);
  const companyId = user.companyId || null;

  // 2. Parsear el cuerpo de la petición
  const body = await req.json();
  const rawItems: RawValidationItem[] = body.items;

  if (!rawItems || !Array.isArray(rawItems)) {
    return NextResponse.json(
      { success: false, error: "El formato de la petición debe ser un arreglo en la propiedad 'items'." },
      { status: 400 }
    );
  }

  if (rawItems.length === 0) {
    return ok({ results: [] });
  }

  // Limpiar y normalizar SKUs ingresados
  const itemsMap = new Map<string, number>();
  rawItems.forEach(item => {
    if (item.sku && typeof item.sku === "string") {
      const cleanSku = item.sku.trim().toUpperCase();
      const qty = Number(item.quantity) || 1;
      itemsMap.set(cleanSku, (itemsMap.get(cleanSku) || 0) + qty);
    }
  });

  const skus = Array.from(itemsMap.keys());

  // 3. Buscar productos en la base de datos en una sola consulta optimizada
  const productsRaw = await prisma.product.findMany({
    where: {
      sku: { in: skus },
      isActive: true,
    },
    select: {
      id: true,
      sku: true,
      name: true,
      slug: true,
      brandId: true,
      unit: true,
      inner: true,
      minOrderQty: true,
      stockQuantity: true,
      basePrice: true,
      brand: { select: { name: true } },
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  });

  // 4. Enriquecer los productos encontrados con los precios B2B dinámicos
  const enrichedProducts = await priceService.enrichProductsWithPrices(
    productsRaw as any,
    companyId
  );

  // Crear mapa para búsquedas rápidas en memoria
  const productsBySku = new Map<string, typeof enrichedProducts[0]>();
  enrichedProducts.forEach(p => {
    productsBySku.set(p.sku.toUpperCase(), p);
  });

  // 5. Procesar los resultados y clasificar cada SKU solicitado
  const results = skus.map(requestedSku => {
    const product = productsBySku.get(requestedSku);
    const requestedQty = itemsMap.get(requestedSku) || 1;

    if (!product) {
      return {
        sku: requestedSku,
        requestedQty,
        isValid: false,
        error: "SKU no encontrado",
        product: null,
      };
    }

    const minOrderQty = Number(product.inner || 1);
    const stockQty = Number(product.stockQuantity || 0);

    const warnings: string[] = [];
    if (requestedQty < minOrderQty) {
      warnings.push(`Cantidad mínima de pedido es ${minOrderQty}`);
    }
    if (requestedQty > stockQty) {
      warnings.push(`Stock insuficiente (disponible: ${stockQty})`);
    }

    return {
      sku: requestedSku,
      requestedQty,
      isValid: warnings.length === 0,
      warnings,
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        brand: (product.brand as any)?.name || "J. Devoto",
        unit: product.unit,
        inner: product.inner,
        minOrderQty,
        stockQuantity: stockQty,
        image: (product.images?.[0] as any)?.url || "",
        price: {
          unitNetPrice: Number(product.price.unitNetPrice),
          discountedNetPrice: Number(product.price.discountedNetPrice),
          unitGrossPrice: Number(product.price.unitGrossPrice),
          originalPrice: Number(product.price.unitNetPrice),
          discountPercent: Number(product.price.discountPercent),
          priceSource: product.price.priceSource,
        },
      },
    };
  });

  return ok({ results });
});
