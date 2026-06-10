import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { prisma } from '@/lib/client';
import { priceService } from '@/modules/pricing/domain/price.service';
import { getServerUser } from '@/lib/server-auth';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { CatalogView } from '@/modules/catalog/presentation/components/ProductList/CatalogView';

export default async function CatalogPage(props: { 
  searchParams: Promise<{ 
    page?: string; 
    category?: string;
    categoryId?: string; 
    subcategories?: string;
    search?: string; 
    brands?: string; 
    offers?: string;
    bestSellers?: string;
    essentials?: string;
    recentlyViewed?: string;
    searchHistory?: string;
    related?: string;
  }> 
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const limit = 24;
  const skip = (page - 1) * limit;

  // 1. Fetch categories and brands metadata first to resolve slugs to IDs in memory
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' }
    }),
    prisma.brand.findMany({ orderBy: { name: 'asc' } })
  ]);

  // Resolve category slug or ID to CUID
  const categoryQuery = searchParams.category || searchParams.categoryId || '';
  let categoryId = '';
  if (categoryQuery) {
    const foundCat = categories.find(c => c.slug === categoryQuery || c.id === categoryQuery);
    if (foundCat) {
      categoryId = foundCat.id;
    }
  }

  // Resolve subcategories slugs or IDs to CUIDs
  const subcategoriesQuery = searchParams.subcategories || '';
  const subcategoryQueries = subcategoriesQuery ? subcategoriesQuery.split(',').filter(Boolean) : [];
  const selectedSubcategories: string[] = [];
  for (const query of subcategoryQueries) {
    const foundSub = categories.find(c => c.slug === query || c.id === query);
    if (foundSub) {
      selectedSubcategories.push(foundSub.id);
    }
  }

  const search = searchParams.search || '';

  // Resolve brands slugs or IDs to CUIDs
  const brandsQuery = searchParams.brands || '';
  const brandQueries = brandsQuery ? brandsQuery.split(',').filter(Boolean) : [];
  const selectedBrands: string[] = [];
  for (const query of brandQueries) {
    const foundBrand = brands.find(b => b.slug === query || b.id === query);
    if (foundBrand) {
      selectedBrands.push(foundBrand.id);
    }
  }

  const user = await getServerUser();
  const companyId = user?.companyId || null;

  const offersOnly = searchParams.offers === 'true';
  const bestSellersOnly = searchParams.bestSellers === 'true';
  const essentialsOnly = searchParams.essentials === 'true';

  // Check if we should hide out-of-stock products for customers/guests
  const hideSetting = await prisma.storeSettings.findUnique({
    where: { key: 'hideOutOfStock' },
  });
  const hideOutOfStock = hideSetting ? (hideSetting.value as boolean) === true : false;

  // Build filtered Prisma query
  const where: any = { 
    isActive: true,
    isDeleted: false,
    ...(hideOutOfStock ? { stockQuantity: { gt: 0 } } : {})
  };

  if (offersOnly) {
    const activePromotions = await prisma.promotion.findMany({
      where: { isActive: true }
    });
    const promoBrandIds = activePromotions.map(p => p.brandId).filter(Boolean) as string[];
    const promoCategoryIds = activePromotions.map(p => p.categoryId).filter(Boolean) as string[];

    // Include child categories
    const activeCategoryPromoChildren = await prisma.category.findMany({
      where: { parentId: { in: promoCategoryIds } },
      select: { id: true }
    });
    const allPromoCategoryIds = [...promoCategoryIds, ...activeCategoryPromoChildren.map(c => c.id)];

    if (promoBrandIds.length > 0 || allPromoCategoryIds.length > 0) {
      where.OR = [
        ...(promoBrandIds.length > 0 ? [{ brandId: { in: promoBrandIds } }] : []),
        ...(allPromoCategoryIds.length > 0 ? [{ categoryId: { in: allPromoCategoryIds } }] : [])
      ];
    } else {
      // Force empty results if there are no promotions
      where.id = "none";
    }
  }

  if (bestSellersOnly) {
    const topSold = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 24
    });
    const topProductIds = topSold.map(item => item.productId);
    where.id = { in: topProductIds };
  }

  if (essentialsOnly) {
    where.category = { isOutlet: false };
  }

  if (selectedSubcategories.length > 0) {
    where.categoryId = { in: selectedSubcategories };
  } else if (categoryId) {
    // Find all children category IDs in memory
    const childCategories = categories.filter(c => c.parentId === categoryId);
    const categoryIds = [categoryId, ...childCategories.map(c => c.id)];
    where.categoryId = { in: categoryIds };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (selectedBrands.length > 0) {
    where.brandId = { in: selectedBrands };
  }

  // 2. Fetch Products and Total Count
  let productsRaw: any[];
  let totalProducts: number;

  if (search) {
    // Fetch all matching products to rank them in memory by relevance
    const allProducts = await prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        slug: true,
        basePrice: true,
        stockQuantity: true,
        minOrderQty: true,
        unit: true,
        inner: true,
        specifications: true,
        brandId: true,
        categoryId: true,
        category: { select: { id: true, name: true, isOutlet: true } },
        brand: { select: { id: true, name: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, isPrimary: true }
        },
        createdAt: true
      }
    });

    totalProducts = allProducts.length;

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchLower = search.toLowerCase();
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

    const rankedProducts = allProducts.map(p => ({
      product: p,
      score: getRelevanceScore(p.name, p.sku)
    })).sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.product.createdAt.getTime() - a.product.createdAt.getTime();
    }).map(x => x.product);

    productsRaw = rankedProducts.slice(skip, skip + limit);
  } else {
    totalProducts = await prisma.product.count({ where });
    productsRaw = await prisma.product.findMany({
      where,
      take: limit,
      skip: skip,
      select: {
        id: true,
        sku: true,
        name: true,
        slug: true,
        basePrice: true,
        stockQuantity: true,
        minOrderQty: true,
        unit: true,
        inner: true,
        specifications: true,
        brandId: true,
        categoryId: true,
        category: { select: { id: true, name: true, isOutlet: true } },
        brand: { select: { id: true, name: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, isPrimary: true }
        }
      },
      orderBy: essentialsOnly ? { stockQuantity: 'desc' as const } : { createdAt: 'desc' as const }
    });
  }

  // 3. Enrich with B2B prices (using the optimized product objects)
  const enrichedProducts = await priceService.enrichProductsWithPrices(productsRaw as any, companyId);

  // 4. Serialize for Client Component
  const products = enrichedProducts.map(p => ({
    ...p,
    basePrice: Number(p.basePrice),
    stockQuantity: Number(p.stockQuantity),
    minOrderQty: Number(p.minOrderQty || 1),
  }));

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <PublicHeader />

      <main className="max-w-[1440px] mx-auto w-full p-6 lg:p-12 flex-grow">
        <CatalogView 
          initialProducts={products} 
          categories={categories}
          brands={brands}
          totalCount={totalProducts}
          currentPage={page}
          itemsPerPage={limit}
          initialCategory={categoryId}
          initialSubcategories={selectedSubcategories}
          initialSearch={search}
          initialBrands={selectedBrands}
        />
      </main>

      <PublicFooter />
    </div>
  );
}
