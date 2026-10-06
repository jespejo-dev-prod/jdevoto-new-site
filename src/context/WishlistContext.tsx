'use client';

/**
 * context/WishlistContext.tsx (Shim para Zustand)
 *
 * Refactorizado para utilizar Zustand por debajo.
 * Esto elimina los re-renders innecesarios en toda la aplicación (Layout),
 * manteniendo la compatibilidad exacta con los componentes que ya usaban useWishlist().
 */

import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useWishlistStore } from '@/store/wishlistStore';

export type { WishlistItem } from '@/store/wishlistStore';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const syncPrices = useWishlistStore(state => state.syncPrices);

  useEffect(() => {
    // Sincroniza al montar y si cambia el token
    syncPrices(accessToken);
  }, [accessToken, syncPrices]);

  // Ya no usamos <WishlistContext.Provider>, evitando re-renderizar todo el árbol
  return <>{children}</>;
}

export function useWishlist() {
  const store = useWishlistStore();
  const [hasHydrated, setHasHydrated] = React.useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const items = hasHydrated ? store.items : [];
  const itemCount = items.length;

  return {
    items,
    toggleWishlist: store.toggleWishlist,
    removeFromWishlist: store.removeFromWishlist,
    isInWishlist: store.isInWishlist,
    clearWishlist: store.clearWishlist,
    itemCount
  };
}
