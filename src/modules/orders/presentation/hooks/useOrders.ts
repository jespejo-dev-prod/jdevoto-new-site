import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";
import { OrderStatus } from "@prisma/client";
import { toast } from "sonner";
import { OrderSummary, PaginatedResult } from "@/types/domain";

export function useOrders(filters: { 
  page?: number; 
  limit?: number; 
  status?: OrderStatus | ''; 
  companyId?: string;
  from?: Date;
  to?: Date;
  search?: string;
}) {
  const { fetcher } = useApi();

  const queryParams = new URLSearchParams();
  if (filters.page) queryParams.set("page", filters.page.toString());
  if (filters.limit) queryParams.set("limit", filters.limit.toString());
  if (filters.status) queryParams.set("status", filters.status);
  if (filters.companyId) queryParams.set("companyId", filters.companyId);
  if (filters.from) queryParams.set("from", filters.from.toISOString());
  if (filters.to) queryParams.set("to", filters.to.toISOString());
  if (filters.search) queryParams.set("search", filters.search);

  return useQuery<PaginatedResult<OrderSummary>>({
    queryKey: ["orders", filters],
    queryFn: () => fetcher(`/api/orders?${queryParams.toString()}`),
  });
}

export function useOrder(id: string) {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();

  const query = useQuery<any>({
    queryKey: ["order", id],
    queryFn: () => fetcher(`/api/orders/${id}`),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: OrderStatus; internalNotes?: string }) =>
      fetcher(`/api/orders/${id}/status`, { 
        method: "PATCH", 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Estado del pedido actualizado");
    },
    onError: (error: any) => toast.error(error.message || "Error al actualizar estado"),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: () => fetcher(`/api/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido eliminado correctamente");
    },
    onError: (error: any) => toast.error(error.message || "Error al eliminar pedido"),
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data: any) =>
      fetcher(`/api/orders/${id}`, { 
        method: "PATCH", 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: any) => toast.error(error.message || "Error al actualizar pedido"),
  });

  return { 
    ...query, 
    updateStatus: updateStatusMutation,
    deleteOrder: deleteOrderMutation,
    updateOrder: updateOrderMutation
  };
}
