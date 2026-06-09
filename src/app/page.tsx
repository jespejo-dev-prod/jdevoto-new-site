import React from 'react';
import { prisma } from '@/lib/client';
import { priceService } from '@/modules/pricing/domain/price.service';
import { getServerUser } from '@/lib/server-auth';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { HeroSlider } from '@/components/home/hero-slider';
import { FeatureCards } from '@/components/home/feature-cards';
import { ProductSlider } from '@/components/ui/product-slider';
import { CategoriesSlider } from '@/components/home/categories-slider';
import { 
  RecentlyViewedSlider, 
  SearchHistorySlider, 
  RelatedToViewedSlider 
} from '@/components/home/client-sliders';
import { ScrollReveal } from '@/components/home/scroll-reveal';

export default async function HomePage() {
  const user = await getServerUser();
  const companyId = user?.companyId || null;

  const productSelectFields = {
    id: true,
    sku: true,
    name: true,
    slug: true,
    basePrice: true,
    stockQuantity: true,
    minOrderQty: true,
    unit: true,
    inner: true,
    brandId: true,
    categoryId: true,
    category: { select: { id: true, name: true, isOutlet: true } },
    brand: { select: { id: true, name: true } },
    images: {
      where: { isPrimary: true },
      take: 1,
      select: { url: true, isPrimary: true }
    }
  };

  // 1. Fetch parent categories for CategoriesSlider (Descubre Nuestras Categorías)
  const categories = await prisma.category.findMany({
    where: { parentId: null, isOutlet: false },
    orderBy: { name: 'asc' }
  });

  // 2. Fetch Active Promotions for "Ofertas del Mes"
  const activePromotions = await prisma.promotion.findMany({
    where: { isActive: true }
  });
  const promoBrandIds = activePromotions.map(p => p.brandId).filter(Boolean) as string[];
  const promoCategoryIds = activePromotions.map(p => p.categoryId).filter(Boolean) as string[];

  // Also query child categories for categories in promotion to include their products
  const activeCategoryPromoChildren = await prisma.category.findMany({
    where: { parentId: { in: promoCategoryIds } },
    select: { id: true }
  });
  const allPromoCategoryIds = [...promoCategoryIds, ...activeCategoryPromoChildren.map(c => c.id)];

  const wherePromos: any = {
    isActive: true,
    isDeleted: false,
    OR: [
      ...(promoBrandIds.length > 0 ? [{ brandId: { in: promoBrandIds } }] : []),
      ...(allPromoCategoryIds.length > 0 ? [{ categoryId: { in: allPromoCategoryIds } }] : [])
    ]
  };

  // If there are no promotions, we don't pass an empty query that would fail
  const hasPromos = promoBrandIds.length > 0 || allPromoCategoryIds.length > 0;

  // 3. Fetch Products for "Ofertas del Mes" (Real promotions)
  let ofertasDelMesRaw = hasPromos
    ? await prisma.product.findMany({
        where: wherePromos,
        take: 12,
        select: productSelectFields,
        orderBy: { createdAt: 'desc' }
      })
    : [];

  // Fallback if not enough promotional products
  if (ofertasDelMesRaw.length < 4) {
    const fallbackProducts = await prisma.product.findMany({
      where: { isActive: true, isDeleted: false },
      take: 12 - ofertasDelMesRaw.length,
      select: productSelectFields,
      orderBy: { createdAt: 'desc' }
    });
    ofertasDelMesRaw = [...ofertasDelMesRaw, ...fallbackProducts];
  }

  // 4. Fetch Products for "Productos Más Vendidos" (Real order item quantities)
  const topSold = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 12
  });
  const topProductIds = topSold.map(item => item.productId);

  let masVendidosRaw = await prisma.product.findMany({
    where: { id: { in: topProductIds }, isActive: true, isDeleted: false },
    select: productSelectFields
  });

  // Sort in memory to match sales rank
  const rankMap = new Map(topProductIds.map((id, index) => [id, index]));
  masVendidosRaw.sort((a, b) => (rankMap.get(a.id) ?? 999) - (rankMap.get(b.id) ?? 999));

  // Fallback if no sales yet
  if (masVendidosRaw.length < 4) {
    const fallback = await prisma.product.findMany({
      where: { isActive: true, isDeleted: false },
      take: 12,
      select: productSelectFields,
      orderBy: { createdAt: 'desc' }
    });
    masVendidosRaw = fallback;
  }

  // 5. Fetch Products for "Imprescindibles" (Top stock products)
  const imprescindiblesRaw = await prisma.product.findMany({
    where: { isActive: true, isDeleted: false, category: { isOutlet: false } },
    take: 12,
    select: productSelectFields,
    orderBy: { stockQuantity: 'desc' }
  });

  // 6. Fetch general products as fallback for client sliders
  const fallbackRaw = await prisma.product.findMany({
    where: { isActive: true, isDeleted: false },
    take: 20,
    select: productSelectFields,
    orderBy: { name: 'asc' }
  });

  // 7. Enrich all raw products with B2B pricing
  const [ofertasDelMes, masVendidos, imprescindibles, fallbackProducts] = await Promise.all([
    priceService.enrichProductsWithPrices(ofertasDelMesRaw as any, companyId),
    priceService.enrichProductsWithPrices(masVendidosRaw as any, companyId),
    priceService.enrichProductsWithPrices(imprescindiblesRaw as any, companyId),
    priceService.enrichProductsWithPrices(fallbackRaw as any, companyId),
  ]);

  // 8. Serialize BigInt/Decimal to normal numbers for sliders
  const serialize = (items: any[]) => items.map(p => ({
    ...p,
    basePrice: Number(p.basePrice),
    stockQuantity: Number(p.stockQuantity),
    minOrderQty: Number(p.minOrderQty || 1),
  }));

  const serializedOfertas = serialize(ofertasDelMes);
  const serializedMasVendidos = serialize(masVendidos);
  const serializedImprescindibles = serialize(imprescindibles);
  const serializedFallback = serialize(fallbackProducts);

  // Divide fallback products for different sliders
  const rvFallback = serializedFallback.slice(0, 10);
  const shFallback = serializedFallback.slice(5, 15);
  const relFallback = serializedFallback.slice(10, 20);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <PublicHeader />

      <main className="max-w-[1440px] mx-auto w-full p-4 md:p-8 lg:p-12 flex-grow overflow-hidden">
        {/* Hero Section */}
        <HeroSlider />

        {/* Feature Cards with scroll entry animation */}
        <ScrollReveal>
          <FeatureCards />
        </ScrollReveal>

        {/* Ofertas del mes */}
        <ScrollReveal>
          <ProductSlider 
            title="Ofertas del Mes" 
            products={serializedOfertas} 
            linkHref="/products?offers=true" 
            linkLabel="Ver todas las ofertas" 
          />
        </ScrollReveal>

        {/* Más vendidos */}
        <ScrollReveal>
          <ProductSlider 
            title="Productos Más Vendidos" 
            products={serializedMasVendidos} 
            linkHref="/products?bestSellers=true" 
            linkLabel="Ir a más vendidos" 
          />
        </ScrollReveal>

        {/* Categorías */}
        <ScrollReveal>
          <CategoriesSlider categories={categories} />
        </ScrollReveal>

        {/* Vistos Recientemente */}
        <ScrollReveal>
          <RecentlyViewedSlider fallbackProducts={rvFallback} />
        </ScrollReveal>

        {/* Tu Historial de Búsqueda */}
        <ScrollReveal>
          <SearchHistorySlider fallbackProducts={shFallback} />
        </ScrollReveal>

        {/* Imprescindibles */}
        <ScrollReveal>
          <ProductSlider 
            title="Imprescindibles" 
            products={serializedImprescindibles} 
            linkHref="/products?essentials=true" 
            linkLabel="Ver todas las ofertas" 
          />
        </ScrollReveal>

        {/* Relacionado con lo que viste */}
        <ScrollReveal>
          <RelatedToViewedSlider fallbackProducts={relFallback} />
        </ScrollReveal>
        
        {/* Spacer before footer */}
        <div className="h-12" />
      </main>

      <PublicFooter />
    </div>
  );
}
