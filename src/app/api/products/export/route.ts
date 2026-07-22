import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const ExportProductsBodySchema = z.object({
  exportAll: z.boolean().optional().default(true),
  skus: z.array(z.string()).optional(),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  // 1. Validar autenticación y rol de administrador
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  // 2. Parsear el body
  const body = await req.json();
  const { exportAll, skus } = ExportProductsBodySchema.parse(body);

  const where: any = {
    isDeleted: false,
  };

  if (!exportAll && skus && skus.length > 0) {
    const skusToQuery = new Set<string>();
    for (const sku of skus) {
      const normalized = sku.trim().toUpperCase();
      if (normalized.length > 0) {
        skusToQuery.add(normalized);
        if (/^\d+$/.test(normalized) && normalized.length < 7) {
          skusToQuery.add(normalized.padStart(7, "0"));
        }
      }
    }
    
    where.sku = { in: Array.from(skusToQuery) };
  }

  // 3. Buscar productos en la base de datos
  const products = await prisma.product.findMany({
    where,
    select: {
      sku: true,
      name: true,
      basePrice: true,
      stockQuantity: true,
      description: true,
      unit: true,
      inner: true,
      category: {
        select: {
          name: true,
        },
      },
      brand: {
        select: {
          name: true,
        },
      },
      isActive: true,
    },
    orderBy: {
      sku: "asc",
    },
  });

  // 4. Formatear la lista de productos
  const formattedProducts = products.map((p) => {
    let catName = p.category?.name || "Sin Categoría";
    if (catName.toLowerCase() === "sin categoría" || catName.toLowerCase() === "sin categoria") {
      catName = "Sin Categoría";
    }

    return {
      sku: p.sku,
      name: p.name,
      basePrice: Number(p.basePrice),
      stockQuantity: Number(p.stockQuantity),
      description: p.description || "",
      unit: p.unit,
      inner: p.inner,
      categoryName: catName,
      brandName: p.brand?.name || "Sin Marca",
      status: p.isActive ? "Activo" : "Inactivo",
    };
  });

  return ok(formattedProducts);
});
