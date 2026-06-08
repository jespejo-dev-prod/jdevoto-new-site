'use client';

/**
 * modules/catalog/presentation/hooks/useCreateProduct.ts
 *
 * Mutación React Query para crear un producto nuevo.
 *
 * Llama a: POST /api/products (via useApi → fetcher con token JWT)
 * En éxito:
 *   - Muestra toast de confirmación
 *   - Invalida la caché 'products' para refrescar la lista del dashboard
 * En error:
 *   - Muestra toast con el mensaje de error del servidor
 *
 * Usado por: useProductForm (modo creación)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateProductInput } from '@/validations/product.schemas';
import { toast } from 'sonner';
import { useApi } from '@/shared/infrastructure/api/use-api';

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const api = useApi(); // Hook DRY: inyecta token automáticamente

  return useMutation({
    /**
     * mutationFn — La función que ejecuta la petición al servidor.
     * Recibe los datos validados del formulario (CreateProductInput).
     */
    mutationFn: async (data: CreateProductInput) => {
      return await api.post('/api/products', data);
    },

    /** onSuccess — Se ejecuta si el servidor respondió con éxito (HTTP 2xx) */
    onSuccess: () => {
      toast.success('Producto publicado con éxito');
      // Invalida la caché para que la lista se refresque automáticamente
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },

    /** onError — Se ejecuta si el servidor respondió con error o hubo falla de red */
    onError: (error) => {
      toast.error(error.message || 'Error al crear el producto');
    },
  });
}
