'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, LayoutGrid, List as ListIcon, ArrowUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: any[];
  brandId?: string;
  onBrandChange?: (value: string) => void;
  brands?: any[];
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  total?: number;
  variant?: 'dashboard' | 'catalog';
  limit?: number;
  onLimitChange?: (limit: number) => void;
}

const DEBOUNCE_MS = 350;

export function ProductsFilterBar({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  categories,
  brandId,
  onBrandChange,
  brands,
  view,
  onViewChange,
  total,
  variant = 'dashboard',
  limit = 24,
  onLimitChange,
}: ProductsFilterBarProps) {
  const isDashboard = variant === 'dashboard';
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters = !!search || !!categoryId || !!brandId;

  const containerClasses = cn(
    "flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl border backdrop-blur-sm shadow-sm",
    isDashboard ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-100 bg-white"
  );

  const inputClasses = cn(
    "w-full pl-11 pr-11 py-3 rounded-2xl border text-base transition-colors outline-none",
    isDashboard ? "bg-zinc-950 border-zinc-800 text-white focus:border-primary/50 placeholder:text-zinc-500" : "bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-primary placeholder:text-zinc-400"
  );

  const selectClasses = cn(
    "h-12 pl-4 pr-10 rounded-2xl border text-sm font-bold transition-colors appearance-none cursor-pointer outline-none",
    isDashboard ? "bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-primary/50" : "bg-zinc-50 border-zinc-100 text-zinc-700 focus:border-primary"
  );

  return (
    <div className={containerClasses}>
      <div className="flex flex-1 items-center gap-3 flex-wrap">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none" />
          <input
            id="product-search"
            type="text"
            placeholder={isDashboard ? "Buscar por nombre, SKU..." : "Busca entre miles de productos..."}
            className={inputClasses}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Selector de categoría */}
        <div className="relative">
          <select
            id="product-category-filter"
            aria-label="Categoría"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={selectClasses}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => {
              const displayName = cat.name.includes(" > ")
                ? `  ${cat.name.split(" > ")[1]}`
                : cat.name;
              return (
                <option key={cat.id} value={cat.id}>
                  {displayName.toUpperCase()}
                </option>
              );
            })}
          </select>
          <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>

        {/* Selector de marca */}
        {brands && onBrandChange && (
          <div className="relative">
            <select
              id="product-brand-filter"
              aria-label="Marca"
              value={brandId || ''}
              onChange={(e) => onBrandChange(e.target.value)}
              className={selectClasses}
            >
              <option value="">Todas las marcas</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name.toUpperCase()}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          </div>
        )}

        {/* Selector de cantidad por página (Límite) */}
        {!isDashboard && onLimitChange && (
          <div className="relative">
            <select
              id="product-limit-filter"
              aria-label="Productos por página"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className={selectClasses}
            >
              <option value="24">24 POR PÁGINA</option>
              <option value="100">100 POR PÁGINA</option>
              <option value="500">500 POR PÁGINA</option>
              <option value="1000">1000 POR PÁGINA</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          </div>
        )}

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setLocalSearch('');
              onSearchChange('');
              onCategoryChange('');
              if (onBrandChange) onBrandChange('');
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all"
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        )}

        {/* Total */}
        {total !== undefined && (
          <span className={cn("text-xs font-bold uppercase tracking-wider", isDashboard ? "text-zinc-600" : "text-zinc-500")}>
            {total} {total === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>

      {/* Vista grid/lista */}
      <div className={cn("flex items-center gap-2 border-l pl-4 ml-2 hidden lg:flex flex-shrink-0", isDashboard ? "border-zinc-800" : "border-zinc-100")}>
        <div className={cn("flex p-1 rounded-xl border", isDashboard ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-100")}>
          <button
            id="view-grid"
            onClick={() => onViewChange('grid')}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              view === 'grid' 
                ? (isDashboard ? 'bg-zinc-800 text-white' : 'bg-white text-primary shadow-sm') 
                : 'text-zinc-500 hover:text-zinc-300'
            )}
            title="Vista cuadrícula"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            id="view-list"
            onClick={() => onViewChange('list')}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              view === 'list' 
                ? (isDashboard ? 'bg-zinc-800 text-white' : 'bg-white text-primary shadow-sm') 
                : 'text-zinc-500 hover:text-zinc-300'
            )}
            title="Vista lista"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
