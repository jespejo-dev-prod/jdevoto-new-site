import React from 'react';

export const dynamic = 'force-dynamic';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { CartContent } from './CartContent';
import { prisma } from '@/lib/client';
import { ProductSlider } from '@/components/ui/product-slider';
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
  const recentOrdersRaw = companyId ? await prisma.order.findMany({
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
          <ProductSlider 
            title="Productos recomendados para ti" 
            products={recommendedProducts} 
          />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
