import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";
import { Company } from "@prisma/client";
import { RegisterCompanyDto, UpdateCompanyDto } from "@/validations/company.schemas";
import { toast } from "sonner";

export function useCustomers(filters: string | {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
} = {}) {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();

  // Normalizar los filtros para soportar firma heredada useCustomers(searchString) y la nueva firma con objeto
  let page = 1;
  let limit = 10;
  let search = "";
  let enabled = true;
  if (typeof filters === "string") {
    search = filters;
    // Si es búsqueda clásica, podemos usar un límite mayor para autocompletado (por ejemplo, 50)
    limit = 50;
  } else {
    page = filters.page ?? 1;
    limit = filters.limit ?? 10;
    search = filters.search ?? "";
    enabled = filters.enabled ?? true;
  }

  const queryParams = new URLSearchParams();
  if (page) queryParams.set("page", page.toString());
  if (limit) queryParams.set("limit", limit.toString());
  if (search) queryParams.set("search", search);

  const query = useQuery<any>({
    queryKey: ["customers", { page, limit, search }],
    queryFn: () => fetcher(`/api/customers?${queryParams.toString()}`),
    enabled,
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

  const unassignMutation = useMutation({
    mutationFn: (id: string) => fetcher(`/api/customers/${id}/unassign`, { method: "PATCH" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["sales-rep-operational-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success(data.message || "Cliente desvinculado de tu cartera");
    },
    onError: (error: any) => toast.error(error.message || "Error al desvincular"),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => fetcher(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente reactivado correctamente");
    },
    onError: (error: any) => toast.error(error.message || "Error al reactivar"),
  });

  const customersList = query.data && typeof query.data === "object" && "data" in query.data
    ? (query.data as any).data
    : (query.data as any) ?? [];

  const meta = query.data && typeof query.data === "object" && "meta" in query.data
    ? (query.data as any).meta
    : undefined;

  return { 
    ...query, 
    data: customersList,
    customers: customersList,
    meta,
    createCustomer: createMutation, 
    deleteCustomer: deleteMutation,
    unassignCustomer: unassignMutation,
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
