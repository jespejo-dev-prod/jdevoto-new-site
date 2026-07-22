'use client';

import { useState } from 'react';
import { CategoriesMenu, type Category } from './categories-menu';

interface CategoriesMenuClientProps {
  onCloseAction: string; // serializable — the parent passes the state setter name as a stub
  topOffset?: string;
  categories: Category[];
}

/**
 * CategoriesMenuClient
 *
 * Thin client wrapper that bridges the Server Component (which fetches
 * categories from the DB) to the interactive CategoriesMenu client component.
 *
 * Because Server Components cannot pass function props directly, the public-header
 * (a Client Component) renders this and passes an onClose callback.
 * We expose this so that the public-header can import and use it.
 */
export function CategoriesMenuClient({
  categories,
  topOffset,
  onClose,
}: {
  categories: Category[];
  topOffset?: string;
  onClose: () => void;
}) {
  return (
    <CategoriesMenu
      categories={categories}
      topOffset={topOffset}
      onClose={onClose}
    />
  );
}
