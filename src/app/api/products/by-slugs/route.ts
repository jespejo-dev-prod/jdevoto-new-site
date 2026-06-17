import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { priceService } from "@/modules/pricing/domain/price.service";

export const GET = withApiHandler(async (req: NextRequest) => {
  let user: any = null;
  try {
    user = extractUserFromRequest(req);
  } catch (e) {
    // Guest user is fine
  }
  const companyId = user?.companyId || null;

  const slugsQuery = req.nextUrl.searchParams.get("slugs") || "";
  const slugs = slugsQuery.split(",").filter(Boolean);
  const related = req.nextUrl.searchParams.get("related") === "true";

  if (slugs.length === 0) {
    return ok([]);
  }

  // 1. If fetching related products
  if (related) {
    // Find category and brand ids for the specified slugs
    const baseProducts = await prisma.product.findMany({
      where: { slug: { in: slugs } },
      select: { categoryId: true, brandId: true, id: true }
    });

    const categoryIds = baseProducts.map(p => p.categoryId).filter(Boolean) as string[];
    const brandIds = baseProducts.map(p => p.brandId).filter(Boolean) as string[];
    const excludeIds = baseProducts.map(p => p.id);

    if (categoryIds.length === 0 && brandIds.length === 0) {
      return ok([]);
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { notIn: excludeIds },
        isActive: true,
        isDeleted: false,
        OR: [
          ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
          ...(brandIds.length > 0 ? [{ brandId: { in: brandIds } }] : [])
        ]
      },
      take: 12,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          select: { url: true, isPrimary: true, altText: true },
          where: { isPrimary: true },
          take: 1,
        },
      }
    });

    const productsWithPrices = await priceService.enrichProductsWithPrices(
      relatedProducts as any,
      companyId
    );

    const serialized = productsWithPrices.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      stockQuantity: Number(p.stockQuantity),
    }));

    return ok(serialized);
  }

  // 2. Fetch specific products by slugs
  const products = await prisma.product.findMany({
    where: {
      slug: { in: slugs },
      isActive: true,
      isDeleted: false,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      images: {
        select: { url: true, isPrimary: true, altText: true },
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  const productsWithPrices = await priceService.enrichProductsWithPrices(
    products as any,
    companyId
  );

  const serialized = productsWithPrices.map((p) => ({
    ...p,
    basePrice: Number(p.basePrice),
    stockQuantity: Number(p.stockQuantity),
  }));

  // Sort products to match the exact order of requested slugs (most recent first)
  const slugIndexMap = new Map(slugs.map((slug, index) => [slug, index]));
  serialized.sort((a, b) => {
    const indexA = slugIndexMap.get(a.slug) ?? 999;
    const indexB = slugIndexMap.get(b.slug) ?? 999;
    return indexA - indexB;
  });

  return ok(serialized);
});
