'use client';

/**
 * src/modules/catalog/presentation/components/ProductForm/EditProductForm.tsx
 *
 * Wrapper del formulario en modo edición.
 * Reutiliza todos los componentes del formulario de creación (DRY).
 */

import { FormProvider } from 'react-hook-form';

import { useProductForm } from '@/modules/catalog/application/hooks/useProductForm';
import { useProductTabs } from '@/modules/catalog/application/hooks/useProductTabs';
import { useCategories, useBrands } from '@/modules/catalog/application/hooks/useCatalogData';
import { useRovingTabs } from '@/shared/presentation/hooks/useRovingTabs';
import { ProductTab } from '@/modules/catalog/domain/product.constants';

import { PageHeader } from './PageHeader';
import { ProductNameField, ProductDescriptionField } from './IdentityFields';
import { PublishCard } from './Cards/PublishCard';
import { ClassificationCard } from './Cards/ClassificationCard';
import { ImageCard } from './Cards/ImageCard';
import { PRODUCT_TABS_CONFIG, PRODUCT_TAB_COMPONENTS, TabConfig } from './form.constants';
import { ProductTabsSidebar } from './ProductTabsSidebar';
import { ProductTabPanel } from './ProductTabPanel';
import { DashboardProduct } from '@/modules/catalog/presentation/hooks/useProducts';

interface EditProductFormProps {
  product: DashboardProduct & Record<string, any>;
}

export function EditProductForm({ product }: EditProductFormProps) {
  const { form, onSubmit, isSubmitting } = useProductForm({ product });
  const { activeTab, setActiveTab } = useProductTabs();

  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: brands = [], isLoading: loadingBrands } = useBrands();

  const { handleKeyDown, setItemRef } = useRovingTabs<TabConfig, ProductTab>({
    items: PRODUCT_TABS_CONFIG,
    activeId: activeTab,
    onSelect: setActiveTab,
    getId: (item) => item.id,
  });

  const ActiveTabComponent = PRODUCT_TAB_COMPONENTS[activeTab];

  return (
    <FormProvider {...form}>
      <div className="p-8 max-w-[1500px] mx-auto w-full">
        <PageHeader
          title={`Editando: ${product.name}`}
          breadcrumbs={[{ label: 'Productos', href: '/dashboard/products' }]}
          productSlug={product.slug}
        />

        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Workspace Principal */}
          <section className="lg:col-span-9 space-y-6">
            <ProductNameField slug={form.watch('slug')} />
            <ProductDescriptionField />

            {/* Centro de Configuración Técnica */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-4 text-xs font-bold text-white uppercase tracking-widest px-6">
                Configuración Técnica
              </div>

              <div className="flex flex-col md:flex-row min-h-[500px]">
                <ProductTabsSidebar
                  activeTab={activeTab}
                  onSelect={setActiveTab}
                  onKeyDown={handleKeyDown}
                  setItemRef={setItemRef}
                />
                <ProductTabPanel
                  activeTab={activeTab}
                  ActiveTabComponent={ActiveTabComponent}
                />
              </div>
            </div>
          </section>

          {/* Barra Lateral de Acciones */}
          <aside className="lg:col-span-3 space-y-6">
            <PublishCard isSubmitting={isSubmitting} isEditing />
            <ClassificationCard
              categories={categories}
              brands={brands}
              isLoading={loadingCategories || loadingBrands}
            />
            <ImageCard />
          </aside>
        </form>
      </div>
    </FormProvider>
  );
}
