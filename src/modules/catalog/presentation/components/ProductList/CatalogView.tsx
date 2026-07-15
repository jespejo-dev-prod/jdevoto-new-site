'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, ChevronLeft, ChevronRight, ChevronDown, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import { ProductTable } from './ProductTable';
import { ProductsFilterBar } from './ProductsFilterBar';
import { useAuth } from '@/context/auth-context';

import { trackSearchQuery, getRecentlyViewed, getSearchQueries } from '@/lib/tracking';

interface CatalogViewProps {
  initialProducts: any[];
  categories: any[];
  brands: any[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  initialCategory?: string;
  initialSubcategories?: string[];
  initialSearch?: string;
  initialBrands?: string[];
}

export function CatalogView({ 
  initialProducts, 
  categories, 
  brands,
  totalCount,
  currentPage,
  itemsPerPage,
  initialCategory = '',
  initialSubcategories = [],
  initialSearch = '',
  initialBrands = []
}: CatalogViewProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  
  // Filtros interactivos
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrands);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(initialSubcategories);
  const [subcatSearch, setSubcatSearch] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [overrideProducts, setOverrideProducts] = useState<any[] | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  const showRecentlyViewed = searchParams.get('recentlyViewed') === 'true';
  const showSearchHistory = searchParams.get('searchHistory') === 'true';
  const showRelated = searchParams.get('related') === 'true';
  
  const { accessToken } = useAuth();
  const isAuthenticated = !!accessToken;

  useEffect(() => {
    if (showRecentlyViewed) {
      const slugs = getRecentlyViewed();
      if (slugs.length > 0) {
        fetch(`/api/products/by-slugs?slugs=${slugs.join(',')}`)
          .then(res => res.json())
          .then(resData => {
            if (resData.success && Array.isArray(resData.data)) {
              setOverrideProducts(resData.data);
            }
          });
      } else {
        setOverrideProducts([]);
      }
    } else if (showRelated) {
      const slugs = getRecentlyViewed();
      if (slugs.length > 0) {
        fetch(`/api/products/by-slugs?slugs=${slugs.slice(0, 3).join(',')}&related=true`)
          .then(res => res.json())
          .then(resData => {
            if (resData.success && Array.isArray(resData.data)) {
              setOverrideProducts(resData.data);
            }
          });
      } else {
        setOverrideProducts([]);
      }
    } else if (showSearchHistory) {
      const queries = getSearchQueries();
      if (queries.length > 0) {
        setSearchQuery(queries[0]);
        fetch(`/api/products?search=${encodeURIComponent(queries[0])}&limit=24`)
          .then(res => res.json())
          .then(resData => {
            if (resData.success && Array.isArray(resData.data)) {
              setOverrideProducts(resData.data);
            }
          });
      } else {
        setOverrideProducts([]);
      }
    } else {
      setOverrideProducts(null);
    }
  }, [showRecentlyViewed, showRelated, showSearchHistory]);

  // Sincronizar estados locales con los query params de la URL
  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setSelectedSubcategories(initialSubcategories);
  }, [initialSubcategories]);

  useEffect(() => {
    if (!showSearchHistory) {
      setSearchQuery(initialSearch);
      if (initialSearch) {
        trackSearchQuery(initialSearch);
      }
    }
  }, [initialSearch, showSearchHistory]);

  useEffect(() => {
    setSelectedBrands(initialBrands);
  }, [initialBrands]);

  const navigateWithFilters = (updates: {
    page?: number;
    categoryId?: string | null;
    subcategories?: string[] | null;
    search?: string | null;
    brands?: string[] | null;
    limit?: number | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.page !== undefined) {
      if (updates.page > 1) params.set('page', String(updates.page));
      else params.delete('page');
    } else {
      params.delete('page');
    }

    if (updates.categoryId !== undefined) {
      params.delete('categoryId'); // clean up legacy CUID param
      if (updates.categoryId) {
        const cat = categories.find(c => c.id === updates.categoryId);
        if (cat?.slug) {
          params.set('category', cat.slug);
        } else {
          params.set('category', updates.categoryId);
        }
      } else {
        params.delete('category');
      }
      
      // Limpiar subcategorías al cambiar de categoría padre
      params.delete('subcategories');

      params.delete('searchHistory');
      params.delete('recentlyViewed');
      params.delete('related');
    }

    if (updates.subcategories !== undefined) {
      if (updates.subcategories && updates.subcategories.length > 0) {
        const subcatSlugs = updates.subcategories.map(id => {
          const cat = categories.find(c => c.id === id);
          return cat?.slug || id;
        });
        params.set('subcategories', subcatSlugs.join(','));
      } else {
        params.delete('subcategories');
      }
    }

    if (updates.search !== undefined) {
      if (updates.search) params.set('search', updates.search);
      else params.delete('search');

      params.delete('searchHistory');
      params.delete('recentlyViewed');
      params.delete('related');
    }

    if (updates.brands !== undefined) {
      if (updates.brands && updates.brands.length > 0) {
        const brandSlugs = updates.brands.map(id => {
          const b = brands.find(brand => brand.id === id);
          return b?.slug || id;
        });
        params.set('brands', brandSlugs.join(','));
      } else {
        params.delete('brands');
      }
    }

    if (updates.limit !== undefined) {
      if (updates.limit && updates.limit !== 24) {
        params.set('limit', String(updates.limit));
      } else {
        params.delete('limit');
      }
    }

    router.push(`/products?${params.toString()}`);
  };

  const getPageLink = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNumber > 1) {
      params.set('page', String(pageNumber));
    } else {
      params.delete('page');
    }
    return `/products?${params.toString()}`;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const parentCategories = categories.filter(c => !c.parentId);
  const getChildren = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  };
  const getCategoryProductCount = (category: any) => {
    const directCount = category._count?.products || 0;
    if (!category.parentId) {
      const children = getChildren(category.id);
      const childrenCount = children.reduce((acc, child) => acc + (child._count?.products || 0), 0);
      return directCount + childrenCount;
    }
    return directCount;
  };

  // 1. Extraer de forma 100% dinámica y flexible los atributos y especificaciones de la "Ficha Técnica" de los productos cargados
  const specificationsMap: Record<string, Set<string>> = {};

  initialProducts.forEach(p => {
    let productSpecs: any = null;
    try {
      productSpecs = typeof p.specifications === 'string' 
        ? JSON.parse(p.specifications) 
        : p.specifications;
    } catch (e) {}

    if (!productSpecs) return;

    if (Array.isArray(productSpecs)) {
      // Formato A (Array de objetos): [ { name: "color", value: "black" } ]
      productSpecs.forEach(spec => {
        if (spec && spec.name && spec.value) {
          const key = spec.name.charAt(0).toUpperCase() + spec.name.slice(1).toLowerCase().trim();
          const val = String(spec.value).trim();
          if (!specificationsMap[key]) {
            specificationsMap[key] = new Set<string>();
          }
          specificationsMap[key].add(val);
        }
      });
    } else if (typeof productSpecs === 'object') {
      // Formato B (Objeto plano de atributos): { color: "black", material: "papel" }
      Object.entries(productSpecs).forEach(([key, val]) => {
        if (key && val) {
          const keyName = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase().trim();
          const valStr = String(val).trim();
          if (!specificationsMap[keyName]) {
            specificationsMap[keyName] = new Set<string>();
          }
          specificationsMap[keyName].add(valStr);
        }
      });
    }
  });

  // Convertir mapa a un objeto con arrays ordenados para poder listarlos en los selectores
  const availableSpecs = Object.entries(specificationsMap).reduce((acc, [name, valuesSet]) => {
    acc[name] = Array.from(valuesSet).sort();
    return acc;
  }, {} as Record<string, string[]>);

  // 2. Lógica de filtrado en cliente
  const activeCategoryObj = categories.find(c => c.id === activeCategory);
  const isParentActive = activeCategoryObj && !activeCategoryObj.parentId;
  const childCategoryIds = isParentActive 
    ? categories.filter(c => c.parentId === activeCategory).map(c => c.id)
    : [];
  const activeParentId = activeCategoryObj?.parentId || (activeCategoryObj && !activeCategoryObj.parentId ? activeCategoryObj.id : null);

  const baseList = overrideProducts !== null ? overrideProducts : initialProducts;

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const filteredProducts = baseList.filter(p => {
    // 1. Filtro Categoría
    let matchesCategory = true;
    if (selectedSubcategories && selectedSubcategories.length > 0) {
      matchesCategory = selectedSubcategories.includes(p.categoryId || '') || selectedSubcategories.includes(p.category?.id || '');
    } else if (activeCategory) {
      matchesCategory = p.categoryId === activeCategory || 
                        p.category?.id === activeCategory ||
                        (isParentActive && (childCategoryIds.includes(p.categoryId || '') || childCategoryIds.includes(p.category?.id || '')));
    }
    
    // 2. Filtro Búsqueda (nombre, sku, etc.)
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
                          
    // 3. Filtro Marcas (Selección múltiple)
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brandId || p.brand?.id || '');
    
    // 4. Filtro de Ficha Técnica Avanzado (Checkboxes por cada atributo JSON dinámico)
    const matchesSpecs = Object.entries(selectedSpecs).every(([specName, selectedValues]) => {
      if (selectedValues.length === 0) return true; // Si no hay selección, pasa
      
      let productSpecs: any = null;
      try {
        productSpecs = typeof p.specifications === 'string' 
          ? JSON.parse(p.specifications) 
          : p.specifications;
      } catch (e) {
        productSpecs = null;
      }

      if (!productSpecs) return false;

      // Buscar si el producto cumple con alguno de los valores seleccionados para este atributo
      if (Array.isArray(productSpecs)) {
        return productSpecs.some(spec => 
          spec && 
          spec.name && 
          spec.name.toLowerCase() === specName.toLowerCase() && 
          spec.value && 
          selectedValues.map(v => v.toLowerCase()).includes(String(spec.value).toLowerCase())
        );
      } else if (typeof productSpecs === 'object') {
        const productVal = productSpecs[specName.toLowerCase()] || productSpecs[specName] || productSpecs[specName.charAt(0).toLowerCase() + specName.slice(1)];
        if (productVal === undefined) return false;
        return selectedValues.map(v => v.toLowerCase()).includes(String(productVal).toLowerCase());
      }

      return false;
    });

    return matchesCategory && matchesSearch && matchesBrand && matchesSpecs;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 xl:gap-8">
      {/* SIDEBAR DE CATEGORÍAS & FILTROS AVANZADOS */}
      <aside className="hidden lg:block w-80 shrink-0 space-y-6">
         <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm space-y-6">
            {/* Categorías Principales */}
            <div>
              <h3 className="text-base font-black uppercase text-zinc-900 tracking-wide mb-4 border-b border-zinc-100 pb-2.5">Categorías</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {parentCategories
                  .sort((a, b) => a.name.localeCompare(b.name, "es"))
                  .map((parent) => {
                    const isChecked = activeCategory === parent.id;
                    const parentCount = getCategoryProductCount(parent);
                    if (parentCount === 0 && !isChecked) return null; // Ocultar si no tiene stock/productos, a menos que esté seleccionada
                    
                    const isExpanded = parent.id === activeParentId;
                    const children = getChildren(parent.id);
                    const hasChildren = children.length > 0;

                    return (
                      <div key={parent.id} className="space-y-1.5">
                        {/* Parent Row */}
                        <label className={cn(
                          "flex items-center justify-between text-sm font-semibold transition-all py-1 select-none cursor-pointer",
                          isChecked ? "text-zinc-950 font-black scale-[1.01]" : "text-zinc-650 hover:text-zinc-950"
                        )}>
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                const nextCategory = isChecked ? '' : parent.id;
                                setActiveCategory(nextCategory);
                                setSelectedSubcategories([]);
                                setSubcatSearch('');
                                navigateWithFilters({ categoryId: nextCategory, subcategories: [] });
                              }}
                              className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-5 w-5 cursor-pointer"
                            />
                            <span className={cn(
                              "tracking-tight transition-colors text-sm sm:text-[14.5px] font-bold",
                              isChecked ? "text-zinc-950 font-black" : "text-zinc-700"
                            )}>{parent.name}</span>
                          </div>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-md font-black shrink-0 transition-colors",
                            isChecked ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-400"
                          )}>
                            {parentCount}
                          </span>
                        </label>

                        {/* Sublevel Nested Box (indented children scrollbox) */}
                        {hasChildren && isExpanded && (() => {
                          const filteredChildren = children.filter(child => {
                            const displayName = child.name.includes(" > ")
                              ? child.name.split(" > ")[1]
                              : child.name;
                            return displayName.toLowerCase().includes(subcatSearch.toLowerCase());
                          });

                          return (
                            <div className="pl-[12px] pr-1 py-1 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                              {/* Buscador dentro de subcategorías */}
                              {children.length > 6 && (
                                <div className="relative mb-2 pr-1.5">
                                  <input 
                                    type="text" 
                                    placeholder="Filtrar subcategorías..." 
                                    value={subcatSearch}
                                    onChange={(e) => setSubcatSearch(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors text-zinc-800"
                                  />
                                </div>
                              )}

                              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {filteredChildren.length === 0 ? (
                                  <div className="text-xs text-zinc-400 font-bold py-1 uppercase pl-4">Sin coincidencias</div>
                                ) : (
                                  filteredChildren
                                    .sort((a, b) => a.name.localeCompare(b.name, "es"))
                                    .map((child) => {
                                      const isChildChecked = selectedSubcategories.includes(child.id);
                                      const childCount = child._count?.products || 0;
                                      if (childCount === 0 && !isChildChecked) return null; // Ocultar si no tiene productos, a menos que esté seleccionada
                                      
                                      const displayName = child.name.includes(" > ")
                                        ? child.name.split(" > ")[1]
                                        : child.name;

                                      return (
                                        <label key={child.id} className="flex items-center justify-between text-xs font-semibold text-zinc-500 hover:text-zinc-950 cursor-pointer select-none transition-all py-1">
                                          <div className="flex items-center gap-3 w-full pr-2 min-w-0">
                                            <input 
                                              type="checkbox" 
                                              checked={isChildChecked}
                                              onChange={() => {
                                                const nextSubcats = isChildChecked 
                                                  ? selectedSubcategories.filter(id => id !== child.id)
                                                  : [...selectedSubcategories, child.id];
                                                setSelectedSubcategories(nextSubcats);
                                                navigateWithFilters({ subcategories: nextSubcats });
                                              }}
                                              className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-[18px] w-[18px] cursor-pointer shrink-0"
                                            />
                                            <span className={cn(
                                              "tracking-tight text-left truncate transition-colors text-sm font-semibold",
                                              isChildChecked ? "text-zinc-950 font-black" : "text-zinc-600 hover:text-zinc-950"
                                            )}>{displayName}</span>
                                          </div>
                                          <span className={cn(
                                            "text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 transition-colors",
                                            isChildChecked ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                                          )}>
                                            {childCount}
                                          </span>
                                        </label>
                                      );
                                    })
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
              </div>
            </div>
               {/* Marcas (Filtro Checkbox con Buscador) */}
            {brands && brands.length > 0 && (
              <div>
                <h3 className="text-base font-black uppercase text-zinc-900 tracking-wide mb-4 border-b border-zinc-100 pb-2.5">Mejores marcas</h3>
                
                {brands.length > 6 && (
                  <div className="relative mb-3.5">
                    <input 
                      type="text" 
                      placeholder="Buscar marca..." 
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors text-zinc-800"
                    />
                  </div>
                )}

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {filteredBrands.map((b) => {
                    const isChecked = selectedBrands.includes(b.id);
                    const brandCount = b._count?.products || 0;
                    if (brandCount === 0 && !isChecked) return null;

                    return (
                      <label key={b.id} className="flex items-center gap-3 text-sm font-semibold text-zinc-650 hover:text-zinc-950 cursor-pointer select-none py-1 transition-all">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            const nextBrands = isChecked 
                              ? selectedBrands.filter(id => id !== b.id) 
                              : [...selectedBrands, b.id];
                            setSelectedBrands(nextBrands);
                            navigateWithFilters({ brands: nextBrands });
                          }}
                          className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-5 w-5 cursor-pointer"
                        />
                        <span className={cn(
                          "tracking-tight transition-colors text-sm sm:text-[14px] font-bold",
                          isChecked ? "text-zinc-950 font-black" : "text-zinc-700"
                        )}>{b.name}</span>
                        <span className={cn(
                          "ml-auto text-[10px] px-2 py-0.5 rounded-md font-black shrink-0 transition-colors",
                          isChecked ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-400"
                        )}>
                          {brandCount}
                        </span>
                      </label>
                    );
                  })}
                  {filteredBrands.length === 0 && (
                    <div className="text-xs text-zinc-400 font-bold py-1 uppercase pl-4">Sin coincidencias</div>
                  )}
                </div>
              </div>
            )}

            {/* Ficha Técnica: Especificaciones y atributos del producto (Checkboxes Dinámicos) */}
            {Object.keys(availableSpecs).length > 0 && (
              <div className="space-y-6">
                {Object.entries(availableSpecs).map(([specName, values]) => (
                  <div key={specName} className="space-y-3">
                    <h3 className="text-base font-black uppercase text-zinc-900 tracking-wide border-b border-zinc-100 pb-2.5">{specName}</h3>
                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                      {values.map((val) => {
                        const isChecked = selectedSpecs[specName]?.includes(val) || false;
                        return (
                          <label key={val} className="flex items-center gap-3 text-sm font-semibold text-zinc-650 hover:text-zinc-950 cursor-pointer select-none py-1 transition-all">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                setSelectedSpecs(prev => {
                                  const currentValues = prev[specName] || [];
                                  const nextValues = isChecked 
                                    ? currentValues.filter(v => v !== val) 
                                    : [...currentValues, val];
                                  
                                  const next = { ...prev };
                                  if (nextValues.length > 0) {
                                    next[specName] = nextValues;
                                  } else {
                                    delete next[specName];
                                  }
                                  return next;
                                });
                              }}
                              className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-5 w-5 cursor-pointer"
                            />
                            <span className={cn(
                              "tracking-tight transition-colors text-sm sm:text-[14px] font-bold",
                              isChecked ? "text-zinc-950 font-black" : "text-zinc-700"
                            )}>{val}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botón: Limpiar Filtros */}
            {(selectedBrands.length > 0 || selectedSubcategories.length > 0 || Object.keys(selectedSpecs).length > 0 || activeCategory || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedBrands([]);
                  setSelectedSubcategories([]);
                  setSubcatSearch('');
                  setSelectedSpecs({});
                  setActiveCategory('');
                  setSearchQuery('');
                  router.push('/products');
                }}
                className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-red-100 flex items-center justify-center gap-2"
              >
                Limpiar Filtros
              </button>
            )}


         </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-6">
        {/* Filtros Mobile Trigger */}
        <div className="flex items-center gap-3 w-full lg:hidden">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex-1 h-11 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider text-zinc-800 shadow-sm active:scale-95 transition-transform"
          >
            <Filter className="h-4 w-4 text-zinc-500" />
            Filtrar Catálogo
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA & FILTROS */}
        <div className="flex justify-end">
          <div className="w-full">
            <ProductsFilterBar 
              search={searchQuery}
              onSearchChange={(val) => {
                setSearchQuery(val);
                navigateWithFilters({ search: val });
              }}
              categoryId={activeCategory}
              onCategoryChange={(val) => {
                setActiveCategory(val);
                navigateWithFilters({ categoryId: val });
              }}
              categories={categories}
              view={view}
              onViewChange={setView}
              total={totalCount}
              variant="catalog"
              limit={itemsPerPage}
              onLimitChange={(val) => navigateWithFilters({ limit: val, page: 1 })}
            />
          </div>
        </div>

        {/* LISTADO DE PRODUCTOS (GRID/LIST) */}
        <div className="relative">
          {filteredProducts.length > 0 ? (
            view === 'grid' ? (
              <div 
                key="grid"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                {filteredProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} variant="catalog" priority={i < 6} isAuthenticated={isAuthenticated} />
                ))}
              </div>
            ) : (
              <div 
                key="list"
                className="w-full min-w-0 animate-in fade-in slide-in-from-left-4 duration-500"
              >
                <ProductTable products={filteredProducts} variant="catalog" />
              </div>
            )
          ) : (
            <div 
              key="empty"
              className="text-center py-24 bg-white rounded-3xl border border-zinc-100 p-8 space-y-4 animate-in fade-in duration-500"
            >
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">No se encontraron productos</h3>
              <p className="text-xs text-zinc-500 font-medium">Intenta ajustando o limpiando tus filtros para encontrar lo que buscas.</p>
            </div>
          )}
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center pt-8 pb-24">
            <div className="flex items-center gap-2 bg-white border border-zinc-200 p-2 rounded-2xl shadow-sm">
              <Link href={getPageLink(Math.max(1, currentPage - 1))} aria-label="Página anterior">
                <Button variant="ghost" size="icon" aria-label="Anterior" className="rounded-xl h-10 w-10 text-zinc-400 hover:text-zinc-900" disabled={currentPage === 1}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  return (
                    <Link key={p} href={getPageLink(p)}>
                      <Button 
                        variant={currentPage === p ? "default" : "ghost"} 
                        className={cn(
                          "h-10 w-10 rounded-xl text-sm font-bold",
                          currentPage === p ? "bg-primary text-zinc-950 shadow-lg shadow-primary/20" : "text-zinc-500"
                        )}
                      >
                        {p}
                      </Button>
                    </Link>
                  );
                }
                if (p === currentPage - 2 || p === currentPage + 2) {
                  return <span key={p} className="text-zinc-300">...</span>;
                }
                return null;
              })}

              <Link href={getPageLink(Math.min(totalPages, currentPage + 1))} aria-label="Página siguiente">
                <Button variant="ghost" size="icon" aria-label="Siguiente" className="rounded-xl h-10 w-10 text-zinc-400 hover:text-zinc-900" disabled={currentPage === totalPages}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Drawer de Filtros Móviles */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsMobileFiltersOpen(false)} 
          />
          <div className="relative w-full max-w-[320px] bg-white h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header del Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-150 mb-6">
              <span className="text-xs font-black tracking-widest text-zinc-950 uppercase flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Filtros
              </span>
              <button 
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Contenido Scrollable */}
            <div className="flex-grow overflow-y-auto space-y-6 pr-1 custom-scrollbar">
              {/* Categorías Principales */}
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-950 tracking-wide mb-3 border-b border-zinc-100 pb-1.5">Categorías</h3>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                  {parentCategories
                    .sort((a, b) => a.name.localeCompare(b.name, "es"))
                    .map((parent) => {
                      const isChecked = activeCategory === parent.id;
                      const parentCount = getCategoryProductCount(parent);
                      const isExpanded = parent.id === activeParentId;
                      const children = getChildren(parent.id);
                      const hasChildren = children.length > 0;

                      return (
                        <div key={parent.id} className="space-y-1">
                          <label className={cn(
                            "flex items-center justify-between text-xs font-semibold transition-all py-1 cursor-pointer select-none",
                            isChecked ? "text-zinc-950 font-black" : "text-zinc-655"
                          )}>
                            <div className="flex items-center gap-2.5">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  const nextCategory = isChecked ? '' : parent.id;
                                  setActiveCategory(nextCategory);
                                  setSelectedSubcategories([]);
                                  setSubcatSearch('');
                                  navigateWithFilters({ categoryId: nextCategory, subcategories: [] });
                                }}
                                className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-4 w-4 cursor-pointer"
                              />
                              <span className="uppercase tracking-tight text-[12px] font-bold">{parent.name}</span>
                            </div>
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded font-black",
                              isChecked ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-505"
                            )}>
                              {parentCount}
                            </span>
                          </label>

                          {hasChildren && isExpanded && (() => {
                            const filteredChildren = children.filter(child => {
                              const displayName = child.name.includes(" > ")
                                ? child.name.split(" > ")[1]
                                : child.name;
                              return displayName.toLowerCase().includes(subcatSearch.toLowerCase());
                            });

                            return (
                              <div className="pl-[8px] pr-1 py-1 space-y-2 animate-in fade-in duration-200">
                                {children.length > 6 && (
                                  <input 
                                    type="text" 
                                    placeholder="Filtrar subcategorías..." 
                                    value={subcatSearch}
                                    onChange={(e) => setSubcatSearch(e.target.value)}
                                    className="w-full text-[10px] px-2 py-1 rounded-md border border-zinc-200 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-550 text-zinc-800"
                                  />
                                )}
                                <div className="space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                  {filteredChildren.map((child) => {
                                    const isChildChecked = selectedSubcategories.includes(child.id);
                                    const childCount = child._count?.products || 0;
                                    const displayName = child.name.includes(" > ")
                                      ? child.name.split(" > ")[1]
                                      : child.name;

                                    return (
                                      <label key={child.id} className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 hover:text-zinc-950 cursor-pointer select-none py-0.5">
                                        <div className="flex items-center gap-2.5 w-full pr-1.5 min-w-0">
                                          <input 
                                            type="checkbox" 
                                            checked={isChildChecked}
                                            onChange={() => {
                                              const nextSubcats = isChildChecked 
                                                ? selectedSubcategories.filter(id => id !== child.id)
                                                : [...selectedSubcategories, child.id];
                                              setSelectedSubcategories(nextSubcats);
                                              navigateWithFilters({ subcategories: nextSubcats });
                                            }}
                                            className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-3.5 w-3.5 cursor-pointer shrink-0"
                                          />
                                          <span className={cn(
                                            "uppercase tracking-tight truncate text-[11.5px]",
                                            isChildChecked ? "text-zinc-950 font-black" : "text-zinc-650 font-bold"
                                          )}>{displayName}</span>
                                        </div>
                                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black bg-zinc-100 text-zinc-400">
                                          {childCount}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Marcas */}
              {brands && brands.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase text-zinc-950 tracking-wide mb-3 border-b border-zinc-100 pb-1.5">Marcas</h3>
                  
                  {brands.length > 6 && (
                    <input 
                      type="text" 
                      placeholder="Buscar marca..." 
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full text-[10px] px-2 py-1 mb-2 rounded-md border border-zinc-200 bg-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-550 text-zinc-800"
                    />
                  )}

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredBrands.map((b) => {
                      const isChecked = selectedBrands.includes(b.id);
                      return (
                        <label key={b.id} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-650 hover:text-zinc-950 cursor-pointer select-none py-1">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {
                              const nextBrands = isChecked 
                                ? selectedBrands.filter(id => id !== b.id) 
                                : [...selectedBrands, b.id];
                              setSelectedBrands(nextBrands);
                              navigateWithFilters({ brands: nextBrands });
                            }}
                            className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-4 w-4 cursor-pointer"
                          />
                          <span className={cn(
                            "uppercase tracking-tight text-[12px] font-bold",
                            isChecked ? "text-zinc-950 font-black" : "text-zinc-655"
                          )}>{b.name.toUpperCase()}</span>
                        </label>
                      );
                    })}
                    {filteredBrands.length === 0 && (
                      <div className="text-[10px] text-zinc-400 font-bold py-1 uppercase pl-4">Sin coincidencias</div>
                    )}
                  </div>
                </div>
              )}

              {/* Ficha Técnica: Especificaciones Dinámicas */}
              {Object.keys(availableSpecs).length > 0 && (
                <div className="space-y-5">
                  {Object.entries(availableSpecs).map(([specName, values]) => (
                    <div key={specName} className="space-y-2">
                      <h3 className="text-xs font-black uppercase text-zinc-950 tracking-wide border-b border-zinc-100 pb-1.5">{specName}</h3>
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                        {values.map((val) => {
                          const isChecked = selectedSpecs[specName]?.includes(val) || false;
                          return (
                            <label key={val} className="flex items-center gap-2.5 text-xs font-semibold text-zinc-650 hover:text-zinc-950 cursor-pointer select-none py-1">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedSpecs(prev => {
                                    const currentValues = prev[specName] || [];
                                    const nextValues = isChecked 
                                      ? currentValues.filter(v => v !== val) 
                                      : [...currentValues, val];
                                    
                                    const next = { ...prev };
                                    if (nextValues.length > 0) {
                                      next[specName] = nextValues;
                                    } else {
                                      delete next[specName];
                                    }
                                    return next;
                                  });
                                }}
                                className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 h-4 w-4 cursor-pointer"
                              />
                              <span className={cn(
                                "uppercase tracking-tight text-[12px] font-bold",
                                isChecked ? "text-zinc-950 font-black" : "text-zinc-655"
                              )}>{val}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer Sticky */}
            <div className="pt-4 border-t border-zinc-150 mt-4 flex gap-3">
              <button
                onClick={() => {
                  setSelectedBrands([]);
                  setSelectedSubcategories([]);
                  setSubcatSearch('');
                  setSelectedSpecs({});
                  setActiveCategory('');
                  setSearchQuery('');
                  setIsMobileFiltersOpen(false);
                  router.push('/products');
                }}
                className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-center border border-red-150 flex items-center justify-center"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-3 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
