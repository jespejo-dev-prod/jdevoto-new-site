/**
 * app/products/page.tsx
 *
 * Página del catálogo de productos.
 *
 * Responsabilidades de esta página:
 *   1. Parsear los searchParams de la URL
 *   2. Cargar los metadatos de filtros (cacheados)
 *   3. Renderizar el shell inmediato (header, footer)
 *   4. Delegar las queries pesadas a <ProductGridServer> dentro de <Suspense>
 *      → el usuario ve el layout al instante; el grid aparece vía streaming
 *
 * La lógica de negocio (filtros, queries, precios) vive en:
 *   - modules/catalog/application/getCatalogFilters.use-case.ts
 *   - modules/catalog/application/getCatalogProducts.use-case.ts
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';

// ISR: shell estático cacheado, grid via streaming con Suspense.
export const revalidate = 86400;

import { getServerUser } from '@/lib/server-auth';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { getCatalogFiltersUseCase } from '@/modules/catalog/application/getCatalogFilters.use-case';
import { ProductGridServer } from './ProductGridServer';
import CatalogLoading from './loading';
import type { CatalogFilters } from '@/modules/catalog/application/getCatalogProducts.use-case';

// ─── SEO Metadata dinámica ───────────────────────────────────────────────────────
// Búsquedas y paginación: NO indexar (thin content)
// Categorías y catálogo base: SÍ indexar
export async function generateMetadata(
  props: { searchParams: Promise<Record<string, string | undefined>> }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl';

  const hasSearch = !!searchParams.search;
  const hasPagination = Number(searchParams.page) > 1;
  const categorySlug = searchParams.category || searchParams.categoryId || '';

  // Búsquedas y páginas 2+ generan thin content: no indexar
  const shouldNoIndex = hasSearch || hasPagination;

  let title = 'Catálogo de Productos Mayorista';
  let description = 'Empresa mayorista dedicada a la distribución y comercialización de artículos escolares, didácticos, herramientas y mucho más. Precios mayoristas B2B en Chile.';

  if (categorySlug && !hasSearch) {
    // Capitalizar el slug para el título
    const readable = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    title = `${readable} al por mayor`;
    description = `Compra ${readable} al por mayor. Catálogo mayorista B2B con los mejores precios para empresas en Chile.`;
  }

  const canonicalUrl = categorySlug
    ? `${baseUrl}/products?category=${categorySlug}`
    : `${baseUrl}/products`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: shouldNoIndex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: shouldNoIndex ? undefined : {
      title: `${title} | J. Devoto`,
      description,
      url: canonicalUrl,
      type: 'website',
      locale: 'es_CL',
      siteName: 'J. Devoto',
      images: [
        {
          url: `${baseUrl}/opengraph-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}


// ─── Parser de searchParams ─────────────────────────────────────────────────────

function parseFilters(
  params: Record<string, string | undefined>
): CatalogFilters {
  return {
    page: Number(params.page) || 1,
    limit: Number(params.limit) || 24,
    categoryQuery: params.category || params.categoryId || '',
    subcategoriesQuery: params.subcategories || '',
    search: params.search || '',
    brandsQuery: params.brands || '',
    offersOnly: params.offers === 'true',
    bestSellersOnly: params.bestSellers === 'true',
    essentialsOnly: params.essentials === 'true',
  };
}

// ─── Página ─────────────────────────────────────────────────────────────────────

export default async function CatalogPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const filters = parseFilters(searchParams);

  // Metadatos de filtros cacheados (categories + brands) — muy rápido (~0ms si hay cache)
  // Se resuelven antes del Suspense para que el sidebar se renderice sin esperar el grid.
  const [filtersData, user] = await Promise.all([
    getCatalogFiltersUseCase(filters.categoryQuery, filters.brandsQuery),
    getServerUser(),
  ]);

  const companyId = user?.companyId || null;
  const isPrivileged = user ? (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') : false;

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <PublicHeader />

      <main className="max-w-[1440px] mx-auto w-full p-6 lg:p-12 flex-grow">
        {/*
         * Suspense boundary:
         *   - fallback: el skeleton animado (loading.tsx) aparece de inmediato
         *   - children: ProductGridServer hace las queries pesadas y hace streaming
         *     del HTML resultante cuando está listo
         */}
        <Suspense fallback={<CatalogLoading />}>
          <ProductGridServer
            filters={filters}
            filtersData={filtersData}
            companyId={companyId}
            isPrivileged={isPrivileged}
          />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
