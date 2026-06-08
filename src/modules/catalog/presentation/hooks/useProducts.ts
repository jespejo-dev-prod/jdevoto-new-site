'use client';

/**
 * src/modules/catalog/presentation/hooks/useProducts.ts
 *
 * Hook centralizado para listar productos del dashboard.
 * Usa ?dashboard=true para saltar el motor de precios (2 queries vs 6).
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/shared/infrastructure/api/use-api';

export interface DashboardProduct {
  id: string;
  name: string;
  sku: string;
  slug: string;
  basePrice: number;
  stockQuantity: number;
  stockAlert: number;
  isActive: boolean;
  category: { id: string; name: string; slug: string } | null;
  images: { url: string; isPrimary: boolean; altText?: string | null }[];
  createdAt: string;
}

export interface UseProductsParams {
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
  status?: 'all' | 'published' | 'draft' | 'trash';
}

export interface ProductsResponse {
  products: DashboardProduct[];
  total: number;
  page: number;
  totalPages: number;
}

export function useProducts(params: UseProductsParams = {}) {
  const { accessToken } = useAuth();
  const api = useApi(); // <- Usamos useApi
  const { search, categoryId, page = 1, limit = 16, includeInactive = false, status = 'all' } = params;

  return useQuery({
    queryKey: ['dashboard-products', search, categoryId, page, limit, includeInactive, status],
    queryFn: async (): Promise<ProductsResponse> => {
      const sp = new URLSearchParams();
      sp.set('page', String(page));
      sp.set('limit', String(limit));
      sp.set('dashboard', 'true');          // ← Modo rápido: salta el motor de precios
      if (search)          sp.set('search', search);
      if (categoryId)      sp.set('categoryId', categoryId);
      if (includeInactive) sp.set('includeInactive', 'true');
      if (status)          sp.set('status', status);

      // api.get ya parsea y devuelve { data, meta } si existe
      const response = await api.get(`/api/products?${sp.toString()}`);
      
      // Dependiendo de cómo devuelve useApi, si lo desempaqueta, response puede tener { data, meta }
      // o ser directamente el array.
      const data = (response as any).data || response;
      const meta = (response as any).meta || {};

      return {
        products: data ?? [],
        total:      meta.total      ?? data?.length ?? 0,
        page:       meta.page       ?? page,
        totalPages: meta.totalPages ?? 1,
      };
    },
    // Cache 60 seg en cliente — los datos del dashboard cambian poco
    staleTime: 60 * 1000,
    // Mantiene los datos anteriores mientras carga la siguiente página
    placeholderData: (prev) => prev,
    enabled: !!accessToken,
  });
}
