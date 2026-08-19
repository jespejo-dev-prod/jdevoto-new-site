/**
 * app/categorias/[slug]/page.tsx
 *
 * Landing page dedicada para categorías (SEO-friendly).
 * Reemplaza el uso de /products?category=slug
 */

import React, { Suspense } from 'react';
import type { Metadata } from 'next';

export const revalidate = 60;

import { getServerUser } from '@/lib/server-auth';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { getCatalogFiltersUseCase } from '@/modules/catalog/application/getCatalogFilters.use-case';
import { ProductGridServer } from '@/app/products/ProductGridServer';
import CatalogLoading from '@/app/products/loading';
import type { CatalogFilters } from '@/modules/catalog/application/getCatalogProducts.use-case';

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata(
  props: CategoryPageProps
): Promise<Metadata> {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl';

  // Subcategorías o filtros paginados: noindex si están muy fragmentados, pero 
  // para esta ruta principal, indexamos la base.
  const hasPagination = Number(searchParams.page) > 1;
  const shouldNoIndex = hasPagination;

  const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const title = `${readable} al por mayor`;
  const description = `Compra ${readable} al por mayor. Catálogo mayorista B2B con los mejores precios para empresas en Chile.`;

  // Native Next.js canonical mapping
  const canonicalUrl = `${baseUrl}/categorias/${slug}`;

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

function parseFilters(
  slug: string,
  params: Record<string, string | undefined>
): CatalogFilters {
  return {
    page: Number(params.page) || 1,
    limit: Number(params.limit) || 24,
    categoryQuery: slug, // Obligamos a que el filtro de categoría sea el path de la URL
    subcategoriesQuery: params.subcategories || '',
    search: params.search || '',
    brandsQuery: params.brands || '',
    offersOnly: params.offers === 'true',
    bestSellersOnly: params.bestSellers === 'true',
    essentialsOnly: params.essentials === 'true',
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  
  const filters = parseFilters(slug, searchParams);

  const [filtersData, user] = await Promise.all([
    getCatalogFiltersUseCase(filters.categoryQuery, filters.brandsQuery),
    getServerUser(),
  ]);

  const companyId = user?.companyId || null;

  // JSON-LD de CollectionPage condicional (solo si es la vista raíz de la categoría sin filtros extra)
  const isCleanCategoryPage = !searchParams.page && !searchParams.subcategories && !searchParams.search;
  const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jdevoto.cl';
  
  const collectionJsonLd = isCleanCategoryPage ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${readable} al por mayor`,
    "description": `Catálogo mayorista B2B de ${readable} en Chile.`,
    "url": `${baseUrl}/categorias/${slug}`
  } : null;

  // Header textual SEO específico para la categoría (H1 visible y optimizado)
  const categoryHeader = (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center border-b border-zinc-100">
      <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-2">
        {readable} al por mayor
      </h1>
      <p className="text-zinc-500 text-sm md:text-base max-w-2xl mx-auto">
        Explora nuestro catálogo B2B de {readable.toLowerCase()} con despacho a todo Chile y precios exclusivos para empresas, librerías y colegios.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {collectionJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
        />
      )}
      
      <PublicHeader />

      <main className="max-w-[1440px] mx-auto w-full p-6 lg:p-12 flex-grow">
        {categoryHeader}
        
        <Suspense fallback={<CatalogLoading />}>
          <ProductGridServer
            filters={filters}
            filtersData={filtersData}
            companyId={companyId}
          />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
