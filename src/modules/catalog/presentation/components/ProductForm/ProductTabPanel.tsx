/**
 * src/modules/catalog/presentation/components/ProductForm/ProductTabPanel.tsx
 */

import { ComponentType } from "react";
import { ProductTab } from "@/modules/catalog/domain/product.constants";

interface ProductTabPanelProps {
  activeTab: ProductTab;
  ActiveTabComponent?: ComponentType;
}

export function ProductTabPanel({ activeTab, ActiveTabComponent }: ProductTabPanelProps) {
  if (!ActiveTabComponent) return null;

  return (
    <div
      className="flex-1 p-10 bg-gradient-to-br from-transparent to-zinc-950/20"
      role="tabpanel"
      id={`panel-${activeTab}`}
      aria-labelledby={`tab-${activeTab}`}
    >
      <ActiveTabComponent />
    </div>
  );
}
