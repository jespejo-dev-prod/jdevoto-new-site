'use client';

/**
 * context/CartContext.tsx (Shim para Zustand)
 * 
 * Se ha refactorizado este Contexto para utilizar Zustand por debajo.
 * Esto elimina los re-renders innecesarios en toda la aplicación (Layout),
 * manteniendo la compatibilidad exacta con los componentes que ya usaban useCart().
 */

import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useCartStore } from '@/store/cartStore';

// Reexportamos el tipo original para mantener compatibilidad
export type { CartItem } from '@/store/cartStore';

/**
 * CartProvider
 * Ya no almacena estado, simplemente provee el Auth Token al store para la sincronización inicial.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const syncPrices = useCartStore(state => state.syncPrices);

  useEffect(() => {
    // Sincroniza al montar y si cambia el token (ej: login/logout)
    syncPrices(accessToken);
  }, [accessToken, syncPrices]);

  // Ya no usamos <CartContext.Provider value={...}>, evitando re-renderizar todo el árbol
  return <>{children}</>;
}

/**
 * useCart
 * Mapea exactamente la firma original usando el store de Zustand.
 */
export function useCart() {
  const store = useCartStore();
  const [hasHydrated, setHasHydrated] = React.useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const items = hasHydrated ? store.items : [];
  const selectedClientForOrder = hasHydrated ? store.selectedClientForOrder : null;

  // Valores derivados calculados al vuelo
  const itemCount = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const subtotal = items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);
  const totalSavings = items.reduce((acc, item) => acc + ((item.discountAmount || 0) * (item.quantity || 0)), 0);

  return {
    items,
    selectedClientForOrder,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    setClientForOrder: store.setClientForOrder,
    syncPrices: () => store.syncPrices(), // Alias sin parámetros directos si así se usaba
    itemCount,
    subtotal,
    totalSavings
  };
}
