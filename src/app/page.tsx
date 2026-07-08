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
  title: 'Comercial J. Devoto | Distribución Mayorista a Todo Chile',
  description: 'Comercial J. Devoto - Distribución Mayorista a Todo Chile. Encuentra el más amplio catálogo de papelería, oficina, arte, manualidades, regalos y ferretería para tu negocio desde nuestro centro de distribución.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl',
  },
  openGraph: {
    title: 'Comercial J. Devoto | Importadora y Distribuidora Mayorista',
    description: 'Devoto | Importadora y Distribuidora Mayorista en Chile con más de 50 años abasteciendo a librerías y empresas con las mejores marcas del mercado en artículos escolares, oficina, manualidades y regalos. ¡Descubre nuestro catálogo exclusivo aquí!',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl',
    type: 'website',
    locale: 'es_CL',
    siteName: 'J. Devoto',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl'}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: 'J. Devoto Distribución Mayorista',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comercial J. Devoto | Distribución Mayorista',
    description: 'Comercial J. Devoto - Distribución Mayorista a Todo Chile.',
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
  const now = new Date();
  const activePromotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      OR: [{ validFrom: null }, { validFrom: { lte: now } }],
      AND: [{ OR: [{ validTo: null }, { validTo: { gte: now } }] }],
    },
    include: {
      category: { select: { slug: true } },
      brand: { select: { slug: true } },
    }
  });

  const serialize = (items: any[]) => items.map(p => ({
    ...p,
    basePrice: Number(p.basePrice),
    stockQuantity: Number(p.stockQuantity),
    minOrderQty: Number(p.minOrderQty || 1),
  }));

  const promoSliders = [];

  for (const promo of activePromotions) {
    if (!promo.showInSlider) continue;

    const promoCategoryIds = promo.categoryId ? [promo.categoryId] : [];
    const promoBrandIds = promo.brandId ? [promo.brandId] : [];

    let allPromoCategoryIds = [...promoCategoryIds];
    if (promoCategoryIds.length > 0) {
      const children = await prisma.category.findMany({
        where: { parentId: { in: promoCategoryIds } },
        select: { id: true }
      });
      allPromoCategoryIds.push(...children.map(c => c.id));
    }

    // Guard: skip promo with no category/brand targets to avoid matching ALL products
    if (promoBrandIds.length === 0 && allPromoCategoryIds.length === 0) continue;

    const where: any = {
      isActive: true,
      isDeleted: false,
      ...stockFilter,
      OR: [
        ...(promoBrandIds.length > 0 ? [{ brandId: { in: promoBrandIds } }] : []),
        ...(allPromoCategoryIds.length > 0 ? [{ categoryId: { in: allPromoCategoryIds } }] : [])
      ]
    };

    const productsRaw = await prisma.product.findMany({
      where,
      take: 15,
      select: productSelectFields,
      orderBy: { createdAt: 'desc' }
    });

    if (productsRaw.length > 0) {
      const enriched = await priceService.enrichProductsWithPrices(productsRaw as any, companyId);
      const serialized = serialize(enriched);

      // isPromoSlider is true whenever the promotion is shown as a slider (campaign layout)
      // It does NOT require a validTo - N/A promotions also use the campaign layout but without timer
      const isPromoSlider = true;
      const validToSerialized = promo.validTo ? promo.validTo.toISOString() : null;

      let linkHref = '/products?offers=true';
      if (promo.category?.slug && promo.brand?.slug) {
        linkHref = `/products?category=${promo.category.slug}&brands=${promo.brand.slug}&offers=true`;
      } else if (promo.category?.slug) {
        linkHref = `/products?category=${promo.category.slug}&offers=true`;
      } else if (promo.brand?.slug) {
        linkHref = `/products?brands=${promo.brand.slug}&offers=true`;
      }

      promoSliders.push({
        id: promo.id,
        title: promo.name,
        products: serialized,
        isPromoSlider,
        validTo: validToSerialized,
        color: promo.color,
        linkHref,
      });
    }
  }

  // 4. Fetch general fallback products
  const fallbackRaw = await prisma.product.findMany({
    where: { isActive: true, isDeleted: false, ...stockFilter },
    take: 20,
    select: productSelectFields,
    orderBy: { name: 'asc' }
  });

  const fallbackProducts = await priceService.enrichProductsWithPrices(fallbackRaw as any, companyId);
  const serializedFallback = serialize(fallbackProducts);

  // Sliders fallback divisions (non-overlapping slices)
  const rvFallback = serializedFallback.slice(0, 7);
  const shFallback = serializedFallback.slice(7, 14);
  const relFallback = serializedFallback.slice(14, 20);

  return (
    <div className="min-h-screen bg-[#e8e8e8] flex flex-col">
      <PublicHeader />

      <main className="max-w-[1440px] mx-auto w-full p-4 md:p-8 lg:p-12 flex-grow overflow-hidden">
        {/* Hero Section */}
        <HeroSlider />

        {/* Sleek Benefit Bar - No ScrollReveal here since it's above the fold */}
        <BenefitBar />

        {/* Productos en Promoción Slider */}
        {/* Active Promotion Sliders */}
        {promoSliders.map((slider, index) => {
          const content = (
            <ProductSlider
              title={slider.title}
              products={slider.products}
              linkHref={slider.linkHref}
              linkLabel="Ver todas las ofertas"
              isPromoSlider={slider.isPromoSlider}
              validTo={slider.validTo}
              campaignColor={slider.color}
              prioritizeLcp={index === 0}
            />
          );

          // Only apply ScrollReveal to sliders below the first one
          if (index === 0) {
            return <React.Fragment key={slider.id}>{content}</React.Fragment>;
          }
          return (
            <ScrollReveal key={slider.id}>
              {content}
            </ScrollReveal>
          );
        })}

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
