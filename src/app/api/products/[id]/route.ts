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
    },
  });

  if (!product) throw new NotFoundError("Producto", id);

  const targetCompanyId =
    user.role === UserRole.BUYER ? user.companyId : (req.nextUrl.searchParams.get("companyId") ?? user.companyId);

  const price = await priceService.getPriceForProduct(product.id, targetCompanyId);

  // Serializar campos Decimal y BigInt para evitar errores de hidratación/paso a Client Components
  const serialized = {
    ...product,
    basePrice: Number(product.basePrice),
    stockQuantity: Number(product.stockQuantity),
    weight: product.weight ? Number(product.weight) : null,
    length: product.length ? Number(product.length) : null,
    width: product.width ? Number(product.width) : null,
    height: product.height ? Number(product.height) : null,
    price,
  };

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

  return ok({
    ...updated,
    basePrice: Number(updated.basePrice),
    stockQuantity: Number(updated.stockQuantity),
    weight: updated.weight ? Number(updated.weight) : null,
    length: updated.length ? Number(updated.length) : null,
    width: updated.width ? Number(updated.width) : null,
    height: updated.height ? Number(updated.height) : null,
  });
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

  return ok({ message: "Producto enviado a la papelera correctamente" });
});
