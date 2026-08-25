/**
 * app/api/products/[id]/route.ts
 *
 * GET    /api/products/:id — Detalle de un producto con precio personalizado
 * PATCH  /api/products/:id — Actualizar producto (solo ADMIN)
 * DELETE /api/products/:id — Desactivar producto (soft delete, solo ADMIN)
 */

import { NextRequest } from "next/server";
import { withApiHandler, ok, RouteContext } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { Prisma } from "@prisma/client";
import { priceService } from "@/modules/pricing/domain/price.service";
import { UpdateProductSchema } from "@/validations/product.schemas";
import { NotFoundError } from "@/lib/errors";
import { UserRole } from "@prisma/client";
import { serializeDecimal } from "@/lib/utils";
import { logAuditAction } from "@/lib/audit";

// ============================================================
// GET /api/products/:id
// ============================================================

export const GET = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!product) throw new NotFoundError("Producto", id);

  const isSuperOrAdmin = user && (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN);
  if (!isSuperOrAdmin && Number(product.basePrice) === 0) {
    throw new NotFoundError("Producto", id);
  }

  const targetCompanyId = user.role === UserRole.BUYER 
    ? (user.companyId ?? null)
    : (req.nextUrl.searchParams.get("companyId") || user.companyId || null);

  const price = await priceService.getPriceForProduct(product.id, targetCompanyId);

  // Serializar campos Decimal y BigInt para evitar errores de hidratación/paso a Client Components
  const serialized = serializeDecimal({
    ...product,
    price,
  });

  return ok(serialized);
});

// ============================================================
// PATCH /api/products/:id
// ============================================================

export const PATCH = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { id } = await ctx.params;
  const body = await req.json();
  const data = UpdateProductSchema.parse(body);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Producto", id);

  // Extraer campos especiales del resto de los campos escalares
  const { 
    images, 
    categoryId, 
    brandId, 
    basePrice, 
    weight, 
    length, 
    width, 
    height,
    ...scalarFields 
  } = data;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...scalarFields,
      // Si se actualiza el estado (activo o inactivo), restauramos de la papelera
      ...(scalarFields.isActive !== undefined ? { isDeleted: false } : {}),
      // Manejar precio como Decimal
      ...(basePrice !== undefined ? { basePrice: new Prisma.Decimal(basePrice) } : {}),
      // Manejar logística como Decimal
      ...(weight !== undefined ? { weight: weight !== null ? new Prisma.Decimal(weight) : null } : {}),
      ...(length !== undefined ? { length: length !== null ? new Prisma.Decimal(length) : null } : {}),
      ...(width !== undefined ? { width: width !== null ? new Prisma.Decimal(width) : null } : {}),
      ...(height !== undefined ? { height: height !== null ? new Prisma.Decimal(height) : null } : {}),
      // Manejar relaciones de categoría y marca
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      ...(brandId ? { brand: { connect: { id: brandId } } } : {}),
      // Manejar imágenes: borrar las existentes y recrearlas
      ...(images && images.length > 0
        ? {
            images: {
              deleteMany: {},
              createMany: {
                data: images.map((img) => ({
                  url: img.url,
                  position: img.position,
                  altText: img.altText ?? null,
                  isPrimary: img.isPrimary ?? false,
                })),
              },
            },
          }
        : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: {
        select: { url: true, isPrimary: true, altText: true, position: true },
        orderBy: { position: "asc" },
      },
    },
  });

  await logAuditAction({
    userId: user.id,
    action: "PRODUCT_UPDATED",
    entity: "Product",
    entityId: id,
    details: { productName: updated.name, basePrice, stockQuantity: scalarFields.stockQuantity },
    req,
  });

  // Invalidar caché del frontend para que el cambio de stock/precio se vea de inmediato
  const { revalidatePath } = require("next/cache");
  revalidatePath(`/products/${updated.slug}`);
  revalidatePath("/"); // Por si aparece en los carruseles del home
  revalidatePath("/(store)", "layout"); // Invalidar las páginas del store

  return ok(serializeDecimal(updated));
});


// ============================================================
// DELETE /api/products/:id  (soft delete)
// ============================================================

export const DELETE = withApiHandler(async (req: NextRequest, ctx: RouteContext) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { id } = await ctx.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Producto", id);

  await prisma.product.update({
    where: { id },
    data: { 
      isActive: false,
      isDeleted: true 
    },
  });

  await logAuditAction({
    userId: user.id,
    action: "PRODUCT_DELETED",
    entity: "Product",
    entityId: id,
    details: { productName: existing.name },
    req,
  });

  return ok({ message: "Producto enviado a la papelera correctamente" });
});
