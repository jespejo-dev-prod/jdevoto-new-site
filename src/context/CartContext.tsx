'use client';

/**
 * context/CartContext.tsx
 *
 * Estado global del carrito de compras.
 * Persiste los items en localStorage para sobrevivir recargas de página.
 *
 * Flujo de datos:
 *   addItem() → actualiza items[] en memoria → useEffect persiste en localStorage
 *
 * Los precios que llegan (unitGrossPrice) ya incluyen IVA 19%,
 * calculados previamente por el PriceService en el servidor.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

/** Estructura de un ítem dentro del carrito */
export interface CartItem {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: number;          // Precio final neto por unidad (con descuento y sin IVA)
  originalPrice: number;  // Precio neto sin descuento (para mostrar tachado)
  discountAmount: number; // Ahorro por unidad = originalPrice - price
  discountPercent: number;
  priceSource: string;    // 'PROMOTION', 'COMPANY_LIST', 'BASE_PRICE', etc.
  quantity: number;
  image: string;
  minOrderQty: number;    // Cantidad mínima de pedido del producto
  inner: number;          // Unidades por empaque (Inner)
  stockQuantity: number;  // Stock disponible (para validar máximo)
}

/** Contrato del contexto — lo que expone a los componentes hijos */
interface CartContextType {
  items: CartItem[];
  addItem: (product: any, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;    // Total de unidades (suma de quantities)
  subtotal: number;     // Suma de price × quantity (ya es precio neto)
  totalSavings: number; // Suma de descuentos aplicados
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * CartProvider
 *
 * Envuelve la app y provee el estado del carrito.
 * Debe estar dentro de AuthProvider (en layout.tsx).
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { accessToken } = useAuth();

  /**
   * Carga el carrito desde localStorage y sincroniza los precios y stock con la base de datos.
   */
  useEffect(() => {
    const savedCart = localStorage.getItem('antigravity_cart');
    let loadedItems: CartItem[] = [];
    if (savedCart) {
      try {
        loadedItems = JSON.parse(savedCart);
        setItems(loadedItems);
      } catch (e) {
        console.error('Failed to parse cart', e);
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
            if (!res.ok) throw new Error('Failed to fetch updated prices');
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

                  if (
                    item.price !== finalPrice ||
                    item.originalPrice !== originalPrice ||
                    item.discountPercent !== discountPct ||
                    item.stockQuantity !== stockQuantity ||
                    item.minOrderQty !== minOrderQty ||
                    item.inner !== inner ||
                    item.priceSource !== priceSource
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
                    };
                  }
                }
                return item;
              });
              return changed ? updated : prevItems;
            });
          })
          .catch(err => {
            console.error('Error syncing cart prices:', err);
          });
      }
    }
  }, [accessToken]);

  /**
   * Sincroniza el carrito en localStorage cada vez que cambia el array de items.
   * Se ejecuta DESPUÉS de cada render donde items haya cambiado.
   */
  useEffect(() => {
    localStorage.setItem('antigravity_cart', JSON.stringify(items));
  }, [items]);

  /**
   * addItem
   *
   * Agrega un producto al carrito o suma la cantidad si ya existe.
   * Calcula el precio original (sin descuento) para mostrar el ahorro al usuario.
   *
   * @param product - Objeto producto enriquecido con price
   * @param quantity - Cantidad a agregar
   */
  const addItem = (product: any, quantity: number) => {
    const finalPrice = product.price?.discountedNetPrice || product.price?.unitNetPrice || product.basePrice || 0;
    const discountPct = product.price?.discountPercent || 0;
    const originalPrice = product.price?.unitNetPrice || product.basePrice || 0;

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);

      if (existingItem) {
        // Si el producto ya está en el carrito: suma la cantidad y actualiza precios
        return prevItems.map(item =>
          item.id === product.id
            ? {
              ...item,
              quantity: item.quantity + quantity,
              slug: product.slug || item.slug, // Actualiza slug si faltaba
              price: finalPrice,
              originalPrice: originalPrice,
              discountAmount: originalPrice - finalPrice,
              discountPercent: discountPct,
              priceSource: product.price?.priceSource || item.priceSource || 'BASE_PRICE'
            }
            : item
        );
      }

      // Producto nuevo: agrega al final del carrito
      const newItem: CartItem = {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
        originalPrice: originalPrice,
        discountAmount: originalPrice - finalPrice,
        discountPercent: discountPct,
        priceSource: product.price?.priceSource || 'BASE_PRICE',
        quantity: quantity,
        image: product.images?.[0]?.url || '',
        minOrderQty: product.minOrderQty || 1,
        inner: product.inner || 1,
        stockQuantity: product.stockQuantity || 0
      };

      return [...prevItems, newItem];
    });
  };

  /**
   * removeItem — Elimina un producto del carrito por su ID.
   * Llama a: setItems con filter (inmutable, crea nuevo array)
   */
  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  /**
   * updateQuantity — Cambia la cantidad de un producto en el carrito.
   * Usado por el stepper de cantidad en la página /cart.
   */
  const updateQuantity = (productId: string, quantity: number) => {
    setItems(prevItems => prevItems.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  /** clearCart — Vacía el carrito por completo. Llamado tras checkout exitoso. */
  const clearCart = () => {
    setItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('antigravity_cart');
    }
  };

  // Valores derivados: se recalculan en cada render, no se almacenan en estado
  const itemCount = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const subtotal = items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);
  const totalSavings = items.reduce((acc, item) => acc + ((item.discountAmount || 0) * (item.quantity || 0)), 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      totalSavings
    }}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * useCart
 *
 * Hook de consumo del CartContext.
 * Lanza un error descriptivo si se usa fuera de CartProvider.
 */
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
