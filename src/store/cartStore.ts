import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number;
  discountAmount: number;
  discountPercent: number;
  priceSource: string;
  quantity: number;
  image: string;
  minOrderQty: number;
  inner: number;
  stockQuantity: number;
  brandName?: string;
  categoryName?: string;
  validTo?: string | null;
}

interface CartState {
  items: CartItem[];
  selectedClientForOrder: any | null;
  addItem: (product: any, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setClientForOrder: (client: any) => void;
  syncPrices: (accessToken?: string | null) => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedClientForOrder: null,

      setClientForOrder: (client) => set({ selectedClientForOrder: client }),

      addItem: (product, quantity) => {
        const { items } = get();
        const isFlatPrice = typeof product.price === 'number';

        const finalPrice = isFlatPrice 
          ? product.price 
          : (product.price?.discountedNetPrice || product.price?.unitNetPrice || product.basePrice || 0);

        const discountPct = isFlatPrice
          ? (product.discountPercent ?? 0)
          : (product.price?.discountPercent || 0);

        const originalPrice = isFlatPrice
          ? (product.originalPrice ?? product.price)
          : (product.price?.unitNetPrice || product.basePrice || 0);

        const priceSource = isFlatPrice
          ? (product.priceSource || 'BASE_PRICE')
          : (product.price?.priceSource || 'BASE_PRICE');

        const brandName = product.brand?.name || product.brandName || '';
        const categoryName = product.category?.name || product.categoryName || '';
        const image = product.images?.[0]?.url || product.image || '';

        const existingItem = items.find(item => item.id === product.id);
        const validTo = isFlatPrice ? (product.validTo || null) : (product.price?.validTo || null);

        if (existingItem) {
          const safeInner = product.inner || existingItem.inner || 1;
          const safeMin = product.minOrderQty || existingItem.minOrderQty || 1;
          let newQuantity = existingItem.quantity + quantity;
          
          if (newQuantity % safeInner !== 0) {
            newQuantity = Math.max(safeMin, Math.round(newQuantity / safeInner) * safeInner);
          }

          set({
            items: items.map(item =>
              item.id === product.id
                ? {
                  ...item,
                  quantity: newQuantity,
                  slug: product.slug || item.slug,
                  price: finalPrice,
                  originalPrice: originalPrice,
                  discountAmount: originalPrice - finalPrice,
                  discountPercent: discountPct,
                  priceSource: priceSource || item.priceSource || 'BASE_PRICE',
                  brandName: brandName || item.brandName || '',
                  categoryName: categoryName || item.categoryName || '',
                  validTo: validTo || item.validTo || null,
                }
                : item
            )
          });
          return;
        }

        const safeInner = product.inner || 1;
        const safeMin = product.minOrderQty || 1;
        let safeQuantity = quantity;
        
        if (safeQuantity % safeInner !== 0) {
          safeQuantity = Math.max(safeMin, Math.round(safeQuantity / safeInner) * safeInner);
        }

        const newItem: CartItem = {
          id: product.id,
          sku: product.sku,
          slug: product.slug,
          name: product.name,
          price: finalPrice,
          originalPrice: originalPrice,
          discountAmount: originalPrice - finalPrice,
          discountPercent: discountPct,
          priceSource: priceSource,
          quantity: safeQuantity,
          image: image,
          minOrderQty: safeMin,
          inner: safeInner,
          stockQuantity: product.stockQuantity || 0,
          brandName: brandName,
          categoryName: categoryName,
          validTo: validTo || null,
        };

        set({ items: [...items, newItem] });
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map(item => {
            if (item.id === productId) {
              const safeInner = item.inner || 1;
              const safeMin = item.minOrderQty || 1;
              let safeQuantity = quantity;
              
              if (safeQuantity % safeInner !== 0) {
                safeQuantity = Math.max(safeMin, Math.round(safeQuantity / safeInner) * safeInner);
              }
              return { ...item, quantity: safeQuantity };
            }
            return item;
          })
        });
      },

      clearCart: () => set({ items: [] }),

      syncPrices: async (accessToken?: string | null) => {
        const { items } = get();
        if (items.length === 0) return;

        const slugs = items.map(item => item.slug).filter(Boolean);
        const ids = items.map(item => item.id).filter(Boolean);
        if (slugs.length === 0 && ids.length === 0) return;

        const headers: HeadersInit = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        try {
          const queryParams = new URLSearchParams();
          if (slugs.length > 0) queryParams.append('slugs', slugs.join(','));
          if (ids.length > 0) queryParams.append('ids', ids.join(','));

          const res = await fetch(`/api/products/by-slugs?${queryParams.toString()}`, { headers });
          if (!res.ok) throw new Error('Failed to fetch updated prices');
          const resData = await res.json();
          const freshProducts: any[] = resData.data || [];

          let changed = false;
          const updated = items.map(item => {
            const fresh = freshProducts.find(p => p.id === item.id || p.slug === item.slug);
            if (!fresh) {
              if (item.stockQuantity !== 0) changed = true;
              return { ...item, stockQuantity: 0 };
            }

            let finalPrice = fresh.price?.discountedNetPrice || fresh.price?.unitNetPrice || fresh.basePrice || 0;
            let discountPct = fresh.price?.discountPercent || 0;
            const originalPrice = fresh.price?.unitNetPrice || fresh.basePrice || 0;
            const stockQuantity = Number(fresh.stockQuantity) || 0;
            const minOrderQty = fresh.minOrderQty || 1;
            const inner = fresh.inner || 1;
            let priceSource = fresh.price?.priceSource || 'BASE_PRICE';
            const brandName = fresh.brand?.name || '';
            const categoryName = fresh.category?.name || '';
            const validTo = fresh.price?.validTo || null;

            if (priceSource === 'PROMOTION' && validTo && new Date(validTo).getTime() <= Date.now()) {
              finalPrice = fresh.price?.unitNetPrice || fresh.basePrice || 0;
              priceSource = 'BASE_PRICE';
              discountPct = 0;
            }

            const needsUpdate =
              item.price !== finalPrice ||
              item.originalPrice !== originalPrice ||
              item.discountPercent !== discountPct ||
              item.stockQuantity !== stockQuantity ||
              item.minOrderQty !== minOrderQty ||
              item.inner !== inner ||
              item.priceSource !== priceSource ||
              item.brandName !== brandName ||
              item.categoryName !== categoryName ||
              item.validTo !== validTo;

            if (!needsUpdate) return item;

            const safeInner = inner || 1;
            const safeMin = minOrderQty || 1;
            let safeQuantity = item.quantity;
            
            if (safeQuantity % safeInner !== 0) {
              safeQuantity = Math.max(safeMin, Math.round(safeQuantity / safeInner) * safeInner);
            }

            changed = true;
            return {
              ...item,
              price: finalPrice,
              originalPrice,
              discountAmount: originalPrice - finalPrice,
              discountPercent: discountPct,
              priceSource,
              quantity: safeQuantity,
              stockQuantity,
              minOrderQty,
              inner: safeInner,
              brandName,
              categoryName,
              validTo,
            };
          });

          if (changed) set({ items: updated });
        } catch (err) {
          console.error('Error syncing cart prices:', err);
        }
      }
    }),
    {
      name: 'jdevoto_zustand_cart', // Nuevo nombre para no chocar con el parser antiguo
    }
  )
);
