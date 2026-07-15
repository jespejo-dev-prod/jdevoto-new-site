'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Grid, LayoutGrid, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import staticCategories from './categories.json';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface CategoriesMenuProps {
  onClose: () => void;
  topOffset?: string;
}

export function CategoriesMenu({ onClose, topOffset = '73px' }: CategoriesMenuProps) {
  const categories = staticCategories as Category[];
  
  const parentCategories = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  // Establecer la primera categoría activa por defecto sincrónicamente para evitar parpadeos
  const [activeParentId, setActiveParentId] = useState<string | null>(
    parentCategories.length > 0 ? parentCategories[0].id : null
  );
  
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);

  const activeParent = parentCategories.find((c) => c.id === activeParentId);

  // Obtener subcategorías hijas de la categoría padre seleccionada
  const activeChildren = categories
    .filter((c) => c.parentId === activeParentId)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  // Formatear el nombre de la subcategoría para eliminar el prefijo "PADRE > "
  const getSubcategoryDisplayName = (name: string) => {
    return name.includes(' > ') ? name.split(' > ')[1] : name;
  };

  return (
    <div
      className="fixed left-0 bottom-0 z-50 bg-white border-r border-zinc-200 shadow-2xl flex flex-col lg:flex-row w-full sm:w-[320px] lg:w-auto"
      style={{ top: topOffset, height: `calc(100vh - ${topOffset})` }}
      onClick={(e) => e.stopPropagation()} // Prevenir que clics dentro del menú lo cierren
    >
      {/* ──────────────────────────────────────────────────────── */}
      {/* DESKTOP LAYOUT (visible only on lg and up) */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-full">
        {/* Panel Izquierdo: Categorías Padres (Full-Height) */}
        <div className="w-[260px] bg-white border-r border-zinc-150 overflow-y-auto py-4 scrollbar-thin h-full">
          <div className="px-5 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
              <Grid className="h-3.5 w-3.5" /> Categorías
            </span>
          </div>
          <div className="space-y-0.5">
            {parentCategories.map((parent) => {
              const isActive = parent.id === activeParentId;
              return (
                <Link
                  key={parent.id}
                  href={`/products?category=${parent.slug}`}
                  onMouseEnter={() => setActiveParentId(parent.id)}
                  onClick={() => {
                    setActiveParentId(parent.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full text-left px-5 py-3.5 text-[13px] font-black uppercase tracking-tight flex items-center justify-between cursor-pointer",
                    isActive
                      ? "bg-zinc-100 text-zinc-950 font-black"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/50"
                  )}
                >
                  <span>{parent.name}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-zinc-800 translate-x-0.5" : "text-zinc-300"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Panel Derecho: Subcategorías Hijas como listas de texto (Full-Height) */}
        <div className="w-[480px] sm:w-[580px] md:w-[680px] bg-white p-8 overflow-y-auto scrollbar-thin h-full flex flex-col">
          {activeParent && (
            <>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight">
                    {activeParent.name}
                  </h3>
                </div>
                
                <Link
                  href={`/products?category=${activeParent.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors px-3 py-1.5 rounded-md"
                >
                  <LayoutGrid className="h-3 w-3" /> Ver Todo
                </Link>
              </div>

              {activeChildren.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-12">
                  <p className="text-xs font-bold uppercase tracking-wider">No hay subcategorías en esta sección</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                  {activeChildren.map((child) => {
                    const displayName = getSubcategoryDisplayName(child.name);
                    return (
                      <Link
                        key={child.id}
                        href={`/products?category=${activeParent.slug}&subcategories=${child.slug}`}
                        onClick={onClose}
                        className="group flex items-center justify-between py-0.5 text-left"
                      >
                        <span className="text-[13px] font-semibold text-zinc-500 group-hover:text-zinc-950 group-hover:underline uppercase tracking-tight leading-snug">
                          {displayName}
                        </span>
                        <ChevronRight className="h-3 w-3 text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* MOBILE LAYOUT (visible only on screens < lg) */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="flex lg:hidden flex-col w-full h-full bg-white p-5 overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-150 mb-4">
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <Grid className="h-3.5 w-3.5" /> Categorías
          </span>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          {parentCategories.map((parent) => {
            const isExpanded = mobileExpandedId === parent.id;
            const children = categories
              .filter((c) => c.parentId === parent.id)
              .sort((a, b) => a.name.localeCompare(b.name, 'es'));
            const hasChildren = children.length > 0;

            return (
              <div key={parent.id} className="border-b border-zinc-100/70 py-1">
                <button
                  onClick={() => setMobileExpandedId(isExpanded ? null : parent.id)}
                  className="w-full py-2.5 flex items-center justify-between text-left text-zinc-800 hover:text-zinc-950 active:scale-[0.99] transition-transform"
                >
                  <span className="text-[12.5px] font-black uppercase tracking-tight">{parent.name}</span>
                  {hasChildren && (
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 text-zinc-400 transition-transform duration-200", 
                        isExpanded && "rotate-90 text-zinc-800"
                      )} 
                    />
                  )}
                </button>

                {hasChildren && isExpanded && (
                  <div className="pl-3 pr-2 py-2 space-y-2.5 bg-zinc-50/70 rounded-2xl mb-2 animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col">
                    <Link
                      href={`/products?category=${parent.slug}`}
                      onClick={onClose}
                      className="text-[10.5px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest py-1 flex items-center gap-1.5"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" /> Ver Todo en {parent.name}
                    </Link>
                    {children.map((child) => {
                      const displayName = getSubcategoryDisplayName(child.name);
                      return (
                        <Link
                          key={child.id}
                          href={`/products?category=${parent.slug}&subcategories=${child.slug}`}
                          onClick={onClose}
                          className="text-[12.5px] font-bold text-zinc-500 hover:text-zinc-900 py-1 uppercase tracking-tight"
                        >
                          {displayName}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
