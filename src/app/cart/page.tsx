import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { CartContent } from './CartContent';
import { prisma } from '@/lib/client';
import { ProductSlider } from '@/components/ui/product-slider';
import { ProductCard } from '@/modules/catalog/presentation/components/ProductList/ProductCard';
import { priceService } from '@/modules/pricing/domain/price.service';
import { getServerUser } from '@/lib/server-auth';

export default async function CartPage() {
  const user = await getServerUser();
  const companyId = user?.companyId || null;

  // Check if we should hide out-of-stock products for customers/guests
  const hideSetting = await prisma.storeSettings.findUnique({
    where: { key: 'hideOutOfStock' },
  });
  const hideOutOfStock = hideSetting ? (hideSetting.value as boolean) === true : false;

  // Fetch recommended products (Top sellers or just some products)
  const recommendedProductsRaw = await prisma.product.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      ...(hideOutOfStock ? { stockQuantity: { gt: 0 } } : {})
    },
    take: 12,
    include: {
      images: true,
      brand: true,
      category: true,
    },
    orderBy: {
      stockQuantity: 'desc'
    }
  });

  const recommendedProducts = (await priceService.enrichProductsWithPrices(
    recommendedProductsRaw,
    companyId
  )).map(p => ({
    ...p,
    basePrice: Number(p.basePrice),
    stockQuantity: Number(p.stockQuantity),
    weight: p.weight ? Number(p.weight) : null,
    length: p.length ? Number(p.length) : null,
    width: p.width ? Number(p.width) : null,
    height: p.height ? Number(p.height) : null,
  }));

  // Fetch the last 3 completed/processing or any past orders for the B2B company
  const isSalesRep = user?.role === 'SALES_REP';
  const recentOrdersRaw = (companyId && !isSalesRep) ? await prisma.order.findMany({
    where: { companyId },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { items: true }
      }
    }
  }) : [];

  const recentOrders = recentOrdersRaw.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    totalGross: Number(o.totalGross),
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    itemCount: o._count.items
  }));

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PublicHeader />
      
      <CartContent recentOrders={recentOrders} />

      {/* Recommended Products at the bottom */}
      <section className="bg-zinc-50 py-16 border-t border-zinc-100">
        <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-12">
          <ProductSlider title="Productos recomendados para ti">
            {recommendedProducts.map((p: any, idx: number) => (
              <div 
                key={`${p.id}-${idx}`} 
                className="w-[85vw] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] shrink-0 snap-start"
              >
                <ProductCard product={p} variant="catalog" isAuthenticated={!!user} />
              </div>
            ))}
          </ProductSlider>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
