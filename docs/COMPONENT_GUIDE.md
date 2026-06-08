# 📖 Guía de Componentes — Paso a Paso

Este documento explica en detalle técnico y descriptivo **qué hace cada archivo**, **por qué existe** y **cómo encaja** en la arquitectura general de nuestra plataforma e-commerce B2B.

Stack Tecnológico: `Next.js 16` · `TypeScript` · `Prisma 7` · `PostgreSQL` · `Zod` · `JWT` · `React Query v5`

---

## 🗺️ Mapa General de Carpetas

```
src/
├── app/            → Capa de Presentación (páginas React y Route Handlers de API de Next.js)
├── modules/        → ❤️ Corazón del negocio (Clean Architecture: catalog, orders, pricing)
├── lib/            → Herramientas globales de infraestructura de servidor (Prisma, JWT, errores)
├── context/        → Estado global de React en el navegador (Autenticación y Carrito)
├── shared/         → Componentes y utilidades compartidas de cliente (ej. useApi)
├── types/          → Contratos y definiciones TypeScript del dominio
├── validations/    → Esquemas Zod (única fuente de verdad para validación de datos)
└── proxy.ts        → Guardián perimetral de protección de rutas (Next.js 16)
```

---

## 1. `src/proxy.ts` — Guardián de Rutas

**Ubicación:** `src/proxy.ts`

**¿Qué hace?**  
Es el primer punto de control que Next.js ejecuta ante cualquier petición HTTP entrante. Intercepta la navegación y decide si el cliente tiene permitido acceder a la ruta solicitada o si debe ser redirigido.

**¿Por qué existe?**  
En Next.js 16, la protección de rutas se centraliza en `proxy.ts` (reemplazando al antiguo `middleware.ts`). Este archivo opera en el **Edge Runtime** de Next.js, lo que significa que se ejecuta en nodos perimetrales ultrar rápidos, mucho antes de que el servidor Node.js principal despierte para procesar la petición.

**Flujo paso a paso:**
1. Lee la cookie de sesión protegida (`refresh_token`) enviada por el navegador.
2. Si el usuario intenta acceder a una ruta protegida (`/dashboard`, `/orders`, `/checkout`) y NO tiene la cookie → es redirigido de inmediato a `/login?callbackUrl=[destino]` para que pueda retomar su flujo tras iniciar sesión.
3. Si un usuario ya logueado (con cookie) intenta entrar a rutas de invitado (`/login`, `/register`) → es redirigido automáticamente a su portal en `/dashboard`.
4. En cualquier otro caso (como el catálogo `/products` o archivos estáticos) → permite el paso mediante `NextResponse.next()`. En B2B, el catálogo web es público para indexación SEO, pero los componentes visuales ocultan el stock y los precios si no hay sesión.

```
Petición entrante
      ↓
  ¿Tiene refresh_token en cookie?
      ├── NO + ruta protegida   → redirect /login
      ├── SÍ + ruta de invitado → redirect /dashboard
      └── Cualquier otro caso  → next() (continuar)
```

---

## 2. `src/lib/` — Herramientas Globales del Servidor

Esta carpeta agrupa la infraestructura transversal del servidor. Ningún archivo aquí depende de componentes visuales de React.

### `lib/client.ts` — Singleton de Prisma

**Ubicación:** `src/lib/client.ts`

**¿Qué hace?**  
Crea y mantiene **una única instancia** de la conexión a PostgreSQL (`PrismaClient`) utilizando el adaptador nativo `@prisma/adapter-pg` y un pool de conexiones de la biblioteca `pg`.

**¿Por qué es un Singleton?**  
En desarrollo, Next.js recarga constantemente el código en caliente (Hot Module Replacement - HMR). Si creáramos un `new PrismaClient()` en cada archivo, cada recarga de página abriría nuevas conexiones a PostgreSQL, agotando el límite de la base de datos en cuestión de segundos. Este patrón guarda el cliente en el objeto global de Node (`globalThis`), garantizando que la misma conexión sobreviva entre recargas.

```typescript
// Patrón Singleton implementado en client.ts
const prismaClientSingleton = () => new PrismaClient({ adapter });
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### `lib/errors.ts` — Jerarquía de Errores de Dominio

**Ubicación:** `src/lib/errors.ts`

**¿Qué hace?**  
Define clases personalizadas de error en TypeScript que heredan de `Error`. Cada clase tiene su propio código de estado HTTP (`statusCode`) y un código de error interno para el cliente.

**¿Por qué existe?**  
Permite que cualquier parte de la lógica de negocio (casos de uso o servicios) detenga la ejecución simplemente haciendo `throw new NotFoundError("Producto no encontrado")`. El manejador central (`withApiHandler`) atrapa esta clase y la convierte en la respuesta HTTP 404 correcta sin necesidad de escribir bloques `try/catch` manuales en cada controlador.

| Clase de Error | Código HTTP | Cuándo usarla en el negocio |
|---|---|---|
| `ValidationError` | 400 | Datos de entrada incorrectos (formato inválido) |
| `UnauthorizedError` | 401 | Sin token de sesión o token caducado |
| `ForbiddenError` | 403 | Token válido pero sin permisos suficientes (ej. comprador en admin) |
| `NotFoundError` | 404 | Registro no existe en PostgreSQL |
| `ConflictError` | 409 | Registro duplicado (ej. RUT, SKU o slug ya registrados) |
| `BusinessRuleError` | 422 | Violación de regla de negocio (ej. sin stock o límite de crédito superado) |

---

### `lib/api-handler.ts` — Envoltorio Central de API (Decorator Pattern)

**Ubicación:** `src/lib/api-handler.ts`

**¿Qué hace?**  
Es una función de orden superior (`Higher-Order Function`) que envuelve todos los controladores de API (`Route Handlers`) del sistema, proporcionando un canal estandarizado para la captura y formateo de errores.

**¿Por qué existe?** (Principio DRY)  
En un proyecto sin este archivo, cada ruta de API tendría que repetir exactamente el mismo bloque `try { ... } catch (e) { if (e instanceof ZodError) ... }`. Al centralizarlo, los controladores quedan extremadamente limpios y enfocados únicamente en el flujo feliz.

**Mapeo Inteligente de Errores:**
```
Excepción lanzada en el Route Handler
    ├── ZodError          → HTTP 400 + Detalle estructurado de campos inválidos
    ├── AppError          → HTTP según la propiedad statusCode de la clase de error
    ├── Prisma P2002      → HTTP 409 Conflict (Violación de restricción UNIQUE en DB)
    └── Error desconocido → HTTP 500 + Log interno de consola (ocultando detalles al cliente)
```

**Helpers de Respuesta Estandarizada:**
- `ok(data)`: Retorna HTTP 200 OK con estructura `{ success: true, data }`.
- `created(data)`: Retorna HTTP 201 Created tras crear un recurso exitosamente.
- `noContent()`: Retorna HTTP 204 No Content (usado en borrados exitosos).

---

### `lib/auth.ts` — Infraestructura Criptográfica JWT

**Ubicación:** `src/lib/auth.ts`

Este módulo provee las funciones de firma y verificación de JSON Web Tokens utilizando la biblioteca `jose` o `jsonwebtoken` con una clave secreta fuerte (`JWT_SECRET`).

| Función | Descripción y Responsabilidad |
|---|---|
| `signAccessToken(payload)` | Emite un JWT de corta duración (ej. 1 hora) para acceso a recursos protegidos. |
| `signRefreshToken(userId)` | Emite un JWT de larga duración (ej. 7 días) que se almacena en cookie httpOnly para refresco. |
| `verifyToken(token)` | Decodifica y verifica criptográficamente la firma. Si el token expiró o fue alterado, lanza `UnauthorizedError`. |
| `extractUserFromRequest(req)` | Inspecciona el header `Authorization: Bearer <token>`, valida el token y devuelve el usuario autenticado. |
| `requireRole(user, allowedRoles)` | Muro de seguridad RBAC. Si el rol del usuario no está en la lista permitida, lanza `ForbiddenError`. |

---

### `lib/utils.ts` — Utilidades Transversales

**Ubicación:** `src/lib/utils.ts`

- **`serializeDecimal(obj)`**: Prisma ORM mapea las columnas `DECIMAL` de PostgreSQL a objetos de tipo `Decimal` o `BigInt` en JavaScript. Estos objetos no son soportados por `JSON.stringify()`. Esta función recorre los objetos recursivamente y los convierte a números flotantes nativos antes de enviarlos al navegador.

### `lib/slugify.ts` — Normalizador de Textos para URLs

**Ubicación:** `src/lib/slugify.ts`

- Convierte cualquier cadena de texto humano en un identificador limpio para rutas web.  
  *Ejemplo de transformación:* `"Tornillo M8 Hexagonal de Alta Resistencia 90°"` → `"tornillo-m8-hexagonal-de-alta-resistencia-90"`.

---

## 3. `src/types/` — Contratos de Dominio

**Ubicación principal:** `src/types/domain.ts`

Aquí se establecen los contratos de tipos de TypeScript. Al estar separados de Prisma, garantizan que la aplicación no dependa rígidamente del esquema de base de datos.

| Interfaz / Tipo | Propósito en el Negocio |
|---|---|
| `PriceBreakdown` | Estructura financiera completa: precio neto, monto de descuento, IVA aplicable, precio bruto final y el origen de la tarifa (`PROMOTION`, `LIST`, `BASE`). |
| `ProductWithPrice` | Producto de catálogo enriquecido con la propiedad `price: PriceBreakdown`. |
| `AuthenticatedUser` | Identidad en sesión decodificada del JWT (`id`, `email`, `role`, `companyId`). |
| `ApiSuccess<T>` | Contrato de respuesta exitosa de red: `{ success: true, data: T }`. |

---

## 4. `src/validations/` — Esquemas de Validación (Zod)

**Ubicación:** `src/validations/`

Esta carpeta es la única fuente de verdad para la validación de datos externos. Zod permite definir las reglas de negocio y, al mismo tiempo, inferir automáticamente los tipos para TypeScript.

### `validations/product.schemas.ts`

Define las reglas de los productos:
- `CreateProductSchema`: Exige nombre, SKU, slug y precio base. Realiza transformaciones automáticas (como convertir el SKU siempre a MAYÚSCULAS y asegurar que el slug no contenga espacios).
- `UpdateProductSchema`: Versión parcial (`.partial()`) para operaciones de parcheado (PATCH) donde todos los campos son opcionales.

### `validations/company.schemas.ts` (RUT Chileno Módulo 11)

**Ubicación:** `src/validations/company.schemas.ts`

El `RutSchema` implementa el algoritmo matemático oficial del Servicio de Impuestos Internos (SII) de Chile:
- Acepta múltiples formatos de entrada del usuario: `"12.345.678-9"`, `"12345678-9"`, `"12345678-k"`.
- Normaliza internamente la cadena a formato estándar `"XXXXXXXX-D"` sin puntos y con el dígito verificador en mayúscula.
- Si el dígito verificador no coincide con la fórmula de Módulo 11, detiene la petición con un error descriptivo en español.

---

## 5. `src/context/` — Estado Global React en Navegador

### `context/auth-context.tsx` — Gestor de Sesión Segura

**Ubicación:** `src/context/auth-context.tsx`

Es un React Context que mantiene el estado de autenticación del usuario. Su característica de seguridad principal es que **el token JWT de acceso se mantiene estrictamente en una variable de memoria RAM (`useState`)**, protegiendo a la plataforma contra robo de credenciales mediante XSS.

**Flujo de Inicialización Silenciosa:**
Al cargar la aplicación en el navegador, el proveedor ejecuta automáticamente el método `refresh()`. Este método consulta al servidor (enviando la cookie `httpOnly`) para recuperar un token de acceso válido sin pedirle credenciales al usuario.

| Método Expuesto | Efecto en la Plataforma |
|---|---|
| `login(email, pwd)` | Envía credenciales a `/api/auth/login`. Si es exitoso, guarda el token en RAM y redirige a `/dashboard`. |
| `logout()` | Notifica al backend para invalidar la sesión, borra la memoria RAM del cliente y expulsa al usuario a `/login`. |
| `registerUser(data)` | Registra la nueva empresa y el usuario administrador en un solo flujo transaccional. |

---

### `context/CartContext.tsx` — Carrito Corporativo B2B

**Ubicación:** `src/context/CartContext.tsx`

Gestiona los productos seleccionados por el cliente para su cotización o pedido. A diferencia de la sesión, el carrito **persiste en `localStorage`** (`antigravity_cart`) para evitar que el comprador pierda su trabajo si cierra la ventana.

**Cálculo de Ahorros:**
Al añadir un producto con `addItem()`, el carrito guarda el precio bruto con descuento (`price`) y calcula en tiempo real el precio original sin descuento (`originalPrice`) y el monto ahorrado (`discountAmount`). Esto permite mostrar en el sitio web precios anteriores tachados y etiquetas de "Ahorraste $X" sin sobrecargar los componentes visuales con lógica repetida.

---

## 6. `src/modules/` — Corazón del Negocio (Clean Architecture)

El código de negocio se organiza modularmente. Dentro de cada módulo (ej. `catalog`), se divide en tres responsabilidades: `domain` (reglas puras), `application` (casos de uso) y `presentation` (hooks React Query).

```
src/modules/[nombre]/
├── domain/        → Reglas puras del negocio (sin HTTP ni React).
├── application/   → Casos de uso (orquesta pasos de ejecución).
└── presentation/  → Hooks de React Query para conectar la UI con el backend.
```

### 6.1 `modules/pricing/domain/price.service.ts` — Motor de Precios B2B

**Ubicación:** `src/modules/pricing/domain/price.service.ts`

En B2B los precios no son estáticos. Este servicio evalúa la jerarquía de precios aplicable a cada cliente y producto en un orden estricto de prioridad (la regla con mayor prioridad sobrescribe a las inferiores):

```
Jerarquía de Precios B2B
 1. OUTLET (Liquidación especial)
 2. COMPANY_LIST (Lista de precios asignada específicamente a la empresa)
 3. PROMOTION (Descuento temporal por marca o categoría)
 4. CUSTOMER_DISCOUNT (Porcentaje de descuento global asignado a la cuenta)
 5. BASE_PRICE (Precio neto estándar por defecto)
```

**Optimización de Rendimiento (HashMaps O(1)):**
Si un cliente visualiza 50 productos en una página, consultar la base de datos por cada uno generaría un problema de rendimiento N+1. Para solucionarlo, el servicio carga las listas y promociones en un solo bloque y construye estructuras de tipo `Map<string, number>` (`HashMap`). Esto permite calcular los precios de todo el catálogo en milisegundos con complejidad temporal O(1). Además, usa `unstable_cache` de Next.js para almacenar las listas en caché durante 5 minutos.

---

### 6.2 `modules/catalog/application/` — Casos de Uso del Catálogo

**Ubicación:** `src/modules/catalog/application/`

#### `createProduct.use-case.ts`
Es el caso de uso responsable de dar de alta un producto. Orquesta 4 operaciones críticas:
1. **Control de Rol (`requireRole`):** Confirma que el usuario en sesión tiene rol `ADMIN` o `SALES_REP`.
2. **Validación de Unicidad:** Verifica en PostgreSQL que el SKU o el slug ingresado no pertenezcan ya a otro producto.
3. **Persistencia de Archivos (`moveImages`):** Mueve físicamente las imágenes subidas desde el almacenamiento temporal a la carpeta definitiva del catálogo.
4. **Transacción en DB:** Escribe los datos en las tablas de productos y variantes. Si la base de datos falla en este último paso, el sistema ejecuta automáticamente una acción de reversión (`rollback`), eliminando las imágenes que acababa de mover para no dejar archivos basura en el servidor.

#### `getProductDetails.use-case.ts`
Busca un producto por su `slug` en la base de datos. Para garantizar máxima velocidad de respuesta (~20ms), este caso de uso **no calcula los precios B2B**. La resolución de precios se delega al cliente de forma asíncrona mediante el motor de precios.

---

### 6.3 `modules/catalog/presentation/hooks/useProductForm.ts`

**Ubicación:** `src/modules/catalog/presentation/hooks/useProductForm.ts`

Hook unificado (DRY) que orquesta la interfaz de usuario en los formularios de creación y edición de productos.
- Detecta automáticamente el modo de operación (`isEditing = !!product`).
- En modo creación, escucha lo que el usuario escribe en el campo de nombre y genera automáticamente un slug URL-amigable en tiempo real.
- Orquesta el envío de datos al servidor (`useCreateProduct` o `useUpdateProduct`) y maneja notificaciones visuales (`toast`) informando de éxitos o errores de validación.

---

### 6.4 `modules/catalog/presentation/hooks/` — Conectores React Query

**Ubicación:** `src/modules/catalog/presentation/hooks/`

| Hook de Cliente | Endpoint que Llama | Propósito en el Frontend |
|---|---|---|
| `useProducts` | `GET /api/products` | Gestiona el listado de productos paginado y con filtros de búsqueda. |
| `useCreateProduct` | `POST /api/products` | Mutación asíncrona para registrar un nuevo ítem en el catálogo. |
| `useUpdateProduct` | `PATCH /api/products/:id` | Mutación de actualización parcial (enviando solo campos modificados). |
| `useDeleteProduct` | `DELETE /api/products/:id` | Realiza un "Soft Delete" (desactiva el producto sin romper el historial de pedidos). |
| `useTaxonomy` | `GET /api/categories` + `brands` | Recupera en un solo hook los selectores de categorías y marcas. |

---

## 7. `src/shared/infrastructure/api/use-api.ts` — Cliente HTTP

**Ubicación:** `src/shared/infrastructure/api/use-api.ts`

Para cumplir con el principio **DRY**, ningún componente de React ejecuta llamadas nativas `fetch()`. Todos utilizan este hook maestro.
- **Inyección de Cabecera:** Lee el token del `AuthContext` y lo inyecta automáticamente en `Authorization: Bearer <token>`.
- **Manejo de 401 Expirado:** Si el backend rechaza el token por caducidad, el hook cierra automáticamente la sesión local y expulsa al usuario al login.

---

## 8. Flujo de Datos Arquitectónico Completo (Ejemplo: Crear Producto)

La siguiente traza ilustra cómo interactúan de inicio a fin todos los archivos descritos al realizar una operación en la plataforma:

```
[Navegador del Administrador] ── Llama a onSubmit() en el formulario
           │
           ▼ 1. Hook de Presentación
[useProductForm (en presentation/hooks/)]
           │
           ▼ 2. Llama a Mutación de React Query
[useCreateProduct (en presentation/hooks/)]
           │
           ▼ 3. Llama a Cliente HTTP DRY (Inyecta JWT en cabecera)
[useApi.post('/api/products', data) (en shared/infrastructure/api/)]
           │
           ▼ 4. Petición HTTP POST llega al servidor
[proxy.ts (Edge Middleware de Next.js)] ── Verifica sesión de administrador
           │
           ▼ 5. Route Handler de API en Next.js
[app/api/products/route.ts] ── Envuelto en withApiHandler (Atrapa cualquier error)
           │
           ▼ 6. Validación Perimetral
[extractUserFromRequest()] ── Verifica firma JWT ──► [CreateProductSchema.parse(body)] (Zod)
           │
           ▼ 7. Caso de Uso de Dominio
[createProductUseCase(data, user) (en application/)]
           │
           ├─► requireRole(user, [ADMIN, SALES_REP])
           ├─► validateUniqueness(sku, slug) (Prisma)
           ├─► moveImages(temp -> products) (Almacenamiento)
           └─► persistProduct() ── Transacción atómica en PostgreSQL
           │
           ▼ 8. Retorno Estandarizado HTTP 201 Created
[created(product) (en lib/api-handler.ts)]
           │
           ▼ 9. React Query actualiza el cliente
[Navegador: toast.success("Producto creado exitosamente")]
```
