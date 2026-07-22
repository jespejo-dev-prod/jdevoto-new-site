'use client';

/**
 * shared/infrastructure/api/use-api.ts
 *
 * Hook DRY centralizado para todas las peticiones HTTP del frontend.
 *
 * Responsabilidades:
 *  1. Inyectar automáticamente el header Authorization: Bearer <token>
 *  2. Manejar el error 401 (sesión expirada) → llama logout() automáticamente
 *  3. Manejar 204 No Content sin intentar parsear JSON
 *  4. Normalizar la respuesta { success, data, meta } de la API
 *
 * Principio DRY: sin este hook, cada componente tendría que:
 *  - Obtener accessToken del AuthContext manualmente
 *  - Agregar el header Authorization en cada fetch
 *  - Manejar el 401 de forma individual
 */

import { useAuth } from '@/context/auth-context';
import { useCallback } from 'react';

export function useApi() {
  const { accessToken, logout } = useAuth();

  /**
   * fetcher
   *
   * Función base que ejecuta el fetch con headers estándar.
   * Todos los métodos (get, post, put, delete) son atajos de esta función.
   *
   * @param endpoint - URL relativa del endpoint (ej: '/api/products')
   * @param options  - RequestInit estándar de fetch (method, body, headers, etc.)
   * @returns        - El campo `data` de la respuesta, o { data, meta } si hay paginación
   */
  const fetcher = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const isFormData = options.body instanceof FormData;
      const headers: any = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers, // Permite sobreescribir headers si el llamador lo necesita
      };

      // Inyectar el token JWT si el usuario está autenticado
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      try {
        const response = await fetch(endpoint, {
          ...options,
          headers,
        });

        // Token expirado o revocado → cerrar sesión automáticamente
        if (response.status === 401 && accessToken) {
          await logout();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        // 204 No Content: respuesta exitosa sin cuerpo (ej: DELETE)
        if (response.status === 204) {
          return { success: true, data: null };
        }

        const data = await response.json();

        if (!response.ok) {
          let errorMessage = data.message || `Error ${response.status}`;
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error?.message) {
            errorMessage = data.error.message;
            if (data.error.code === 'VALIDATION_ERROR' && data.error.details) {
              const details = Object.values(data.error.details).flat().join(", ");
              if (details) errorMessage = details;
            }
          }
          throw new Error(errorMessage);
        }

        // Si hay meta (paginación), devolver { data, meta } para que el hook tenga acceso a ambos
        if (data.success && data.meta) {
          return {
            data: data.data,
            meta: data.meta.pagination
              ? { ...data.meta.pagination, ...data.meta }
              : data.meta
          };
        }

        // Devuelve data si viene envuelta en { success, data } (formato estándar de la API)
        return data.data || data;
      } catch (error: any) {
        throw new Error(error.message || 'Error de red o de servidor');
      }
    },
    [accessToken, logout]
  );

  /**
   * get — Atajo para GET requests.
   * Ejemplo: api.get('/api/products?page=1')
   */
  const get = useCallback(
    (endpoint: string, options?: Omit<RequestInit, 'method'>) =>
      fetcher(endpoint, { ...options, method: 'GET' }),
    [fetcher]
  );

  /**
   * post — Atajo para POST requests. Serializa body a JSON automáticamente.
   * Ejemplo: api.post('/api/products', { name: 'Tornillo' })
   */
  const post = useCallback(
    (endpoint: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>) =>
      fetcher(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    [fetcher]
  );

  /**
   * put — Atajo para PUT requests. Serializa body a JSON automáticamente.
   * Ejemplo: api.put('/api/products/123', { name: 'Tornillo actualizado' })
   */
  const put = useCallback(
    (endpoint: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>) =>
      fetcher(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    [fetcher]
  );

  /**
   * patch — Atajo para PATCH requests. Serializa body a JSON automáticamente.
   * Ejemplo: api.patch('/api/products/123', { name: 'Tornillo actualizado' })
   */
  const patch = useCallback(
    (endpoint: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>) =>
      fetcher(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    [fetcher]
  );

  /**
   * del — Atajo para DELETE requests.
   * (Renombrado porque `delete` es palabra reservada en JS)
   * Ejemplo: api.delete('/api/products/123')
   */
  const del = useCallback(
    (endpoint: string, options?: Omit<RequestInit, 'method'>) =>
      fetcher(endpoint, { ...options, method: 'DELETE' }),
    [fetcher]
  );

  // Exporta fetcher también para casos avanzados (ej: PATCH con headers personalizados)
  return { get, post, put, patch, delete: del, fetcher };
}
