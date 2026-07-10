'use client';

import { useState } from 'react';
import { ProductCard } from '@/modules/catalog/presentation/components/ProductList/ProductCard';
import { Sparkles, PenTool, Briefcase, Wrench, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CategoryTabsGridProps {
  todos: any[];
  papeleria: any[];
  oficina: any[];
  ferreteria: any[];
  regalos: any[];
}

export function CategoryTabsGrid({
  todos = [],
  papeleria = [],
  oficina = [],
  ferreteria = [],
  regalos = [],
}: CategoryTabsGridProps) {
  const tabs = [
    { id: 'todos', label: 'Todos', icon: Sparkles, products: todos, link: '/products' },
    { id: 'papeleria', label: 'Papelería y Manualidades', icon: PenTool, products: papeleria, link: '/products?category=papeleria-y-manualidades' },
    { id: 'oficina', label: 'Oficina y Escritorio', icon: Briefcase, products: oficina, link: '/products?category=oficina-y-escritorio' },
    { id: 'ferreteria', label: 'Ferretería y Fijaciones', icon: Wrench, products: ferreteria, link: '/products?category=ferreteria-y-fijaciones' },
    { id: 'regalos', label: 'Regalos y Novedades', icon: Gift, products: regalos, link: '/products?category=regalos-y-novedades' },
  ];

  const [activeTabId, setActiveTabId] = useState('todos');
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const activeProducts = activeTab.products.slice(0, 8); // limit to 8 for preview

  return (
    <section className="my-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-zinc-200/60">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight uppercase">Catálogo Recomendado</h2>
          <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">
            Selecciona una categoría para explorar productos con stock inmediato
          </p>
        </div>
        
        {/* View all button */}
        <Link 
          href={activeTab.link}
          className="group mt-4 md:mt-0 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
        >
          Ver toda la categoría
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide gap-2 md:gap-3 mb-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/10'
                  : 'bg-white border-zinc-200/80 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-zinc-500'}`} />
              {tab.label}
              {tab.products.length > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {tab.products.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid container */}
      {activeProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-all duration-300">
          {activeProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="catalog" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/60 p-12 text-center">
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
            No hay productos disponibles en esta categoría por el momento.
          </p>
        </div>
      )}
    </section>
  );
}
