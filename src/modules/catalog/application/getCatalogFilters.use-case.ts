/**
 * modules/catalog/application/getCatalogFilters.use-case.ts
 *
 * Carga los metadatos de filtros del catálogo: categorías y marcas.
 *
 * Separado del use case de productos para poder cachearse de forma
 * independiente (estos datos cambian con poca frecuencia).
 *
 * Usa `unstable_cache` de Next.js → se reutiliza entre requests durante
 * 1 hora (Data Cache) y se invalida automáticamente al revalidar los
 * tags 'categories', 'brands' o 'products'.
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
 * Ahora de forma dinámica:
 * - Los conteos de categorías solo incluyen productos activos con stock > 0 que pertenezcan a la marca seleccionada.
 * - Los conteos de marcas solo incluyen productos activos con stock > 0 que pertenezcan a la categoría seleccionada (y subcategorías).
 *
 * TTL: 1 hora. unstable_cache automáticamente incluye los argumentos en la key de caché.
 */
export const getCatalogFiltersUseCase = unstable_cache(
  async (categoryQuery?: string, brandQuery?: string): Promise<CatalogFiltersData> => {
    const baseProductFilter = {
      isActive: true,
      isDeleted: false,
      stockQuantity: { gt: 0 }
    };

    // 1. Filtro de Marca (para contar en categorías)
    let brandFilter = {};
    if (brandQuery) {
      const brands = brandQuery.split(',').map(b => b.trim());
      brandFilter = {
        brand: {
          OR: [
            { id: { in: brands } },
            { slug: { in: brands } }
          ]
        }
      };
    }

    // 2. Filtro de Categoría (para contar en marcas)
    let categoryFilter = {};
    if (categoryQuery) {
      // Necesitamos resolver si es padre para incluir hijos
      const cat = await prisma.category.findFirst({
        where: {
          OR: [{ id: categoryQuery }, { slug: categoryQuery }]
        },
        include: { children: true }
      });
      if (cat) {
        const catIds = [cat.id, ...cat.children.map(c => c.id)];
        categoryFilter = {
          categoryId: { in: catIds }
        };
      }
    }

    const [categories, brands] = await Promise.all([
      // Categorías: Traemos TODAS, pero el _count depende del brandFilter y stock
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          _count: { 
            select: { 
              products: {
                where: {
                  ...baseProductFilter,
                  ...brandFilter
                }
              }
            } 
          },
        },
        orderBy: { name: 'asc' },
      }),
      // Marcas: Traemos TODAS, pero el _count depende del categoryFilter y stock
      prisma.brand.findMany({
        select: { 
          id: true, 
          name: true, 
          slug: true,
          _count: {
            select: {
              products: {
                where: {
                  ...baseProductFilter,
                  ...categoryFilter
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { categories, brands };
  },
  ['catalog-filters-dynamic-v2'],
  { revalidate: 3600, tags: ['categories', 'brands', 'products'] }
);
