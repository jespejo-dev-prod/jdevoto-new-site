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

  // 5. Buscar qué productos existen en la base de datos
  const existingProducts = await prisma.product.findMany({
    where: {
      sku: { in: Array.from(skusToQuery) },
      isDeleted: false,
    },
    select: {
      sku: true,
    },
  });

  const existingSkuSet = new Set(existingProducts.map((p) => p.sku));
  const updatePromises: any[] = [];
  const resolvedSkuToUpdateMap = new Map<string, typeof validatedUpdates[number]>();

  // 6. Separar registros existentes de los que no existen
  for (const item of validatedUpdates) {
    let resolvedSku = item.sku;

    // Si el SKU exacto no existe, pero la versión acolchada a 7 dígitos sí existe, la usamos
    if (!existingSkuSet.has(resolvedSku)) {
      if (/^\d+$/.test(resolvedSku) && resolvedSku.length < 7) {
        const padded = resolvedSku.padStart(7, "0");
        if (existingSkuSet.has(padded)) {
          resolvedSku = padded;
        }
      }
    }

    if (!existingSkuSet.has(resolvedSku)) {
      failuresList.push({
        sku: item.sku,
        reason: "El producto no existe en el catálogo",
      });
      continue;
    }

    resolvedSkuToUpdateMap.set(resolvedSku, item);

    const data: any = {};
    if (item.stock !== undefined && item.stock !== null) {
      data.stockQuantity = BigInt(item.stock);
    }
    if (item.price !== undefined && item.price !== null) {
      data.basePrice = new Prisma.Decimal(item.price);
    }

    if (Object.keys(data).length > 0) {
      updatePromises.push(
        prisma.product.update({
          where: { sku: resolvedSku },
          data,
          select: {
            sku: true,
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

  // 7. Formatear la lista de actualizaciones exitosas
  for (const p of updatedProducts) {
    const originalUpdate = resolvedSkuToUpdateMap.get(p.sku);

    successList.push({
      sku: p.sku, // Retornamos el SKU final de la BD
      stock: originalUpdate?.stock !== undefined && originalUpdate?.stock !== null ? Number(p.stockQuantity) : null,
      price: originalUpdate?.price !== undefined && originalUpdate?.price !== null ? Number(p.basePrice) : null,
    });
  }

  // 8. Registrar evento de auditoría
  if (updatedProducts.length > 0) {
    await logAuditAction({
      userId: user.id,
      action: "CATALOG_IMPORTED",
      entity: "Catalog",
      details: {
        successCount: updatedProducts.length,
        failuresCount: failuresList.length,
      },
      req,
    });
  }

  return ok({
    successes: successList,
    failures: failuresList,
  });
});
