/**
 * modules/catalog/application/getCatalogFilters.use-case.ts
 *
 * Carga los metadatos de filtros del catálogo: categorías y marcas.
 *
 * Separado del use case de productos para poder cachearse de forma
 * independiente (estos datos cambian con poca frecuencia).
 *
 * Usa `unstable_cache` de Next.js → se reutiliza entre requests durante
 * 5 minutos (Data Cache) y se invalida automáticamente al revalidar los
 * tags 'categories' o 'brands'.
 */

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/client';

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  _count: { products: number };
};

export type CatalogBrand = {
  id: string;
  name: string;
  slug: string;
};

export type CatalogFiltersData = {
  categories: CatalogCategory[];
  brands: CatalogBrand[];
};

/**
 * getCatalogFiltersUseCase
 *
 * Retorna categorías y marcas ordenadas alfabéticamente.
 *
 * TTL: 1 hora — categorías y marcas cambian muy raramente.
 * Invalidación manual: llamar a revalidateTag('categories') o
 * revalidateTag('brands') desde un Server Action cuando un admin
 * crea/edita/elimina una categoría o marca.
 */
export const getCatalogFiltersUseCase = unstable_cache(
  async (): Promise<CatalogFiltersData> => {
    const [categories, brands] = await Promise.all([
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          _count: { select: { products: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.brand.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { categories, brands };
  },
  ['catalog-filters'],
  { revalidate: 3600, tags: ['categories', 'brands'] }
);
