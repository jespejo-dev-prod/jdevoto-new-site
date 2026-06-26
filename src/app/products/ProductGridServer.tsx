/**
 * app/products/ProductGridServer.tsx
 *
 * Server Component responsable de la parte "pesada" del catálogo:
 * ejecuta las queries de DB a través del use case y pasa los datos
 * a CatalogView (Client Component).
 *
 * Al estar envuelto en <Suspense> en el page.tsx, Next.js puede:
 *   1. Enviar el shell de la página (header + sidebar) inmediatamente.
 *   2. Hacer streaming de este componente cuando las queries terminen.
 *
 * El usuario percibe carga instantánea en lugar de pantalla en blanco.
 */

import { CatalogView } from '@/modules/catalog/presentation/components/ProductList/CatalogView';
import { getCatalogProductsUseCase, type CatalogFilters } from '@/modules/catalog/application/getCatalogProducts.use-case';
import type { CatalogFiltersData } from '@/modules/catalog/application/getCatalogFilters.use-case';

interface ProductGridServerProps {
  filters: CatalogFilters;
  filtersData: CatalogFiltersData;
  companyId: string | null;
}

export async function ProductGridServer({
  filters,
  filtersData,
  companyId,
}: ProductGridServerProps) {
  const {
    products,
    totalCount,
    resolvedCategoryId,
    resolvedSubcategoryIds,
    resolvedBrandIds,
  } = await getCatalogProductsUseCase(filters, filtersData, companyId);

  return (
    <CatalogView
      initialProducts={products}
      categories={filtersData.categories}
      brands={filtersData.brands}
      totalCount={totalCount}
      currentPage={filters.page}
      itemsPerPage={filters.limit}
      initialCategory={resolvedCategoryId}
      initialSubcategories={resolvedSubcategoryIds}
      initialSearch={filters.search}
      initialBrands={resolvedBrandIds}
    />
  );
}
