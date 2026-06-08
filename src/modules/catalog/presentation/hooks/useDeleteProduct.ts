'use client';

/**
 * modules/catalog/presentation/hooks/useDeleteProduct.ts
 *
 * Mutación React Query para eliminar (desactivar) un producto.
 * Es un SOFT DELETE: el servidor pone isActive=false en lugar de borrar el registro.
 * Esto preserva el historial de pedidos que referenciaban ese producto.
 *
 * Llama a: DELETE /api/products/:id (via useApi con token JWT)
 * En éxito:
 *   - Muestra toast de confirmación
 *   - Invalida caché para refrescar la lista del dashboard
 * En error:
 *   - Muestra toast con el mensaje de error del servidor
 *
 * Usado por: la tabla de productos en /dashboard/products
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { toast } from 'sonner';

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const api = useApi(); // Hook DRY: inyecta token automáticamente

  return useMutation({
    /** mutationFn — Envía DELETE al servidor con el ID del producto */
    mutationFn: async (id: string) => {
      return await api.delete(`/api/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Producto eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['dashboard-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el producto');
    },
  });
}
