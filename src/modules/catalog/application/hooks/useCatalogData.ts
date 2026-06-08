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

export function useBrands() {
  const api = useApi();
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await api.get("/api/brands");
      return response as Brand[];
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}
