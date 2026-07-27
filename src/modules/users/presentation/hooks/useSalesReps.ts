import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";
import { toast } from "sonner";

export function useSalesReps(filters: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) {
  const { fetcher, post, delete: del } = useApi();
  const queryClient = useQueryClient();

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 100;
  const search = filters.search ?? "";

  const queryParams = new URLSearchParams();
  if (page) queryParams.set("page", page.toString());
  if (limit) queryParams.set("limit", limit.toString());
  if (search) queryParams.set("search", search);

  const query = useQuery<any>({
    queryKey: ["sales-reps", { page, limit, search }],
    queryFn: () => fetcher(`/api/sales-reps?${queryParams.toString()}`),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { salesRepId: string; companyId: string; action: "assign" | "remove" }) =>
      fetcher("/api/sales-reps/assign", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales-reps"] });
      queryClient.invalidateQueries({ queryKey: ["sales-rep-portfolio", variables.salesRepId] });
      if (variables.action === "assign") {
        toast.success("Cliente asignado correctamente");
      } else {
        toast.success("Cliente removido correctamente");
      }
    },
    onError: (error: any) => toast.error(error.message || "Error al procesar la solicitud"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Force SALES_REP role just in case
      return post("/api/users", { ...data, role: "SALES_REP" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-reps"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear vendedor");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetcher(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-reps"] });
      toast.success("Vendedor actualizado correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar vendedor");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // En lugar de borrar la cuenta, degradamos al usuario a comprador normal
      return fetcher(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: "BUYER" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-reps"] });
      toast.success("Vendedor removido (su cuenta ahora es de Comprador)");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al remover vendedor");
    },
  });

  return {
    salesReps: query.data?.data || [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    assignCompany: (salesRepId: string, companyId: string) => 
      assignMutation.mutateAsync({ salesRepId, companyId, action: "assign" }),
    removeCompany: (salesRepId: string, companyId: string) => 
      assignMutation.mutateAsync({ salesRepId, companyId, action: "remove" }),
    isAssigning: assignMutation.isPending,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateUser: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteUser: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
