import React from 'react';

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/server-auth';
import { prisma } from '@/lib/client';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { QuickBuyView } from '@/modules/catalog/presentation/components/QuickBuy/QuickBuyView';

export const metadata = {
  title: 'Compra Rápida',
  description: 'Ingresa SKUs de forma manual, carga archivos de Excel o busca por categoría para acelerar tus compras B2B.',
};

export default async function CompraRapidaPage() {
  // 1. Validar autenticación B2B del usuario
  const user = await getServerUser();
  if (!user) {
    redirect('/login?redirect=/compra-rapida');
  }

  // 2. Cargar categorías de la base de datos para la pestaña 4
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-zinc-900">
      <PublicHeader />

      <main className="flex-grow max-w-[1440px] mx-auto w-full p-6 lg:p-12 pt-8 pb-24">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-[36px] font-black text-zinc-950 tracking-tight leading-none uppercase">
            Compra Rápida
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Agrega productos de forma masiva a tu carro de compras mediante nuestros cuatro métodos optimizados.
          </p>
        </div>

        <QuickBuyView categories={categories} />
      </main>

      <PublicFooter />
    </div>
  );
}
