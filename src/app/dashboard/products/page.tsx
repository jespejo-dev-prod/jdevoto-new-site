'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

// Hooks
import { useProducts } from '@/modules/catalog/presentation/hooks/useProducts';
import { useDeleteProduct } from '@/modules/catalog/presentation/hooks/useDeleteProduct';
import { useCategories } from '@/modules/catalog/application/hooks/useCatalogData';

// Components
import { ProductCard } from '@/modules/catalog/presentation/components/ProductList/ProductCard';
import { ProductTable } from '@/modules/catalog/presentation/components/ProductList/ProductTable';
import { ProductsFilterBar } from '@/modules/catalog/presentation/components/ProductList/ProductsFilterBar';
import { Pagination } from '@/modules/catalog/presentation/components/ProductList/Pagination';

// ─── Skeleton ───────────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-zinc-800/50" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-zinc-800 rounded w-1/3" />
        <div className="h-4 bg-zinc-800 rounded w-2/3" />
        <div className="h-px bg-zinc-800 w-full" />
        <div className="flex justify-between">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="h-5 bg-zinc-800 rounded-full w-1/4" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Plus className="h-8 w-8 text-zinc-700" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">
        {hasFilters ? 'Sin resultados' : 'No hay productos'}
      </h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">
        {hasFilters
          ? 'Prueba con otros términos de búsqueda o limpia los filtros.'
          : 'Comienza añadiendo tu primer producto al catálogo.'}
      </p>
      {!hasFilters && (
        <Link href="/dashboard/products/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs transition-all shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        </Link>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState(urlSearch);
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | 'published' | 'draft' | 'trash'>('all');

  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);

  // Sync state with URL search param
  useEffect(() => {
    setSearch(urlSearch);
    setPage(1);
  }, [urlSearch]);

  // Load initial setting on component mount
  useEffect(() => {
    fetch('/api/settings?key=hideOutOfStock')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.value !== null) {
          setHideOutOfStock(data.value);
        }
      })
      .catch((err) => console.error('Error fetching setting:', err));
  }, []);

  const handleToggleHideOutOfStock = async () => {
    setIsUpdatingSetting(true);
    const newValue = !hideOutOfStock;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'hideOutOfStock', value: newValue }),
      });
      if (res.ok) {
        setHideOutOfStock(newValue);
      } else {
        alert('Error al guardar la configuración');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al guardar la configuración');
    } finally {
      setIsUpdatingSetting(false);
    }
  };

  const { data, isLoading, isFetching } = useProducts({
    search,
    categoryId,
    page,
    limit: 16,
    includeInactive: true,
    status,
  });

  const { data: categoriesData = [] } = useCategories();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const hasFilters = !!search || !!categoryId;

  const handleDelete = useCallback(
    (id: string, name: string) => {
      if (window.confirm(`¿Eliminar el producto "${name}"? Esta acción no se puede deshacer.`)) {
        deleteProduct(id);
      }
    },
    [deleteProduct]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setPage(1);
  };

  return (
    <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            Catálogo de Productos
          </h1>
          <p className="text-sm text-zinc-500">
            {isLoading ? 'Cargando inventario...' : `${total} productos en total`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleHideOutOfStock}
            disabled={isUpdatingSetting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] hover:scale-[1.01] cursor-pointer ${
              hideOutOfStock
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 border border-rose-500/30'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            {isUpdatingSetting ? (
              <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <span className={`h-2 w-2 rounded-full ${hideOutOfStock ? 'bg-white animate-pulse' : 'bg-zinc-500'}`} />
            )}
            {hideOutOfStock ? 'Ocultando Sin Stock' : 'Ocultar Sin Stock del Catálogo'}
          </button>

          <Link href="/dashboard/products/new">
            <button
              id="btn-new-product"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs transition-all shadow-lg shadow-primary/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </button>
          </Link>
        </div>
      </div>

      {/* WordPress-like status tabs filter */}
      <div className="flex border-b border-zinc-800 gap-6 text-[10px] uppercase tracking-widest font-black pb-1.5 -mb-4">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'published', label: 'Publicados' },
          { id: 'draft', label: 'Borradores' },
          { id: 'trash', label: 'Papelera' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatus(tab.id as any);
              setPage(1);
            }}
            className={`pb-3 border-b-2 transition-all relative ${
              status === tab.id
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <ProductsFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        categoryId={categoryId}
        onCategoryChange={handleCategoryChange}
        categories={categoriesData}
        view={view}
        onViewChange={setView}
        total={isLoading ? undefined : total}
      />

      {/* Products Grid / List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </motion.div>
        ) : view === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {products.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                  priority={index < 4}
                />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
          >
            {products.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 flex justify-center">
                <EmptyState hasFilters={hasFilters} />
              </div>
            ) : (
              <ProductTable
                products={products}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={isFetching}
        />
      )}
    </div>
  );
}
