import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";
import { Company } from "@prisma/client";
import { RegisterCompanyDto, UpdateCompanyDto } from "@/validations/company.schemas";
import { toast } from "sonner";

export function useCustomers(search?: string) {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();

  const query = useQuery<Company[]>({
    queryKey: ["customers", search],
    queryFn: () => fetcher(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });

  const createMutation = useMutation({
    mutationFn: (data: RegisterCompanyDto) =>
      fetcher("/api/customers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente creado correctamente");
    },
    onError: (error: any) => toast.error(error.message || "Error al crear cliente"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetcher(`/api/customers/${id}`, { method: "DELETE" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(data.message || "Cliente procesado correctamente");
    },
    onError: (error: any) => toast.error(error.message || "Error al eliminar"),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => fetcher(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente reactivado correctamente");
    },
    onError: (error: any) => toast.error(error.message || "Error al reactivar"),
  });

  return { 
    ...query, 
    createCustomer: createMutation, 
    deleteCustomer: deleteMutation,
    reactivateCustomer: reactivateMutation 
  };
}

export function useCustomer(id: string) {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();

  const query = useQuery<Company & { users: any[] }>({
    queryKey: ["customer", id],
    queryFn: () => fetcher(`/api/customers/${id}`),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCompanyDto) =>
      fetcher(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Datos actualizados");
    },
    onError: (error: any) => toast.error(error.message || "Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetcher(`/api/customers/${id}`, { method: "DELETE" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      toast.success(data.message || "Cliente procesado correctamente");
    },
    onError: (error: any) => toast.error(error.message || "Error al eliminar"),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => fetcher(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      toast.success("Cliente reactivado");
    },
    onError: (error: any) => toast.error(error.message || "Error al reactivar"),
  });

  return { 
    ...query, 
    updateCustomer: updateMutation, 
    deleteCustomer: deleteMutation,
    reactivateCustomer: reactivateMutation
  };
}
