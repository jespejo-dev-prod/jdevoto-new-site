/**
 * app/api/products/route.ts
 *
 * GET  /api/products  — Lista productos con precios personalizados por empresa
 * POST /api/products  — Crea un nuevo producto (solo ADMIN)
 *
 * Parámetros de optimización:
 *  ?dashboard=true → Salta el motor de precios, devuelve basePrice directamente.
 *                    Reduce de 6 queries a 2 queries. Solo disponible para ADMIN/SALES_REP.
 */

import { NextRequest } from "next/server";
import { withApiHandler, ok, created } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { priceService } from "@/modules/pricing/domain/price.service";
import { serializeDecimal } from "@/lib/utils";
import {
  GetProductsQuerySchema,
  CreateProductSchema,
} from "@/validations/product.schemas";
import { UserRole } from "@prisma/client";
import { createProductUseCase } from "@/modules/catalog/application/createProduct.use-case";
import { logAuditAction } from "@/lib/audit";

// ============================================================
// GET /api/products
// ============================================================

export const GET = withApiHandler(async (req: NextRequest) => {
  let user: any = null;
  try {
    user = extractUserFromRequest(req);
  } catch (e) {
    // Guest user is fine
  }

  // Parsear y validar query params con Zod
  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const query = GetProductsQuerySchema.parse(rawParams);

  // Para el dashboard de admin/sales_rep: pueden ver productos inactivos
  const isPrivileged = user && (user.role === UserRole.ADMIN || user.role === UserRole.SALES_REP);
  const includeInactive =
    req.nextUrl.searchParams.get("includeInactive") === "true" && isPrivileged;

  // Modo dashboard: salta el motor de precios → mucho más rápido
  const dashboardMode =
    req.nextUrl.searchParams.get("dashboard") === "true" && isPrivileged;

  const statusParam = req.nextUrl.searchParams.get("status") || "all";

  // Check if we should hide out-of-stock products for customers/guests
  let hideOutOfStock = false;
  if (!isPrivileged) {
    const hideSetting = await prisma.storeSettings.findUnique({
      where: { key: 'hideOutOfStock' },
    });
    hideOutOfStock = hideSetting ? (hideSetting.value as boolean) === true : false;
  }

  // Construir filtros
  const where: any = {
    ...(isPrivileged
      ? statusParam === "trash"
        ? { isDeleted: true }
        : statusParam === "published"
        ? { isActive: true, isDeleted: false }
        : statusParam === "draft"
        ? { isActive: false, isDeleted: false }
        : { isDeleted: false } // status === "all" (publicados + borradores, ocultando papelera)
      : { isActive: true, isDeleted: false }), // Público: solo activos y no eliminados
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            { sku: { contains: query.search, mode: "insensitive" as const } },
            {
              category: {
                name: { contains: query.search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
    ...((query.inStock || hideOutOfStock) ? { stockQuantity: { gt: 0 } } : {}),
  };

  const skip = (query.page - 1) * query.limit;

  // ── Modo Dashboard (Admin/Sales) ─────────────────────────────────────────
  // Solo 2 queries: productos + count. Sin motor de precios.
  if (dashboardMode) {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        // Select mínimo: solo campos que necesita el ProductCard/Table
        select: {
          id: true,
          sku: true,
          name: true,
          slug: true,
          basePrice: true,
          stockQuantity: true,
          stockAlert: true,
          minOrderQty: true,
          inner: true,
          isActive: true,
          createdAt: true,
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: {
            select: { url: true, isPrimary: true, altText: true },
            where: { isPrimary: true }, // Solo la imagen primaria
            take: 1,
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return ok(
      serializeDecimal(products),
      200,
      {
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      }
    );
  }

  // ── Modo Público / B2B (con motor de precios) ────────────────────────────
  let products: any[];
  let total: number;
  const hasPriceFilter = query.minPrice !== undefined || query.maxPrice !== undefined;

  const targetCompanyId = user
    ? user.role === UserRole.BUYER
      ? user.companyId
      : (req.nextUrl.searchParams.get("companyId") ?? user.companyId)
    : null;

  let productsWithPrices: any[];

  if (query.search || hasPriceFilter) {
    // Si hay búsqueda o filtro de precio, traemos un set acotado para procesar en memoria y evitar OOM
    const allProducts = await prisma.product.findMany({
      where,
      take: 500,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: {
          select: { url: true, isPrimary: true, altText: true, position: true },
          orderBy: { position: "asc" },
        },
      },
    });

    // Enriquecer primero para poder filtrar por precio
    const enriched = await priceService.enrichProductsWithPrices(
      allProducts as any,
      targetCompanyId
    );

    // Filtrar por precio
    let filtered = enriched.filter((p) => {
      if (query.minPrice !== undefined && p.price.unitGrossPrice < query.minPrice) return false;
      if (query.maxPrice !== undefined && p.price.unitGrossPrice > query.maxPrice) return false;
      return true;
    });

    // Si además hay búsqueda, ordenar por relevancia
    if (query.search) {
      const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchLower = query.search.toLowerCase();
      const regexWord = new RegExp(`\\b${escapeRegExp(searchLower)}\\b`, 'i');

      const getRelevanceScore = (name: string, sku: string) => {
        const nameLower = name.toLowerCase();
        const skuLower = sku.toLowerCase();

        if (nameLower === searchLower) return 100;
        if (nameLower.startsWith(searchLower + " ")) return 90;
        if (regexWord.test(nameLower)) return 80;
        if (nameLower.startsWith(searchLower)) return 70;
        if (skuLower === searchLower) return 60;
        if (skuLower.includes(searchLower)) return 50;
        if (nameLower.includes(searchLower)) return 40;
        return 0;
      };

      const ranked = filtered.map(p => ({
        product: p,
        score: getRelevanceScore(p.name, p.sku)
      })).sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.product.name.localeCompare(b.product.name, 'es');
      }).map(x => x.product);

      filtered = ranked;
    } else {
      // Si no hay búsqueda pero sí filtro de precio, ordenar por nombre por defecto
      filtered.sort((a: any, b: any) => a.name.localeCompare(b.name, 'es'));
    }

    total = filtered.length;
    productsWithPrices = filtered.slice(skip, skip + query.limit);
  } else {
    // Si no hay búsqueda ni filtro de precio, paginar directamente en base de datos (Óptimo)
    const [pList, count] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { name: "asc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: {
            select: { url: true, isPrimary: true, altText: true, position: true },
            orderBy: { position: "asc" },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);
    products = pList;
    total = count;

    productsWithPrices = await priceService.enrichProductsWithPrices(
      products as any,
      targetCompanyId
    );
  }

  const serialized = serializeDecimal(productsWithPrices);

  return ok(serialized, 200, {
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
    priceContext: {
      companyId: targetCompanyId,
      taxRate: 0.19,
      currency: "CLP",
    },
  });
});

// ============================================================
// POST /api/products
// ============================================================

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const body = await req.json();
  const data = CreateProductSchema.parse(body);

  const product = await createProductUseCase(data, user);

  await logAuditAction({
    userId: user.id,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    details: { name: product.name, sku: product.sku },
    req,
  });

  return created(product);
});
