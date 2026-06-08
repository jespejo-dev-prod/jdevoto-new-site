/**
 * src/modules/catalog/presentation/components/ProductForm/form.constants.tsx
 */

import { 
  DollarSign, Warehouse, Truck, ListChecks, Globe, LucideIcon 
} from 'lucide-react';
import { ProductTab } from '@/modules/catalog/domain/product.constants';
import { PricingTab } from './Tabs/PricingTab';
import { InventoryTab } from './Tabs/InventoryTab';
import { ShippingTab } from './Tabs/ShippingTab';
import { SpecsTab } from './Tabs/SpecsTab';
import { SeoTab } from './Tabs/SeoTab';
import { ComponentType } from 'react';

export interface TabConfig {
  id: ProductTab;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
}

export const PRODUCT_TABS_CONFIG: TabConfig[] = [
  { 
    id: ProductTab.PRICING, 
    label: 'Precios', 
    icon: DollarSign,
    component: PricingTab
  },
  { 
    id: ProductTab.INVENTORY, 
    label: 'Inventario', 
    icon: Warehouse,
    component: InventoryTab
  },
  { 
    id: ProductTab.SHIPPING, 
    label: 'Envío / Logística', 
    icon: Truck,
    component: ShippingTab
  },
  { 
    id: ProductTab.SPECS, 
    label: 'Ficha Técnica (Opcional)', 
    icon: ListChecks,
    component: SpecsTab
  },
  { 
    id: ProductTab.SEO, 
    label: 'SEO Avanzado (Opcional)', 
    icon: Globe,
    component: SeoTab
  },
];

// Lookup Map O(1) generado de forma moderna y limpia
export const PRODUCT_TAB_COMPONENTS = Object.fromEntries(
  PRODUCT_TABS_CONFIG.map(tab => [tab.id, tab.component])
) as Record<ProductTab, ComponentType>;

// Mapeo de campos por pestaña para validación visual
export const TAB_FIELDS: Record<ProductTab, string[]> = {
  [ProductTab.PRICING]: ['sku', 'basePrice', 'minOrderQty'],
  [ProductTab.INVENTORY]: ['stockQuantity', 'stockAlert', 'inner'],
  [ProductTab.SHIPPING]: ['weight', 'length', 'width', 'height'],
  [ProductTab.SPECS]: ['specifications'],
  [ProductTab.SEO]: ['seoTitle', 'seoDescription'],
};
