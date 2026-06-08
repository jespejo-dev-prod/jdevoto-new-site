/**
 * modules/catalog/presentation/hooks/useTaxonomy.ts
 *
 * Hooks de React Query para gestionar taxonomía (Categorías y Marcas).
 *
 * Cada hook combina en un solo objeto:
 *  - query: el estado de la lista (data, isLoading, error)
 *  - createMutation: mutación POST para crear
 *  - updateMutation: mutación PATCH para editar
 *  - deleteMutation: mutación DELETE para eliminar
 *
 * Llaman a:
 *  useCategories → GET/POST/PATCH/DELETE /api/categories
 *  useBrands     → GET/POST/PATCH/DELETE /api/brands
 *
 * Principio DRY: un mismo hook centraliza todas las operaciones CRUD
 * para evitar repetir lógica de invalidación de caché y toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";
import { Category, Brand } from "@prisma/client";
import { CategoryInput, BrandInput } from "@/validations/taxonomy.schemas";
import { toast } from "sonner";

export function useCategories() {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();

  const query = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetcher("/api/categories"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryInput) =>
      fetcher("/api/categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría creada");
    },
    onError: (error: any) => toast.error(error.message || "Error al crear"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/categories?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría eliminada");
    },
    onError: (error: any) => toast.error(error.message || "Error al eliminar"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryInput> }) =>
      fetcher(`/api/categories?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría actualizada");
    },
    onError: (error: any) => toast.error(error.message || "Error al actualizar"),
  });

  return { 
    ...query, 
    createCategory: createMutation, 
    deleteCategory: deleteMutation,
    updateCategory: updateMutation 
  };
}

export function useBrands() {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();

  const query = useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: () => fetcher("/api/brands"),
  });

  const createMutation = useMutation({
    mutationFn: (data: BrandInput) =>
      fetcher("/api/brands", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Marca creada");
    },
    onError: (error: any) => toast.error(error.message || "Error al crear"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/brands?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Marca eliminada");
    },
    onError: (error: any) => toast.error(error.message || "Error al eliminar"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BrandInput> }) =>
      fetcher(`/api/brands?id=${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Marca actualizada");
    },
    onError: (error: any) => toast.error(error.message || "Error al actualizar"),
  });

  return { 
    ...query, 
    createBrand: createMutation, 
    deleteBrand: deleteMutation,
    updateBrand: updateMutation 
  };
}
