/**
 * GET /api/promotions     — Listar todas las promociones (con relaciones category y brand)
 * POST /api/promotions    — Crear una nueva promoción
 * DELETE /api/promotions   — Eliminar una promoción (query param: id)
 *
 * Acceso restringido a ADMIN.
 */

import { withApiHandler, ok, created, noContent } from "@/lib/api-handler";
import { getServerUser } from "@/lib/server-auth";
import { prisma } from "@/lib/client";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { z } from "zod";
import { revalidateTag } from "next/cache";

// ─── Schemas ────────────────────────────────────────────────────────────────────

const createPromotionSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  discount: z.number().min(0.01).max(100),
  discountType: z.enum(["CATEGORY", "BRAND", "COMBINED"]),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.discountType === "CATEGORY") return !!data.categoryId;
    if (data.discountType === "BRAND") return !!data.brandId;
    if (data.discountType === "COMBINED") return !!data.categoryId && !!data.brandId;
    return false;
  },
  { message: "Debes seleccionar la categoría y/o marca según el tipo de descuento" }
);

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await getServerUser();
  if (!user || user.role !== "ADMIN") {
    throw new ForbiddenError("Solo los administradores pueden gestionar promociones");
  }
  return user;
}

// ─── GET ────────────────────────────────────────────────────────────────────────

export const GET = withApiHandler(async () => {
  await requireAdmin();

  const promotions = await prisma.promotion.findMany({
    include: {
      category: { select: { id: true, name: true, slug: true, isOutlet: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(promotions);
});

// ─── POST ───────────────────────────────────────────────────────────────────────

export const POST = withApiHandler(async (req) => {
  await requireAdmin();

  const body = await req.json();
  const data = createPromotionSchema.parse(body);

  // Excluir categoría Outlet
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { isOutlet: true, name: true },
    });
    if (category?.isOutlet) {
      throw new ValidationError(
        `La categoría "${category.name}" es Outlet y no puede tener promociones`
      );
    }
  }

  const promotion = await prisma.promotion.create({
    data: {
      name: data.name,
      discount: data.discount,
      categoryId: data.discountType === "BRAND" ? null : (data.categoryId ?? null),
      brandId: data.discountType === "CATEGORY" ? null : (data.brandId ?? null),
      isActive: true,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTo: data.validTo ? new Date(data.validTo) : null,
    },
    include: {
      category: { select: { id: true, name: true, slug: true, isOutlet: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
  });

  revalidateTag("promotions", { expire: 0 });

  return created(promotion);
});

// ─── DELETE ─────────────────────────────────────────────────────────────────────

export const DELETE = withApiHandler(async (req) => {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    throw new ValidationError("El parámetro 'id' es obligatorio");
  }

  await prisma.promotion.delete({ where: { id } });

  revalidateTag("promotions", { expire: 0 });

  return noContent();
});

// ─── PUT ────────────────────────────────────────────────────────────────────────

export const PUT = withApiHandler(async (req) => {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    throw new ValidationError("El parámetro 'id' es obligatorio");
  }

  const body = await req.json();
  const data = createPromotionSchema.parse(body);

  // Excluir categoría Outlet
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { isOutlet: true, name: true },
    });
    if (category?.isOutlet) {
      throw new ValidationError(
        `La categoría "${category.name}" es Outlet y no puede tener promociones`
      );
    }
  }

  const promotion = await prisma.promotion.update({
    where: { id },
    data: {
      name: data.name,
      discount: data.discount,
      categoryId: data.discountType === "BRAND" ? null : (data.categoryId ?? null),
      brandId: data.discountType === "CATEGORY" ? null : (data.brandId ?? null),
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTo: data.validTo ? new Date(data.validTo) : null,
    },
    include: {
      category: { select: { id: true, name: true, slug: true, isOutlet: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
  });

  revalidateTag("promotions", { expire: 0 });

  return ok(promotion);
});
