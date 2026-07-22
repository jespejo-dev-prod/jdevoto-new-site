/**
 * src/modules/catalog/presentation/components/ProductForm/ProductTabsSidebar.tsx
 */

import { PRODUCT_TABS_CONFIG, TAB_FIELDS } from "./form.constants";
import { cn } from "@/lib/utils";
import { ProductTab } from "@/modules/catalog/domain/product.constants";
import { KeyboardEvent } from "react";
import { useFormContext } from "react-hook-form";

interface ProductTabsSidebarProps {
  activeTab: ProductTab;
  onSelect: (id: ProductTab) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  setItemRef: (id: ProductTab, el: HTMLButtonElement | null) => void;
}

export function ProductTabsSidebar({ 
  activeTab, 
  onSelect, 
  onKeyDown, 
  setItemRef 
}: ProductTabsSidebarProps) {
  const { formState: { errors } } = useFormContext();
  const tabs = PRODUCT_TABS_CONFIG;
  
  // Función para determinar si una pestaña tiene errores
  const hasTabErrors = (tabId: ProductTab) => {
    const fields = TAB_FIELDS[tabId] || [];
    return fields.some(field => errors[field]);
  };

  return (
    <nav
      className="w-full md:w-64 bg-zinc-950/30 border-r border-zinc-800 outline-none"
      role="tablist"
      aria-label="Secciones del producto"
      onKeyDown={onKeyDown}
    >
      {tabs.map(t => (
        <button
          key={t.id}
          ref={(el) => setItemRef(t.id, el)}
          type="button"
          role="tab"
          aria-selected={activeTab === t.id}
          aria-controls={`panel-${t.id}`}
          id={`tab-${t.id}`}
          tabIndex={activeTab === t.id ? 0 : -1}
          onClick={() => onSelect(t.id)}
          className={cn(
            "w-full flex items-center justify-between px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all outline-none group",
            activeTab === t.id
              ? "bg-zinc-900 text-primary border-l-4 border-primary"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
          )}
        >
          <div className="flex items-center gap-4">
            <t.icon className="h-4 w-4" />
            {t.label}
          </div>
          {hasTabErrors(t.id) && (
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      ))}
    </nav>
  );
}
