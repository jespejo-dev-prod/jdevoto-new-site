import React from 'react';
import { prisma } from '@/lib/client';
import { priceService } from '@/modules/pricing/domain/price.service';
import { getServerUser } from '@/lib/server-auth';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { HeroSlider } from '@/components/home/hero-slider';
import { CategoriesSlider } from '@/components/home/categories-slider';
import { 
  RecentlyViewedSlider, 
  SearchHistorySlider, 
  RelatedToViewedSlider 
} from '@/components/home/client-sliders';
import { ScrollReveal } from '@/components/home/scroll-reveal';
import { BenefitBar } from '@/components/home/benefit-bar';
import { PromoBanner } from '@/components/home/promo-banner';
import { CategoryTabsGrid } from '@/components/home/category-tabs-grid';

export default async function HomePage() {
  const user = await getServerUser();
  const companyId = user?.companyId || null;

  const hideSetting = await prisma.storeSettings.findUnique({
    where: { key: 'hideOutOfStock' },
  });
  const hideOutOfStock = hideSetting ? (hideSetting.value as boolean) === true : false;
  const stockFilter = hideOutOfStock ? { stockQuantity: { gt: 0 } } : {};

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

  // 2. Fetch Active Promotions for "Ofertas del Mes" (fallback slider)
  const activePromotions = await prisma.promotion.findMany({
    where: { isActive: true }
  });
  const promoBrandIds = activePromotions.map(p => p.brandId).filter(Boolean) as string[];
  const promoCategoryIds = activePromotions.map(p => p.categoryId).filter(Boolean) as string[];

  // Query child categories for categories in promotion to include their products
  const activeCategoryPromoChildren = await prisma.category.findMany({
    where: { parentId: { in: promoCategoryIds } },
    select: { id: true }
  });
  const allPromoCategoryIds = [...promoCategoryIds, ...activeCategoryPromoChildren.map(c => c.id)];

  const wherePromos: any = {
    isActive: true,
    isDeleted: false,
    ...stockFilter,
    OR: [
      ...(promoBrandIds.length > 0 ? [{ brandId: { in: promoBrandIds } }] : []),
      ...(allPromoCategoryIds.length > 0 ? [{ categoryId: { in: allPromoCategoryIds } }] : [])
    ]
  };

  const hasPromos = promoBrandIds.length > 0 || allPromoCategoryIds.length > 0;

  // 3. Fetch Products for "Ofertas del Mes"
  let ofertasDelMesRaw = hasPromos
    ? await prisma.product.findMany({
        where: wherePromos,
        take: 12,
        select: productSelectFields,
        orderBy: { createdAt: 'desc' }
      })
    : [];

  if (ofertasDelMesRaw.length < 4) {
    const fallbackProducts = await prisma.product.findMany({
      where: { isActive: true, isDeleted: false, ...stockFilter },
      take: 12 - ofertasDelMesRaw.length,
      select: productSelectFields,
      orderBy: { createdAt: 'desc' }
    });
    ofertasDelMesRaw = [...ofertasDelMesRaw, ...fallbackProducts];
  }

  // 4. Fetch Products for "Productos Más Vendidos"
  const topSold = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 12
  });
  const topProductIds = topSold.map(item => item.productId);

  let masVendidosRaw = await prisma.product.findMany({
    where: { id: { in: topProductIds }, isActive: true, isDeleted: false, ...stockFilter },
    select: productSelectFields
  });

  const rankMap = new Map(topProductIds.map((id, index) => [id, index]));
  masVendidosRaw.sort((a, b) => (rankMap.get(a.id) ?? 999) - (rankMap.get(b.id) ?? 999));

  if (masVendidosRaw.length < 4) {
    const fallback = await prisma.product.findMany({
      where: { isActive: true, isDeleted: false, ...stockFilter },
      take: 12,
      select: productSelectFields,
      orderBy: { createdAt: 'desc' }
    });
    masVendidosRaw = fallback;
  }

  // 5. Query IDs for Category Tabs (Papelería, Oficina, Ferretería, Regalos)
  const papeleriaCats = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: 'papelería', mode: 'insensitive' } },
        { name: { contains: 'manualidades', mode: 'insensitive' } },
        { name: { contains: 'escolar', mode: 'insensitive' } },
        { slug: { contains: 'papeleria', mode: 'insensitive' } },
        { slug: { contains: 'manualidades', mode: 'insensitive' } },
        { slug: { contains: 'escolar', mode: 'insensitive' } }
      ]
    },
    select: { id: true }
  });
  const papeleriaCatIds = papeleriaCats.map(c => c.id);

  const oficinaCats = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: 'oficina', mode: 'insensitive' } },
        { name: { contains: 'escritorio', mode: 'insensitive' } },
        { slug: { contains: 'oficina', mode: 'insensitive' } },
        { slug: { contains: 'escritorio', mode: 'insensitive' } }
      ]
    },
    select: { id: true }
  });
  const oficinaCatIds = oficinaCats.map(c => c.id);

  const ferreteriaCats = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: 'ferretería', mode: 'insensitive' } },
        { name: { contains: 'fijaciones', mode: 'insensitive' } },
        { slug: { contains: 'ferreteria', mode: 'insensitive' } },
        { slug: { contains: 'fijaciones', mode: 'insensitive' } }
      ]
    },
    select: { id: true }
  });
  const ferreteriaCatIds = ferreteriaCats.map(c => c.id);

  const regalosCats = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: 'regalos', mode: 'insensitive' } },
        { name: { contains: 'novedades', mode: 'insensitive' } },
        { slug: { contains: 'regalos', mode: 'insensitive' } },
        { slug: { contains: 'novedades', mode: 'insensitive' } }
      ]
    },
    select: { id: true }
  });
  const regalosCatIds = regalosCats.map(c => c.id);

  // Fetch Category Products
  const papeleriaRaw = await prisma.product.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      ...stockFilter,
      OR: [
        { categoryId: { in: papeleriaCatIds } },
        { category: { parentId: { in: papeleriaCatIds } } }
      ]
    },
    take: 8,
    select: productSelectFields,
    orderBy: { stockQuantity: 'desc' }
  });

  const oficinaRaw = await prisma.product.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      ...stockFilter,
      OR: [
        { categoryId: { in: oficinaCatIds } },
        { category: { parentId: { in: oficinaCatIds } } }
      ]
    },
    take: 8,
    select: productSelectFields,
    orderBy: { stockQuantity: 'desc' }
  });

  const ferreteriaRaw = await prisma.product.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      ...stockFilter,
      OR: [
        { categoryId: { in: ferreteriaCatIds } },
        { category: { parentId: { in: ferreteriaCatIds } } }
      ]
    },
    take: 8,
    select: productSelectFields,
    orderBy: { stockQuantity: 'desc' }
  });

  const regalosRaw = await prisma.product.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      ...stockFilter,
      OR: [
        { categoryId: { in: regalosCatIds } },
        { category: { parentId: { in: regalosCatIds } } }
      ]
    },
    take: 8,
    select: productSelectFields,
    orderBy: { stockQuantity: 'desc' }
  });

  // 6. Fetch general fallback products
  const fallbackRaw = await prisma.product.findMany({
    where: { isActive: true, isDeleted: false, ...stockFilter },
    take: 20,
    select: productSelectFields,
    orderBy: { name: 'asc' }
  });

  // 7. Enrich all raw products with B2B pricing
  const [
    ofertasDelMes,
    masVendidos,
    papeleriaEnriched,
    oficinaEnriched,
    ferreteriaEnriched,
    regalosEnriched,
    fallbackProducts
  ] = await Promise.all([
    priceService.enrichProductsWithPrices(ofertasDelMesRaw as any, companyId),
    priceService.enrichProductsWithPrices(masVendidosRaw as any, companyId),
    priceService.enrichProductsWithPrices(papeleriaRaw as any, companyId),
    priceService.enrichProductsWithPrices(oficinaRaw as any, companyId),
    priceService.enrichProductsWithPrices(ferreteriaRaw as any, companyId),
    priceService.enrichProductsWithPrices(regalosRaw as any, companyId),
    priceService.enrichProductsWithPrices(fallbackRaw as any, companyId),
  ]);

  // 8. Serialize BigInt/Decimal to normal numbers
  const serialize = (items: any[]) => items.map(p => ({
    ...p,
    basePrice: Number(p.basePrice),
    stockQuantity: Number(p.stockQuantity),
    minOrderQty: Number(p.minOrderQty || 1),
  }));

  const serializedOfertas = serialize(ofertasDelMes);
  const serializedMasVendidos = serialize(masVendidos);
  const serializedPapeleria = serialize(papeleriaEnriched);
  const serializedOficina = serialize(oficinaEnriched);
  const serializedFerreteria = serialize(ferreteriaEnriched);
  const serializedRegalos = serialize(regalosEnriched);
  const serializedFallback = serialize(fallbackProducts);

  // Helper to fallback if not enough products
  const fillFallback = (productsList: any[], fallbackList: any[]) => {
    if (productsList.length >= 8) return productsList;
    const existingIds = new Set(productsList.map(p => p.id));
    const merged = [...productsList];
    for (const item of fallbackList) {
      if (merged.length >= 8) break;
      if (!existingIds.has(item.id)) {
        merged.push(item);
      }
    }
    return merged;
  };

  const tabTodos = serializedMasVendidos.slice(0, 8);
  const tabPapeleria = fillFallback(serializedPapeleria, serializedFallback);
  const tabOficina = fillFallback(serializedOficina, serializedFallback);
  const tabFerreteria = fillFallback(serializedFerreteria, serializedFallback);
  const tabRegalos = fillFallback(serializedRegalos, serializedFallback);

  // Sliders fallback divisions
  const rvFallback = serializedFallback.slice(0, 10);
  const shFallback = serializedFallback.slice(5, 15);
  const relFallback = serializedFallback.slice(10, 20);

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex flex-col">
      <PublicHeader />

      <main className="max-w-[1440px] mx-auto w-full p-4 md:p-8 lg:p-12 flex-grow overflow-hidden">
        {/* Hero Section */}
        <HeroSlider />

        {/* Sleek Benefit Bar */}
        <ScrollReveal>
          <BenefitBar />
        </ScrollReveal>

        {/* Dynamic Category Tabs Grid */}
        <ScrollReveal>
          <CategoryTabsGrid
            todos={tabTodos}
            papeleria={tabPapeleria}
            oficina={tabOficina}
            ferreteria={tabFerreteria}
            regalos={tabRegalos}
          />
        </ScrollReveal>

        {/* High-Impact Campaign Banner */}
        <ScrollReveal>
          <PromoBanner />
        </ScrollReveal>

        {/* Categorías Destacadas Slider */}
        <ScrollReveal>
          <CategoriesSlider categories={categories} />
        </ScrollReveal>

        {/* Vistos Recientemente Slider */}
        <ScrollReveal>
          <RecentlyViewedSlider fallbackProducts={rvFallback} />
        </ScrollReveal>

        {/* Tu Historial de Búsqueda Slider */}
        <ScrollReveal>
          <SearchHistorySlider fallbackProducts={shFallback} />
        </ScrollReveal>

        {/* Relacionado con lo que viste Slider */}
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
