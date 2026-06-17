'use client';

/**
 * context/WishlistContext.tsx
 *
 * Estado global de la lista de deseos (Wishlist).
 * Persiste los items en localStorage para sobrevivir recargas de página.
 *
 * Los precios se sincronizan con la base de datos en background al montar
 * para garantizar que el comprador B2B tenga precios y stock actualizados.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

export interface WishlistItem {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: number;          // Precio final neto por unidad (con descuento y sin IVA)
  originalPrice: number;  // Precio neto sin descuento (para mostrar tachado)
  discountAmount: number; // Ahorro por unidad = originalPrice - price
  discountPercent: number;
  priceSource: string;    // 'PROMOTION', 'COMPANY_LIST', 'BASE_PRICE', etc.
  image: string;
  minOrderQty: number;    // Cantidad mínima de pedido del producto
  inner: number;          // Unidades por empaque (Inner)
  stockQuantity: number;  // Stock disponible
  brandName?: string;     // Marca del producto
}

interface WishlistContextType {
  items: WishlistItem[];
  toggleWishlist: (product: any) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const { accessToken } = useAuth();

  // 1. Cargar desde localStorage al montar y sincronizar precios/stock
  useEffect(() => {
    const savedWishlist = localStorage.getItem('antigravity_wishlist');
    let loadedItems: WishlistItem[] = [];
    if (savedWishlist) {
      try {
        loadedItems = JSON.parse(savedWishlist);
        setItems(loadedItems);
      } catch (e) {
        console.error('Failed to parse wishlist', e);
      }
    }

    if (loadedItems.length > 0) {
      const slugs = loadedItems.map(item => item.slug).filter(Boolean);
      if (slugs.length > 0) {
        const headers: HeadersInit = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        fetch(`/api/products/by-slugs?slugs=${slugs.join(',')}`, { headers })
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch updated prices for wishlist');
            return res.json();
          })
          .then(resData => {
            const freshProducts = resData.data || [];
            setItems(prevItems => {
              let changed = false;
              const updated = prevItems.map(item => {
                const fresh = freshProducts.find((p: any) => p.slug === item.slug);
                if (fresh) {
                  const finalPrice = fresh.price?.discountedNetPrice || fresh.price?.unitNetPrice || fresh.basePrice || 0;
                  const discountPct = fresh.price?.discountPercent || 0;
                  const originalPrice = fresh.price?.unitNetPrice || fresh.basePrice || 0;
                  const stockQuantity = Number(fresh.stockQuantity) || 0;
                  const minOrderQty = fresh.minOrderQty || 1;
                  const inner = fresh.inner || 1;
                  const priceSource = fresh.price?.priceSource || 'BASE_PRICE';
                  const brandName = fresh.brand?.name || '';

                  if (
                    item.price !== finalPrice ||
                    item.originalPrice !== originalPrice ||
                    item.discountPercent !== discountPct ||
                    item.stockQuantity !== stockQuantity ||
                    item.minOrderQty !== minOrderQty ||
                    item.inner !== inner ||
                    item.priceSource !== priceSource ||
                    item.brandName !== brandName
                  ) {
                    changed = true;
                    return {
                      ...item,
                      price: finalPrice,
                      originalPrice: originalPrice,
                      discountAmount: originalPrice - finalPrice,
                      discountPercent: discountPct,
                      priceSource: priceSource,
                      stockQuantity: stockQuantity,
                      minOrderQty: minOrderQty,
                      inner: inner,
                      brandName: brandName,
                    };
                  }
                }
                return item;
              });
              return changed ? updated : prevItems;
            });
          })
          .catch(err => {
            console.error('Error syncing wishlist prices:', err);
          });
      }
    }
  }, [accessToken]);

  // 2. Persistir en localStorage cuando cambia el estado
  useEffect(() => {
    localStorage.setItem('antigravity_wishlist', JSON.stringify(items));
  }, [items]);

  // 3. toggleWishlist - Agrega o remueve un producto de la wishlist
  const toggleWishlist = (product: any) => {
    setItems(prevItems => {
      const exists = prevItems.some(item => item.id === product.id);
      if (exists) {
        // Remover
        return prevItems.filter(item => item.id !== product.id);
      }

      // Agregar
      const finalPrice = product.price?.discountedNetPrice || product.price?.unitNetPrice || product.basePrice || 0;
      const discountPct = product.price?.discountPercent || 0;
      const originalPrice = product.price?.unitNetPrice || product.basePrice || 0;

      const newItem: WishlistItem = {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
        originalPrice: originalPrice,
        discountAmount: originalPrice - finalPrice,
        discountPercent: discountPct,
        priceSource: product.price?.priceSource || 'BASE_PRICE',
        image: product.images?.[0]?.url || product.image || '',
        minOrderQty: product.minOrderQty || 1,
        inner: product.inner || 1,
        stockQuantity: product.stockQuantity || 0,
        brandName: product.brand?.name || product.brandName || '',
      };

      return [...prevItems, newItem];
    });
  };

  // 4. removeFromWishlist - Elimina un producto por ID
  const removeFromWishlist = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // 5. isInWishlist - Verifica si un producto ya está guardado
  const isInWishlist = (productId: string) => {
    return items.some(item => item.id === productId);
  };

  // 6. clearWishlist - Vacía la lista
  const clearWishlist = () => {
    setItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('antigravity_wishlist');
    }
  };

  const itemCount = items.length;

  return (
    <WishlistContext.Provider value={{
      items,
      toggleWishlist,
      removeFromWishlist,
      isInWishlist,
      clearWishlist,
      itemCount
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
