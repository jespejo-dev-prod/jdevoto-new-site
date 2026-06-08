'use client';

/**
 * modules/catalog/presentation/hooks/useUpdateProduct.ts
 *
 * Mutación React Query para actualizar un producto existente.
 *
 * Llama a: PATCH /api/products/:id (via useApi.fetcher con token JWT)
 * En éxito:
 *   - Muestra toast de confirmación
 *   - Invalida caché 'dashboard-products' y 'products' para refrescar ambas vistas
 * En error:
 *   - Muestra toast con el mensaje de error del servidor
 *
 * Usado por: useProductForm (modo edición)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateProductInput } from '@/validations/product.schemas';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { toast } from 'sonner';

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const api = useApi(); // Hook DRY: inyecta token automáticamente

  return useMutation({
    /**
     * mutationFn — Envía solo los campos modificados (PATCH = actualización parcial).
     * @param id   - ID del producto a actualizar
     * @param data - Campos del producto a modificar (UpdateProductInput = CreateProductInput parcial)
     */
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductInput }) => {
      return await api.fetcher(`/api/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    /** onSuccess — Invalida las dos cachés para refrescar el dashboard y la lista pública */
    onSuccess: () => {
      toast.success('Producto actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['dashboard-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el producto');
    },
  });
}
