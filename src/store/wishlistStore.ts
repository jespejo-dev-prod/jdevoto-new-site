import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number;
  discountAmount: number;
  discountPercent: number;
  priceSource: string;
  image: string;
  minOrderQty: number;
  inner: number;
  stockQuantity: number;
  brandName?: string;
}

interface WishlistState {
  items: WishlistItem[];
  toggleWishlist: (product: any) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  syncPrices: (accessToken?: string | null) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggleWishlist: (product) => {
        const { items } = get();
        const exists = items.some(item => item.id === product.id);
        
        if (exists) {
          set({ items: items.filter(item => item.id !== product.id) });
          return;
        }

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

        const newItem: WishlistItem = {
          id: product.id,
          sku: product.sku,
          slug: product.slug,
          name: product.name,
          price: finalPrice,
          originalPrice: originalPrice,
          discountAmount: originalPrice - finalPrice,
          discountPercent: discountPct,
          priceSource: priceSource,
          image: product.images?.[0]?.url || product.image || '',
          minOrderQty: product.minOrderQty || 1,
          inner: product.inner || 1,
          stockQuantity: product.stockQuantity || 0,
          brandName: product.brand?.name || product.brandName || '',
        };

        set({ items: [...items, newItem] });
      },

      removeFromWishlist: (productId) => {
        set({ items: get().items.filter(item => item.id !== productId) });
      },

      isInWishlist: (productId) => {
        return get().items.some(item => item.id === productId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      syncPrices: async (accessToken?: string | null) => {
        const { items } = get();
        if (items.length === 0) return;

        const slugs = items.map(item => item.slug).filter(Boolean);
        if (slugs.length === 0) return;

        const headers: HeadersInit = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        try {
          const res = await fetch(`/api/products/by-slugs?slugs=${slugs.join(',')}`, { headers });
          if (!res.ok) throw new Error('Failed to fetch updated prices for wishlist');
          const resData = await res.json();
          const freshProducts = resData.data || [];

          let changed = false;
          const updated = items.map(item => {
            const fresh = freshProducts.find((p: any) => p.slug === item.slug);
            if (!fresh) return item;

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
                originalPrice,
                discountAmount: originalPrice - finalPrice,
                discountPercent: discountPct,
                priceSource,
                stockQuantity,
                minOrderQty,
                inner,
                brandName,
              };
            }
            return item;
          });

          if (changed) set({ items: updated });
        } catch (err) {
          console.error('Error syncing wishlist prices:', err);
        }
      }
    }),
    {
      name: 'jdevoto_zustand_wishlist',
    }
  )
);
