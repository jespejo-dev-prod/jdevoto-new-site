import React from 'react';
import type { Metadata } from 'next';

// ISR: regenera la home cada 5 minutos en Vercel Edge.
// Googlebot recibe HTML pre-generado (TTFB < 50ms).
export const revalidate = 300;

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
import { ProductSlider } from '@/components/ui/product-slider';

export const metadata: Metadata = {
  title: 'Mayorista B2B de Tecnología en Chile',
  description: 'Compra al por mayor productos de tecnología, computación y electrónica con crédito 30, 60 o 90 días. Distribución mayorista B2B en Chile.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl',
  },
  openGraph: {
    title: 'Mayorista B2B de Tecnología en Chile | Antigravity',
    description: 'Compra al por mayor productos de tecnología, computación y electrónica con crédito 30, 60 o 90 días.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl',
    type: 'website',
    locale: 'es_CL',
    siteName: 'Antigravity',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mayorista B2B de Tecnología en Chile | Antigravity',
    description: 'Compra al por mayor productos de tecnología, computación y electrónica.',
  },
};


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

  // 2. Fetch Active Promotions for the Slider
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

  // 3. Fetch Products in Promotion
  const ofertasDelMesRaw = hasPromos
    ? await prisma.product.findMany({
        where: wherePromos,
        take: 15,
        select: productSelectFields,
        orderBy: { createdAt: 'desc' }
      })
    : [];

  // 4. Fetch general fallback products
  const fallbackRaw = await prisma.product.findMany({
    where: { isActive: true, isDeleted: false, ...stockFilter },
    take: 20,
    select: productSelectFields,
    orderBy: { name: 'asc' }
  });

  // 5. Enrich all raw products with B2B pricing
  const [
    ofertasDelMes,
    fallbackProducts
  ] = await Promise.all([
    priceService.enrichProductsWithPrices(ofertasDelMesRaw as any, companyId),
    priceService.enrichProductsWithPrices(fallbackRaw as any, companyId),
  ]);

  // 6. Serialize BigInt/Decimal to normal numbers
  const serialize = (items: any[]) => items.map(p => ({
    ...p,
    basePrice: Number(p.basePrice),
    stockQuantity: Number(p.stockQuantity),
    minOrderQty: Number(p.minOrderQty || 1),
  }));

  const serializedOfertas = serialize(ofertasDelMes);
  const serializedFallback = serialize(fallbackProducts);

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

        {/* Productos en Promoción Slider */}
        {serializedOfertas.length > 0 && (
          <ScrollReveal>
            <ProductSlider
              title="Productos en Promoción"
              products={serializedOfertas}
              linkHref="/products?offers=true"
              linkLabel="Ver todas las ofertas"
            />
          </ScrollReveal>
        )}

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
