/**
 * src/app/dashboard/products/new/page.tsx
 */

'use client';

import { FormProvider } from 'react-hook-form';

// Domain & Application
import { useProductForm } from '@/modules/catalog/application/hooks/useProductForm';
import { useProductTabs } from '@/modules/catalog/application/hooks/useProductTabs';
import { useCategories, useBrands } from '@/modules/catalog/application/hooks/useCatalogData';
import { useRovingTabs } from '@/shared/presentation/hooks/useRovingTabs';
import { ProductTab } from '@/modules/catalog/domain/product.constants';

// Components
import { PageHeader } from '@/modules/catalog/presentation/components/ProductForm/PageHeader';
import { ProductNameField, ProductDescriptionField } from '@/modules/catalog/presentation/components/ProductForm/IdentityFields';
import { PublishCard } from '@/modules/catalog/presentation/components/ProductForm/Cards/PublishCard';
import { ClassificationCard } from '@/modules/catalog/presentation/components/ProductForm/Cards/ClassificationCard';
import { ImageCard } from '@/modules/catalog/presentation/components/ProductForm/Cards/ImageCard';
import { PRODUCT_TABS_CONFIG, PRODUCT_TAB_COMPONENTS, TabConfig } from '@/modules/catalog/presentation/components/ProductForm/form.constants';
import { ProductTabsSidebar } from '@/modules/catalog/presentation/components/ProductForm/ProductTabsSidebar';
import { ProductTabPanel } from '@/modules/catalog/presentation/components/ProductForm/ProductTabPanel';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';

export default function NewProductPage() {
 const { form, onSubmit, isSubmitting, slug } = useProductForm();
 const { activeTab, setActiveTab } = useProductTabs();

 const { data: categories = [], isLoading: loadingCategories } = useCategories();
 const { data: brands = [], isLoading: loadingBrands } = useBrands();

 // Keyboard navigation and focus management for tabs
 const { handleKeyDown, setItemRef } = useRovingTabs<TabConfig, ProductTab>({
 items: PRODUCT_TABS_CONFIG,
 activeId: activeTab,
 onSelect: setActiveTab,
 getId: (item) => item.id
 });

 const ActiveTabComponent = PRODUCT_TAB_COMPONENTS[activeTab];

 return (
 <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SALES_REP]}>
 <FormProvider {...form}>
 <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
 <PageHeader
 title="Editor de Producto"
 breadcrumbs={[{ label: 'Productos', href: '/dashboard/products' }]}
 />

 <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Workspace Principal */}
 <section className="lg:col-span-9 space-y-6">
 <ProductNameField slug={slug} />
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
 <PublishCard isSubmitting={isSubmitting} />
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
 </RoleGuard>
 );
}
