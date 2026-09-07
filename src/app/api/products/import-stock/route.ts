import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UserRole, Prisma } from "@prisma/client";
import { z } from "zod";
import { logAuditAction } from "@/lib/audit";

// Esquema para validar cada elemento a actualizar (se permite stock negativo si la BD/negocio lo maneja)
const ImportStockItemSchema = z.object({
  sku: z.string().min(1, "El SKU no puede estar vacío").toUpperCase(),
  stock: z.coerce.number().int("El stock debe ser un número entero").nullable().optional(),
  price: z.coerce.number().min(0, "El precio no puede ser negativo").nullable().optional(),
});

const ImportStockBodySchema = z.object({
  updates: z.array(z.any()), // Validar que sea un array, procesamos los elementos individualmente
});

export const POST = withApiHandler(async (req: NextRequest) => {
  // 1. Validar autenticación y rol de administrador
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  // 2. Parsear y validar el body de la petición
  const body = await req.json();
  const { updates: rawUpdates } = ImportStockBodySchema.parse(body);

  if (!rawUpdates || rawUpdates.length === 0) {
    return ok({
      successes: [],
      failures: [],
      message: "No se recibieron datos para actualizar.",
    });
  }

  const successList: any[] = [];
  const failuresList: any[] = [];
  const validatedUpdates: Array<z.infer<typeof ImportStockItemSchema>> = [];

  // 3. Validar cada elemento individualmente con Zod
  for (const rawItem of rawUpdates) {
    const result = ImportStockItemSchema.safeParse(rawItem);
    if (!result.success) {
      const errorMsgs = Object.values(result.error.flatten().fieldErrors)
        .flat()
        .join(", ");
      failuresList.push({
        sku: rawItem.sku || "SKU_DESCONOCIDO",
        reason: `Datos de entrada inválidos: ${errorMsgs}`,
      });
    } else {
      validatedUpdates.push(result.data);
    }
  }

  if (validatedUpdates.length === 0) {
    return ok({
      successes: [],
      failures: failuresList,
    });
  }

  // 4. Obtener los SKUs únicos a buscar (incluyendo variantes acolchadas con ceros)
  const skusToQuery = new Set<string>();
  for (const u of validatedUpdates) {
    skusToQuery.add(u.sku);
    if (/^\d+$/.test(u.sku) && u.sku.length < 7) {
      skusToQuery.add(u.sku.padStart(7, "0"));
    }
  }

  // 5. Buscar qué productos existen en la base de datos con su stock y precio actual
  const existingProducts = await prisma.product.findMany({
    where: {
      sku: { in: Array.from(skusToQuery) },
      isDeleted: false,
    },
    select: {
      sku: true,
      stockQuantity: true,
      basePrice: true,
    },
  });

  const existingSkuMap = new Map(existingProducts.map((p) => [p.sku, p]));
  const updatePromises: any[] = [];
  const resolvedSkuToUpdateMap = new Map<string, typeof validatedUpdates[number]>();
  const unchangedProducts: typeof existingProducts = [];

  // 6. Separar registros existentes de los que no existen
  for (const item of validatedUpdates) {
    let resolvedSku = item.sku;

    // Si el SKU exacto no existe, pero la versión acolchada a 7 dígitos sí existe, la usamos
    if (!existingSkuMap.has(resolvedSku)) {
      if (/^\d+$/.test(resolvedSku) && resolvedSku.length < 7) {
        const padded = resolvedSku.padStart(7, "0");
        if (existingSkuMap.has(padded)) {
          resolvedSku = padded;
        }
      }
    }

    if (!existingSkuMap.has(resolvedSku)) {
      failuresList.push({
        sku: item.sku,
        reason: "El producto no existe en el catálogo",
      });
      continue;
    }

    const currentData = existingSkuMap.get(resolvedSku)!;
    resolvedSkuToUpdateMap.set(resolvedSku, item);

    const data: any = {};
    let hasChanges = false;
    
    if (item.stock !== undefined && item.stock !== null) {
      const newStock = BigInt(item.stock);
      if (currentData.stockQuantity !== newStock) {
        data.stockQuantity = newStock;
        hasChanges = true;
      }
    }
    if (item.price !== undefined && item.price !== null) {
      const newPrice = new Prisma.Decimal(item.price);
      if (!currentData.basePrice || !currentData.basePrice.equals(newPrice)) {
        data.basePrice = newPrice;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      // Add to unchanged so we can report them as successes without DB writes
      unchangedProducts.push(currentData);
      continue;
    }

    if (Object.keys(data).length > 0) {
      updatePromises.push(
        prisma.product.update({
          where: { sku: resolvedSku },
          data,
          select: {
            sku: true,
            slug: true,
            stockQuantity: true,
            basePrice: true,
          },
        })
      );
    } else {
      failuresList.push({
        sku: item.sku,
        reason: "No se especificaron columnas para Stock o Precio",
      });
    }
  }

  // 6. Ejecutar las actualizaciones en una transacción Prisma
  let updatedProducts: any[] = [];
  if (updatePromises.length > 0) {
    updatedProducts = await prisma.$transaction(updatePromises);
  }

  // Juntar los actualizados y los sin cambios para la respuesta
  const allSuccessfulProducts = [...updatedProducts, ...unchangedProducts];

  // 7. Formatear la lista de actualizaciones exitosas
  for (const p of allSuccessfulProducts) {
    const originalUpdate = resolvedSkuToUpdateMap.get(p.sku);

    successList.push({
      sku: p.sku, // Retornamos el SKU final de la BD
      stock: originalUpdate?.stock !== undefined && originalUpdate?.stock !== null ? Number(p.stockQuantity) : null,
      price: originalUpdate?.price !== undefined && originalUpdate?.price !== null ? Number(p.basePrice) : null,
    });
  }

  // 8. Invalidar caché del frontend GRANULARMENTE solo si hubo actualizaciones reales
  if (updatedProducts.length > 0) {
    const { revalidatePath } = require("next/cache");
    // Invalidamos página a página para no botar la caché completa de Vercel
    for (const p of updatedProducts) {
      if (p.slug) {
        revalidatePath(`/products/${p.slug}`);
      }
    }
  }

  return ok({
    successes: successList,
    failures: failuresList,
  });
});
