import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";
import { toast } from "sonner";

export function useUsers() {
  const api = useApi();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/api/users");
      // Maneja caso de res.data (paginado/meta) o res directo
      return (res as any).data || res;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post("/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear usuario");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar usuario");
    },
  });

  return {
    users: (query.data as any[]) ?? [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteUser: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
