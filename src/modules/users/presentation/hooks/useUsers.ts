import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";
import { toast } from "sonner";

export function useUsers(filters: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) {
  const { get, post, delete: del, fetcher } = useApi();
  const queryClient = useQueryClient();

  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.set("page", filters.page.toString());
  if (filters.limit) queryParams.set("limit", filters.limit.toString());
  if (filters.search) queryParams.set("search", filters.search);

  const query = useQuery<any>({
    queryKey: ["users", filters],
    queryFn: async () => {
      return get(`/api/users?${queryParams.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return post("/api/users", data);
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
      return del(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar usuario");
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
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado correctamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar usuario");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetcher(`/api/users/${id}/reset-password`, {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || "Instrucciones de restablecimiento enviadas");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al restablecer contraseña");
    },
  });

  const usersList = query.data && typeof query.data === "object" && "data" in query.data
    ? (query.data as any).data
    : (query.data as any) ?? [];

  const meta = query.data && typeof query.data === "object" && "meta" in query.data
    ? (query.data as any).meta
    : undefined;

  return {
    ...query,
    users: usersList,
    data: usersList,
    meta,
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteUser: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateUser: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    resetPassword: resetPasswordMutation.mutateAsync,
    isResetting: resetPasswordMutation.isPending,
  };
}

export function useUser(id: string) {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();

  const query = useQuery<any>({
    queryKey: ["user", id],
    queryFn: () => fetcher(`/api/users/${id}`),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      fetcher(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Datos de usuario actualizados");
    },
    onError: (error: any) => toast.error(error.message || "Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetcher(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      toast.success(data.message || "Usuario eliminado correctamente");
    },
    onError: (error: any) => toast.error(error.message || "Error al eliminar"),
  });

  return {
    ...query,
    updateUser: updateMutation,
    deleteUser: deleteMutation,
  };
}
