# Plan de Implementación: DRY y Cliente API Centralizado

Tienes toda la razón. Hacer llamadas `fetch` directamente dentro de los mutations rompe los principios DRY y dificulta el manejo centralizado de tokens, errores y configuraciones base. Además, cometí el error de intentar sacar el token de `localStorage` cuando tu arquitectura usa `AuthContext` para mantener el `accessToken` en memoria.

Para aplicar **principios DRY en todo el proyecto** y mantener la **arquitectura limpia**, este es el plan para refactorizar la capa de infraestructura del frontend:

## 1. Capa de Infraestructura Compartida (DRY HTTP Client)
Crearemos un hook que centralice **todas** las peticiones HTTP del frontend (excepto el login/refresh inicial).

#### [NEW] `src/shared/infrastructure/api/use-api.ts`
Un custom hook que:
1. Extrae el `accessToken` usando tu `useAuth()`.
2. Proporciona métodos envoltorio (`get`, `post`, `put`, `delete`).
3. Agrega automáticamente los headers `Content-Type: application/json` y `Authorization: Bearer ...`.
4. Maneja la lógica de validación de `response.ok`, parsea el JSON y lanza errores tipados o legibles.

## 2. Refactorización del Módulo de Catálogo
Aplicaremos este nuevo hook en el módulo que acabamos de crear para que quede 100% DRY.

#### [MODIFY] `src/modules/catalog/presentation/hooks/useCreateProduct.ts`
- Eliminaremos todo el código boilerplate de `fetch`.
- Inyectaremos el cliente `useApi()`.
- La mutación quedará simplificada a una sola línea: `return api.post('/api/products', data);`.

## 3. Revisión DRY Adicional en Frontend
- Dejaremos la base lista (`shared/infrastructure/`) para que cualquier nuevo módulo (ej. `modules/orders/`) utilice `useApi()` nativamente.

---

### Pregunta para ti:
¿Estás de acuerdo con crear este `useApi()` centralizado en la carpeta `shared/infrastructure` que utilice tu `AuthContext`? Si apruebas, ¡lo programo ahora mismo!
