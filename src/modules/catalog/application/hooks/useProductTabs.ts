/**
 * src/modules/catalog/application/hooks/useProductTabs.ts
 */

import { useState } from 'react';
import { ProductTab } from '@/modules/catalog/domain/product.constants';

export function useProductTabs() {
  const [activeTab, setActiveTab] = useState<ProductTab>(ProductTab.PRICING);

  return {
    activeTab,
    setActiveTab,
  };
}
