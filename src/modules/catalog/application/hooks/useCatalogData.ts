import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: { name: string } | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export function useCategories() {
  const api = useApi();
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/api/categories");
      return response as Category[];
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}

export function useBrands(categoryId?: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["brands", categoryId],
    queryFn: async () => {
      const url = categoryId ? `/api/brands?categoryId=${categoryId}` : `/api/brands`;
      const response = await api.get(url);
      return response as Brand[];
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}
