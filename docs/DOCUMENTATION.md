# 📦 B2B eCommerce Backend — Documentación Técnica

> **Stack:** Next.js 16.2.4 (App Router) · Prisma 7.7.0 · PostgreSQL · TypeScript · Zod · JWT  
> **Mercado:** Chile 🇨🇱 — RUT, IVA 19%, Pesos Chilenos (CLP)

---

## 🚀 Cambios Recientes (Actualización B2B v2.0)

- **Migración a Prisma 7**: Se ha actualizado el motor de persistencia a Prisma 7, utilizando `prisma.config.ts` para una gestión moderna de la configuración.
- **Seguridad de Sesiones**: Se añadió el campo `revoked` al modelo `RefreshToken` para permitir la invalidación instantánea de sesiones.
- **Middleware → Proxy (Next.js 16)**: Adaptación a las nuevas convenciones de Next.js 16, moviendo la lógica de protección de rutas a `src/proxy.ts`. En esta versión, la función exportada **debe llamarse obligatoriamente `proxy`** (ej: `export function proxy(request: NextRequest)`). *(Nota: Se debe monitorear que esta lógica no introduzca latencia innecesaria en el edge)*.
- **UI Premium (v2.1)**: Rediseño total del Dashboard con estética oscura, gráficos interactivos (`recharts`) y micro-animaciones (`framer-motion`).
- **Gestión Avanzada de Pedidos (v2.2)**: 
    - Implementación de edición completa para pedidos en estado `DRAFT`.
    - Sistema de búsqueda por número de pedido y razón social de cliente.
    - Filtros por rango de fechas y pestañas de estado.
    - Mecanismo de reactivación de pedidos cancelados (vuelven a `DRAFT`).
- **Arquitectura Clean & Modular Monolith**: Refactorización del código backend para aislar la lógica en Casos de Uso (`src/modules/*`), liberando los Route Handlers.
- **Cliente HTTP DRY (Server State)**: Integración de `@tanstack/react-query` y creación de un hook maestro `useApi` para centralizar inyección de tokens y control de errores.
- **DRY UI (Dashboard Layout)**: Agrupación de la navegación global (`Sidebar`, `DashboardHeader`) en layouts reutilizables, reduciendo código duplicado en las vistas internas.

---

## 🏗️ Guía Rápida de Arquitectura y Patrones (Lectura Fácil)

Para mantener el código ordenado, escalable y fácil de leer, hemos aplicado los siguientes conceptos clave en todo el proyecto:

### 1. Arquitectura: "Clean Architecture" y Monolito Modular
Imagina que el código es como un restaurante. No quieres que el cajero también cocine y limpie las mesas. 
- **Presentación (UI/Hooks)**: Son los meseros. Solo toman el pedido (interfaz) y se lo pasan a la cocina. No saben cocinar.
- **Casos de Uso (Application)**: Son los chefs de estación. Tienen la receta exacta paso a paso (ej: `createProductUseCase`).
- **Dominio / Servicios**: Es el chef principal. Conoce las reglas maestras del negocio (ej: `PriceService` sabe cómo calcular descuentos).
- **Monolito Modular**: En lugar de tener todo mezclado, separamos las cosas por "Módulos" (Catálogo, Pedidos, Usuarios). Cada módulo tiene su propia interfaz, casos de uso y dominio.

### 2. Principios DRY (Don't Repeat Yourself)
**"No te repitas"**. Si haces lo mismo dos veces, ponlo en un lugar común.
- **En el Frontend**: Antes, cada página hacía `fetch` a la API manualmente. Ahora usamos un solo hook maestro (`useApi`) que inyecta automáticamente los tokens y maneja los errores para toda la aplicación. Además, componentes visuales repetidos (como tablas y formularios) se extraen a archivos separados (`UserTable`, `UserForm`).
- **En el Backend**: Todas las rutas de API usan un envoltorio llamado `withApiHandler`. Este atrapa cualquier error y lo formatea automáticamente, por lo que no tenemos que escribir `try/catch` en cada ruta.

### 3. Patrones de Diseño Clave
Son soluciones probadas a problemas comunes de programación:
- **Singleton**: Nos aseguramos de que solo exista *una sola conexión* a la base de datos (`prisma.client`) y *una sola calculadora de precios* en todo el sistema. Así ahorramos memoria.
- **Strategy (Estrategia)**: En lugar de tener un montón de `if/else` gigantescos para saber qué precio darle a un cliente (oferta, descuento, normal), el `PriceService` usa estrategias intercambiables y elige la correcta matemáticamente.
- **Decorator**: Nuestro `withApiHandler` "decora" las rutas con superpoderes de manejo de errores, sin alterar la lógica interna de la ruta.

### 4. Sistema de Archivos (¿Dónde está cada cosa?)
El proyecto está dividido estratégicamente:
- `src/app/`: Es el **enrutador**. Aquí solo hay páginas visuales (ej: `page.tsx`) y puntos de entrada de API (ej: `route.ts`).
- `src/modules/`: **El Corazón del Negocio**. Aquí está la lógica real dividida por temas (`catalog`, `orders`, `users`). Si hay un bug de precios, buscas aquí, no en `app/`.
- `src/lib/`: Herramientas globales (autenticación, manejador de errores).
- `src/shared/`: Componentes y hooks (`useApi`) que se usan en **múltiples** módulos a la vez.

> [!IMPORTANT]
> **Nota Técnica: Migración a `proxy.ts` (Next.js 16)**
> Al migrar de `middleware.ts` a `proxy.ts` siguiendo las nuevas convenciones, la función exportada **debe llamarse obligatoriamente `proxy`** (ej: `export function proxy(request: NextRequest) { ... }`). Si se exporta como `middleware` o con otro nombre, Next.js no la reconocerá y lanzará un error de compilación.

---

## Tabla de Contenidos

1. [Estado del Proyecto](#1-estado-del-proyecto)
2. [Estructura de Archivos](#2-estructura-de-archivos)
3. [Setup e Instalación](#3-setup-e-instalación)
4. [Base de Datos — Modelos](#4-base-de-datos--modelos)
5. [Capa de Red Frontend (DRY API Client)](#5-capa-de-red-frontend-dry-api-client)
6. [API Endpoints](#6-api-endpoints)
7. [Módulos del Sistema (Clean Architecture)](#7-módulos-del-sistema-clean-architecture)
8. [Sistema de Roles](#8-sistema-de-roles)
9. [Motor de Precios B2B](#9-motor-de-precios-b2b)
10. [Direcciones de Envío (ChileExpress)](#10-direcciones-de-envío-chileexpress)
11. [Flujo de un Pedido](#11-flujo-de-un-pedido)
12. [Administración de Clientes (Customers)](#12-administración-de-clientes-customers)
13. [Errores y Códigos HTTP](#13-errores-y-códigos-http)
14. [Integración Mercado Pago (Pendiente)](#14-integración-mercado-pago-pendiente)
15. [Herramientas de API (Postman / Swagger)](#15-herramientas-de-api-postman--swagger)
16. [Gestión de Pedidos Avanzada](#16-gestión-de-pedidos-avanzada)

---

## 1. Estado del Proyecto

| Verificación | Resultado |
|---|---|
| `tsc --noEmit` | ✅ Sin errores TypeScript |
| `next build` | ✅ Build de producción exitoso |
| Base de datos | ⚠️ Requiere PostgreSQL corriendo y `.env` configurado |

---

## 2. Estructura de Archivos

```
.
├── prisma/
│   ├── schema.prisma              # Modelos de base de datos
│   └── seed.ts                    # Script de población (categorías)
│
├── prisma.config.ts               # Configuración Prisma 7 (nuevo estándar)
│
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/
│   │       │   │   └── route.ts   # POST /api/auth/register (Registro público)
│   │       │   └── login/
│   │       │       └── route.ts   # POST /api/auth/login
│   │       ├── products/
│   │       │   ├── route.ts       # GET /api/products · POST /api/products
│   │       │   └── [id]/
│   │       │       └── route.ts   # GET · PUT · DELETE /api/products/:id
│   │       └── orders/
│   │           ├── route.ts       # GET /api/orders · POST /api/orders
│   │           └── [id]/
│   │               └── route.ts   # GET · PUT /api/orders/:id
│   │
│   ├── lib/
│   │   ├── api-handler.ts         # Middleware central: manejo de errores y respuestas
│   │   ├── auth.ts                # Generación y verificación de JWT
│   │   ├── errors.ts              # Jerarquía de errores de dominio
│   │   ├── client.ts              # Singleton del cliente Prisma (v7)
│   │   └── utils.ts               # Utilidades de Tailwind (cn)
│   │
│   ├── proxy.ts                   # Protección de rutas (Next.js 16 convention)
│   │
│   ├── modules/
│   │   └── catalog/                 # Módulo de Dominio (Monolito Modular)
│   │       ├── application/
│   │       │   └── createProduct.use-case.ts  # Caso de uso (Clean Architecture)
│   │       └── presentation/
│   │           └── hooks/
│   │               └── useCreateProduct.ts    # React Query Mutator
│   │
│   ├── shared/
│   │   └── infrastructure/
│   │       └── api/
│   │           └── use-api.ts       # Hook de peticiones DRY (maneja el token automáticamente)
│   │
│   ├── context/
│   │   └── auth-context.tsx       # Estado global de autenticación (React Context)
│   │
│   ├── services/                  # Servicios legacy (pronto a migrar a modules/)
│   │   ├── price.service.ts       # Motor de precios B2B (listas, descuentos, IVA)
│   │   ├── order.service.ts       # Lógica de pedidos (stock, totales, estados)
│   │   └── payment.service.ts     # Integración Mercado Pago (pendiente)
│   │
│   ├── providers/
│   │   └── query-provider.tsx     # Proveedor global de TanStack Query
│   │
│   ├── scripts/
│   │   └── seed-categories.ts     # Script de inicialización de categorías base
│   │
│   ├── types/
│   │   └── domain.ts              # Tipos TypeScript del dominio de negocio (PriceBreakdown c/ unit e inner)
│   │
│   └── validations/
│       ├── auth.schemas.ts        # Zod: Login
│       ├── company.schemas.ts     # Zod: Empresa + validación RUT chileno
│       ├── order.schemas.ts       # Zod: Crear pedido · Filtros de lista
│       └── product.schemas.ts     # Zod: Crear producto · Filtros de lista
│
├── .env                           # Variables de entorno (NO subir a git)
├── .env.example                   # Plantilla de variables de entorno
├── package.json
└── tsconfig.json
```

---

## 3. Setup e Instalación

### Paso 1 — Clonar e instalar dependencias

```bash
npm install
```

### Paso 2 — Configurar variables de entorno

```bash
# Copiar la plantilla
copy .env.example .env
# Luego editar .env con tus datos reales
```

### Paso 3 — Generar el cliente Prisma

```bash
# Prisma 7 detectará automáticamente prisma.config.ts
npx prisma generate
```

### Paso 4 — Inicializar base de datos y categorías

```bash
npx prisma db push
npx prisma db seed
```

### Paso 5 — Correr el servidor

```bash
npm run dev
# Disponible en http://localhost:3000
```

---

## 4. Variables de Entorno

Archivo: `.env` (basado en `.env.example`)

| `NODE_ENV` | No | `development` o `production` |
| `PRISMA_CLIENT_ENGINE_TYPE` | No | `library` o `binary` (recomendado: `library`) |

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/b2b_ecommerce?schema=public"
JWT_SECRET="cambia-este-valor-por-uno-seguro-de-al-menos-32-chars"
JWT_REFRESH_SECRET="otra-clave-segura-diferente"
JWT_EXPIRES_IN="1h"
NODE_ENV="development"
```

> ⚠️ **NUNCA subas el archivo `.env` a Git.** Ya está en `.gitignore`.

---

## 5. Base de Datos — Modelos

### Diagrama de relaciones

```
Company (empresa B2B)
  ├── users[]           → User (obligatorio, companyId NOT NULL)
  ├── orders[]          → Order
  └── priceLists[]      → CompanyPriceList → PriceList

Promotion (Reglas masivas)
  ├── brand?            → Filtro por marca
  └── category?         → Filtro por categoría

User
  ├── company           → Company (FK obligatorio)
  └── refreshTokens[]   → RefreshToken

Product
  ├── category?         → Category (opcional)
  ├── brand?            → Brand (opcional)
  ├── priceListItems[]  → PriceListItem
  └── orderItems[]      → OrderItem

PriceList
  ├── items[]           → PriceListItem (precio por producto)
  └── companies[]       → CompanyPriceList (qué empresas usan esta lista)

Promotion (Reglas masivas)
  ├── brand?            → Brand (Filtro opcional)
  └── category?         → Category (Filtro opcional)

Order
  └── items[]           → OrderItem (snapshot de precios al momento del pedido)
```

### Descripción de cada modelo

| Modelo | Tabla DB | Descripción |
|---|---|---|
| `Company` | `companies` | Empresa B2B cliente. Tiene RUT chileno, crédito, plazo de pago y **descuento base (%)** |
| `User` | `users` | Usuario del sistema. Siempre vinculado a una `Company` |
| `RefreshToken` | `refresh_tokens` | Tokens de refresco JWT almacenados en DB |
| `Category` | `categories` | Categorías de productos. Soporta marca **`isOutlet`** para bloquear descuentos |
| `Brand` | `brands` | Marcas de productos. Permite agrupar para promociones masivas |
| `Product` | `products` | Producto con precio base, stock, fotos y **empaque (unit/inner)** |
| `PriceList` | `price_lists` | Lista de precios manual (GENERAL, COMPANY) |
| `Promotion` | `promotions` | Reglas de oferta por Marca o Categoría (No acumulables) |
| `PriceListItem` | `price_list_items` | Precio neto de un producto dentro de una lista |
| `CompanyPriceList` | `company_price_lists` | Asignación de lista de precios a una empresa |
| `Order` | `orders` | Pedido B2B con totales netos, IVA y estado |
| `OrderItem` | `order_items` | Ítem de pedido con snapshot de precio al momento de compra |

### Enums

**`UserRole`**
```
ADMIN       → Administrador del sistema (acceso total)
SALES_REP   → Vendedor / agente comercial
BUYER       → Comprador vinculado a una empresa
```

**`OrderStatus`**
```
DRAFT       → Borrador, no confirmado
PENDING     → Confirmado, esperando procesamiento
CONFIRMED   → Aprobado por el equipo de ventas
PROCESSING  → En preparación / bodega
SHIPPED     → Despachado
DELIVERED   → Entregado al cliente
CANCELLED   → Cancelado
REJECTED    → Rechazado (crédito, stock, etc.)
```

**`PaymentStatus`**
```
PENDING         → Pago pendiente
PARTIALLY_PAID  → Pago parcial
PAID            → Pagado completo
OVERDUE         → Vencido
REFUNDED        → Reembolsado
```

---

## 5. Capa de Red Frontend (DRY API Client)

Para garantizar el cumplimiento de los principios **DRY**, el frontend nunca utiliza `fetch` manual en los componentes de la aplicación. 
Se ha creado un cliente maestro `useApi` y una capa de mutaciones basada en `@tanstack/react-query`.

### El Hook Maestro: `useApi` (`src/shared/infrastructure/api/use-api.ts`)

- Se encarga automáticamente de obtener el `accessToken` del `AuthContext`.
- Añade los headers estándar como `Content-Type: application/json` y `Authorization: Bearer <token>`.
- Maneja los códigos de estado `401 Unauthorized`. Si el token expira o es revocado, fuerza el `logout` inmediato.
- Normaliza las respuestas (convierte la estructura `{success, data, error}` a `data`).

### Mutaciones y Server State
Todas las escrituras se realizan en la capa de presentación a través de mutadores (hooks). Por ejemplo, `useCreateProduct`:
```typescript
import { useApi } from '@/shared/infrastructure/api/use-api';
import { useMutation } from '@tanstack/react-query';

export function useCreateProduct() {
  const api = useApi();
  return useMutation({
    mutationFn: async (data: CreateProductInput) => api.post('/api/products', data),
    onSuccess: () => toast.success('Exito!'),
  });
}
```

---

## 6. API Endpoints

> Todos los endpoints (excepto login) requieren el header:
> ```
> Authorization: Bearer <access_token>
> ```

### Formato estándar de respuestas

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

**Respuesta de error:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Credenciales inválidas",
    "details": { ... }
  }
}
```

---

### `POST /api/auth/register` (Público)

Registra una nueva empresa y su usuario administrador de forma simultánea en una transacción.

**Body:**
```json
{
  "razonSocial": "Empresa S.A.",
  "rut": "76123456-0",
  "telefono": "+56912345678",
  "giro": "Venta de Maquinaria",
  "email": "admin@empresa.cl",
  "password": "Password123!",
  "defaultDiscount": 30
}
```

**Respuesta 201 Created:** Idéntica a la respuesta de login, incluye tokens y datos de usuario/empresa.

**Errores posibles:**
| Código | HTTP | Descripción |
|---|---|---|
| `VALIDATION_ERROR` | 400 | RUT inválido o campos faltantes |
| `CONFLICT` | 409 | El email o el RUT ya están registrados |

---

### `POST /api/auth/login`

Autentica un usuario y establece una cookie `httpOnly` con el `refresh_token`. Retorna un `access_token` de corta duración en el cuerpo.

**Body:**
```json
{
  "email": "comprador@empresa.cl",
  "password": "mipassword123"
}
```

**Respuesta 200 OK:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "token_type": "Bearer",
    "user": {
      "id": "cuid...",
      "email": "comprador@empresa.cl",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "BUYER",
      "company": {
        "id": "cuid...",
        "razonSocial": "Empresa SA"
      }
    }
  }
}
```

**Seguridad:**
- `access_token`: Solo en memoria (estado de React).
- `refresh_token`: Cookie `httpOnly`, `secure`, `sameSite: strict`.

---

### `POST /api/auth/refresh`

Obtiene un nuevo `access_token` usando el `refresh_token` de la cookie.

**Respuesta 200 OK:**
```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "user": { ... }
  }
}
```

---

### `POST /api/auth/logout`

Revoca el `refresh_token` en la base de datos y elimina la cookie del navegador.

---

### `GET /api/products`

Lista productos del catálogo con **precios calculados** según la lista de precios asignada a la empresa del usuario autenticado.

**Query params:**
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | 1 | Número de página |
| `limit` | number | 20 | Items por página (máx. 100) |
| `search` | string | — | Busca en nombre, SKU y descripción |
| `categoryId` | string | — | Filtra por categoría |
| `inStock` | boolean | — | Solo productos con stock disponible |
| `minPrice` | number | — | Precio bruto mínimo (con IVA) en CLP |
| `maxPrice` | number | — | Precio bruto máximo (con IVA) en CLP |
| `companyId` | string | — | Solo ADMIN/SALES_REP: precios de otra empresa |

**Respuesta 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid...",
      "sku": "PROD-001",
      "name": "Tornillo Hexagonal M8",
      "unit": "UN",
      "inner": 12,
      "stockQuantity": 500,
      "price": {
        "productId": "cuid...",
        "unitNetPrice": 100.00,
        "unit": "UN",
        "inner": 12,
        "priceSource": "PROMOTION",
        ...
      }
    }
  ]
}
```

---

### `POST /api/products` *(Solo ADMIN)*

Crea un nuevo producto en el catálogo.

**Body:**
```json
{
  "sku": "PROD-002",
  "name": "Perno Hexagonal M10",
  "slug": "perno-hexagonal-m10",
  "basePrice": 250.00,
  "unit": "UN",
  "inner": 12,
  "stockQuantity": 1000,
  "minOrderQty": 50,
  "stockAlert": 100,
  "brand": "Stanley",
  "description": "Perno de acero inoxidable",
  "categoryId": "cuid...",
  "images": ["https://cdn.empresa.cl/perno-m10.jpg"]
}
```

**Respuesta 201 Created:** el producto creado completo.

---

### `GET /api/orders`

Lista pedidos. Aplica filtro automático por rol:
- **BUYER:** solo ve los pedidos de su propia empresa
- **ADMIN / SALES_REP:** ve todos los pedidos

**Query params:**
| Param | Tipo | Descripción |
|---|---|---|
| `page` | number | Número de página (default: 1) |
| `limit` | number | Items por página (default: 20) |
| `status` | string | Filtrar por estado del pedido |
| `companyId` | string | Solo ADMIN/SALES_REP: filtrar por empresa |
| `from` | ISO date | Pedidos creados desde esta fecha |
| `to` | ISO date | Pedidos creados hasta esta fecha |

---

| `NOT_FOUND` | 404 | Producto o empresa no encontrada |

---

### `GET /api/shipping/regions` (Público)

Retorna la lista oficial de regiones y comunas de Chile para usar en formularios de despacho.

**Respuesta 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": "13",
      "name": "METROPOLITANA DE SANTIAGO",
      "comunas": [
        { "id": "13101", "name": "SANTIAGO" },
        { "id": "13502", "name": "ALHUE" }
      ]
    }
  ]
}
```

---

### `POST /api/orders`

Crea un nuevo pedido B2B. La dirección de despacho debe ser estructurada según el formato de ChileExpress.

**Body:**
```json
{
  "companyId": "cuid...",
  "items": [
    { "productId": "cuid...", "quantity": 100 }
  ],
  "shippingAddress": {
    "region": "METROPOLITANA DE SANTIAGO",
    "comuna": "ALHUE",
    "street": "Calle Falsa",
    "number": "123",
    "apartment": "Depto 402",
    "details": "Portón azul, frente a la plaza"
  }
}
```

---

## 7. Módulos del Sistema (Clean Architecture)

El backend de la aplicación ha migrado a una arquitectura limpia ("Clean Architecture") basada en **Monolito Modular**. En lugar de inyectar reglas de negocio directamente en los Route Handlers de Next.js, se dividen en Módulos.

### Capa de Aplicación (Casos de Uso)
Ejemplo: `src/modules/catalog/application/createProduct.use-case.ts`.
- Desacopla la lógica de Prisma y Prisma/Next.
- Recibe un payload validado (`CreateProductInput`).
- Es agnóstico a la forma de transporte (HTTP API, WebSocket, Cron).

> ⚠️ **Transición de `services/` a `modules/`**: Actualmente existen servicios "legacy" en la raíz (como `price.service.ts`). En una arquitectura limpia estricta, estos pasarán a ser **Domain Services** dentro de sus respectivos módulos (`catalog`, `orders`, etc.) dado que contienen lógica compleja que involucra múltiples entidades.

### `lib/api-handler.ts` — Middleware Central

Todas las rutas se envuelven con `withApiHandler()` para estandarizar el manejo de errores:

```typescript
export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  const data = CreateProductSchema.parse(body);

// Delegar la lógica al caso de uso (Clean Architecture)
  const product = await createProductUseCase(data);

  return created(product); // → { success: true, data } con HTTP 201
});
```

**Flujo de manejo de errores:**
```
ZodError          → HTTP 400 VALIDATION_ERROR  (con detalle de campos)
AppError          → HTTP según error.statusCode
Error inesperado  → HTTP 500 INTERNAL_ERROR    (logeado en consola)
```

---

### Patrones de Diseño Implementados

Para asegurar la escalabilidad a nivel corporativo, el backend incorpora de forma activa patrones de diseño de software:

1. **Singleton Pattern**: El cliente de Prisma (`src/lib/client.ts`) y los servicios core (`priceService`, `orderService`) son Singletons para optimizar el uso de memoria y conexiones a la DB.
2. **Strategy Pattern**: Aplicado en el motor de precios (`price.service.ts`), permite resolver el precio de un ítem iterando sobre diferentes "estrategias" (Descuento Cliente, Regla Masiva, Precio Base) sin anidar múltiples `if/else`.
3. **Repository Pattern (Proyectado)**: Abstracción de Prisma en `src/modules/*/infrastructure/` para que los Casos de Uso no dependan de la tecnología de base de datos directamente.
4. **Adapter Pattern (Proyectado)**: Para futuras integraciones externas como MercadoPago o ChileExpress, unificando la respuesta a un formato interno de Antigravity.
5. **Decorator Pattern**: Implementado a través del HOF (Higher Order Function) `withApiHandler` y `RoleGuard`, para decorar los handlers y componentes con lógica de manejo de errores y autorización.

---

## 8. Optimización de Complejidad O(1) y Rendimiento

El núcleo comercial B2B ha sido refactorizado para eliminar ineficiencias matemáticas:

- **Motor de Precios O(1)**: Se reemplazaron bucles O(N*M) (`find` dentro de `map`) por el uso de **HashMaps** (`Map` de JS). Al cargar listas de precios, se indexan por `productId`, lo que permite una resolución instantánea de precios en tiempo O(1) para catálogos masivos.
- **Evacuación de N+1**: En el servicio de pedidos (`order.service.ts`), las reducciones y restauraciones de stock dentro de transacciones se migraron de iteraciones secuenciales a procesamiento concurrente mediante `Promise.all()`, maximizando el rendimiento de I/O de la DB.

---

## 9. Seguridad Avanzada y SEO Defensivo

El dashboard privado implementa políticas de seguridad modernas:

- **JWT Ciclo de Vida Corto**: El `refresh_token` fue reducido de 30 días a **1 día (24 horas)**. Esto fuerza a los usuarios B2B a re-autenticarse diariamente, mitigando el riesgo de sesiones persistentes comprometidas.
- **Cabeceras Estrictas (Security Headers)**: A través de `next.config.ts`, se fuerzan cabeceras `HSTS`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (anti-clickjacking), y políticas de referenciador.
- **Protección de Borde (Middleware)**: La seguridad de rutas migró a `middleware.ts` operando en el Edge Runtime de Next.js, rechazando accesos no autorizados antes de que toquen el servidor Node.js.
- **SEO Defensivo**: La raíz del dashboard privado exporta metadatos `robots: { index: false, follow: false }`, previniendo que motores de búsqueda (Google, Bing) indexen información confidencial corporativa (listas de clientes, facturación).

---

### `lib/auth.ts` — Autenticación JWT

| Función | Descripción |
|---|---|
| `signAccessToken(payload)` | Genera JWT de corta duración (default 1h) |
| `signRefreshToken(userId)` | Genera JWT de 30 días |
| `verifyToken(token)` | Verifica y decodifica un JWT. Lanza `UnauthorizedError` si es inválido |
| `extractUserFromRequest(req)` | Extrae el usuario del header `Authorization: Bearer` |
| `requireRole(user, roles[])` | Lanza `ForbiddenError` si el rol no está en la lista permitida |

**Ejemplo de uso en una ruta protegida:**
```typescript
export const POST = withApiHandler(async (req) => {
  const user = extractUserFromRequest(req);  // lanza 401 si no hay token
  requireRole(user, [UserRole.ADMIN]);       // lanza 403 si no es ADMIN
  // ... lógica
});
```

---

### `lib/errors.ts` — Jerarquía de Errores

```
AppError (clase base)
├── ValidationError    → HTTP 400  | Código: VALIDATION_ERROR
├── UnauthorizedError  → HTTP 401  | Código: UNAUTHORIZED
├── ForbiddenError     → HTTP 403  | Código: FORBIDDEN
├── NotFoundError      → HTTP 404  | Código: NOT_FOUND
├── ConflictError      → HTTP 409  | Código: CONFLICT
├── BusinessRuleError  → HTTP 422  | Código: BUSINESS_RULE_VIOLATION
└── InternalError      → HTTP 500  | Código: INTERNAL_ERROR
```

**Uso:**
```typescript
throw new NotFoundError("Producto", productId);
// → { code: "NOT_FOUND", message: "Producto con id 'cuid...' no encontrado" }

throw new BusinessRuleError("Stock insuficiente", "INSUFFICIENT_STOCK");
// → { code: "INSUFFICIENT_STOCK", message: "Stock insuficiente" }
```

---

### `validations/company.schemas.ts` — RUT Chileno

Incluye validación del RUT usando el **algoritmo Módulo 11** (el mismo que usa el SII).

**El `RutSchema` acepta múltiples formatos y los normaliza:**
```
"12.345.678-9"  → "12345678-9"  ✅ normalizado
"12345678-9"    → "12345678-9"  ✅ ya normalizado
"12345678-k"    → "12345678-K"  ✅ DV en mayúscula
"123456789"     → "12345678-9"  ✅ agrega guión automáticamente
"11111111-1"    →  ❌ ZodError: DV incorrecto
```

**Formato de almacenamiento en DB:** siempre `XXXXXXXX-D` (sin puntos, con guión, DV en mayúscula).

**Ejemplo de error de validación en el Frontend:**
Dado que el RUT chileno es un punto crítico de fricción para usuarios B2B, cuando un usuario ingresa un RUT inválido (ej: `11111111-1`), Zod lanza un error que el API formatea así:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación en los datos enviados",
    "details": [
      {
        "path": ["rut"],
        "message": "El Dígito Verificador del RUT no es válido"
      }
    ]
  }
}
```

---

## 8. Sistema de Roles

| Rol | Descripción | Accesos |
|---|---|---|
| `ADMIN` | Administrador del sistema | Todo sin restricciones |
| `SALES_REP` | Agente comercial / vendedor | Gestiona pedidos de cualquier empresa |
| `BUYER` | Comprador de una empresa | Solo ve y crea pedidos de **su propia empresa** |

**Restricciones automáticas por rol:**
- `GET /api/products` — BUYER solo recibe precios de su empresa; ADMIN puede consultar precios de otra empresa con `?companyId=`
- `GET /api/orders` — BUYER solo ve pedidos de su empresa
- `POST /api/orders` — BUYER no puede crear pedidos para otras empresas (lanza 403)
- `POST /api/products` — Solo ADMIN puede crear productos

---

## 9. Motor de Precios B2B

El `PriceService` determina el precio que ve cada empresa usando una **jerarquía excluyente** (no acumulativa). El primer nivel que coincida bloquea a los inferiores:

```
1. OUTLET (Categoría)  → Si el producto es Outlet, usa Precio Base sin descuentos.
2. Lista COMPANY/GRAL  → Precios fijos manuales asignados a la empresa o generales.
3. PROMOTION (Oferta)  → Reglas por Marca o Categoría (ej: 15% en Hand).
4. Customer Discount   → Descuento % manual asignado en la ficha de la Empresa.
5. Base Price          → Fallback final (Precio base del catálogo).
```

> **Nota**: Las promociones y los descuentos de cliente **no se suman**. Si hay una promoción activa de marca, se ignorará el descuento base del cliente para ese producto.

**Información de Empaque:**
El objeto `price` incluye ahora:
- `unit`: Unidad de medida (ej: "UN", "KG").
- `inner`: Cantidad de unidades por empaque (ej: 12 para una caja de docena).
Esto permite al front-end mostrar mensajes como "Precio por unidad de empaque (Caja de 12)".

**Cálculo del precio final (con IVA Chile 19%):**
```
Precio neto lista:      $1.000
Descuento ítem:          -5%
Descuento global lista:  -5%
─────────────────────────────
Descuento total:         -10%
Precio neto c/descuento: $900
IVA 19%:                 +$171
═════════════════════════════
Precio bruto final:      $1.071
```

**Optimización de queries:** el servicio carga todas las listas aplicables a una empresa en **una sola query** y luego calcula precios en memoria. No hay problema N+1 al listar productos. *(Consideración de Escabilidad: Si el catálogo crece a miles de productos, el filtrado y cálculo por lotes en memoria podría impactar la RAM del servidor; en ese escenario futuro, se recomienda delegar el cálculo a una vista materializada o a nivel de base de datos).*

El campo `priceSource` en la respuesta indica qué regla se aplicó:
```
"OUTLET"         → El producto es de categoría Outlet (sin descuentos)
"COMPANY_LIST"   → Precio personalizado manual
"GENERAL_LIST"   → Precio de lista general manual
"PROMOTION"      → Se aplicó una oferta por Marca o Categoría
"BASE_PRICE"     → Se usó el precio base (con o sin descuento de cliente)
```

---

## 10. Direcciones de Envío (ChileExpress)

Para asegurar la compatibilidad con operadores logísticos como ChileExpress, el sistema utiliza direcciones estructuradas.

### Validación de Geografía
No se permite texto libre para Región y Comuna. Se debe utilizar la lista oficial provista por la API:
*   **Endpoint:** `GET /api/shipping/regions`
*   **Origen:** `src/lib/chile-data.ts` (basado en estándares de ChileExpress y el SII).

### Formato de Dirección
Al crear un pedido (`POST /api/orders`), el objeto `shippingAddress` debe contener:
- `region`: Nombre exacto de la región.
- `comuna`: Nombre exacto de la comuna.
- `street`: Nombre de la calle.
- `number`: Numeración domiciliaria.
- `apartment`: (Opcional) Departamento, oficina o bodega.
- `details`: (Opcional) Referencias adicionales.

---

## 11. Flujo de un Pedido

El siguiente diagrama de secuencia ilustra cuándo se validan las reglas de negocio, cuándo se reserva el stock y en qué momento se afecta la línea de crédito B2B.

```mermaid
sequenceDiagram
    actor Buyer as Comprador B2B
    participant API as POST /api/orders
    participant DB as Prisma (Transacción)
    
    Buyer->>API: Enviar payload con items y dirección
    
    rect rgb(30, 30, 30)
        Note over API: Validaciones de Negocio
        API->>API: Verificar sesión y rol
        API->>API: Validar cantidad mínima (MOQ)
        API->>API: Calcular precios (PriceService)
        API->>API: Validar límite de crédito
    end
    
    alt Falla validación (Ej: Sin crédito)
        API-->>Buyer: 422 CREDIT_LIMIT_EXCEEDED
    else Validaciones OK
        API->>DB: Iniciar Transacción Atómica
        
        rect rgb(20, 50, 20)
            Note over DB: Escritura y Reserva
            DB->>DB: Generar orderNumber (ORD-YYYY-NNNN)
            DB->>DB: Insertar Order y OrderItems (snapshot precio)
            DB->>DB: Decrementar stockQuantity
            DB->>DB: Incrementar creditUsed (Empresa)
        end
        
        DB-->>API: Transacción Exitosa
        API-->>Buyer: 201 Created (Pedido DRAFT/PENDING)
    end
```

### Ciclo de vida y Cancelación
1. **Estados válidos del pedido:**
      `DRAFT` → `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`
2. **Al CANCELAR o RECHAZAR un pedido:**
      - Restaura el stock de todos los productos.
      - Reduce el `creditUsed` de la empresa.
      - El pedido queda guardado para fines de analítica.

3. **Al REACTIVAR un pedido:**
      - Se permite pasar de `CANCELLED` o `REJECTED` de vuelta a `DRAFT`.
      - Se re-aplica el efecto de reserva de stock y uso de crédito.

4. **Edición de Borradores (`DRAFT`):**
      - Se permite la edición total de ítems, cantidades y precios.
      - El sistema realiza un "diff" automático: revierte los efectos del estado anterior y aplica los nuevos, asegurando que el stock nunca quede inconsistente.

---

---

## 12. Errores y Códigos HTTP

| Código HTTP | Código de Error | Cuándo ocurre |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body o params con formato incorrecto (Zod) |
| 401 | `UNAUTHORIZED` | Sin token, token inválido o credenciales incorrectas |
| 403 | `FORBIDDEN` | Token válido pero sin permisos para esa acción |
| 404 | `NOT_FOUND` | Recurso no encontrado en DB |
| 409 | `CONFLICT` | Recurso duplicado (ej: RUT ya registrado) |
| 422 | `INSUFFICIENT_STOCK` | No hay stock suficiente |
| 422 | `MIN_ORDER_QUANTITY` | Cantidad menor al mínimo del producto |
| 422 | `CREDIT_LIMIT_EXCEEDED` | La empresa superó su límite de crédito |
| 422 | `INVALID_STATUS_TRANSITION` | Transición de estado de pedido no permitida |
| 500 | `INTERNAL_ERROR` | Error inesperado del servidor |

---

## 13. Integración Mercado Pago (Pendiente)

El archivo `src/services/payment.service.ts` es el punto de entrada para la integración futura.

**Para implementar, necesitarás:**

1. Instalar el SDK:
   ```bash
   npm install mercadopago
   ```

2. Agregar al `.env`:
   ```env
   MP_ACCESS_TOKEN="APP_USR-xxxxxxxxxxxxxxxxxxxx"
   MP_PUBLIC_KEY="APP_USR-xxxxxxxxxxxxxxxxxxxx"
   MP_WEBHOOK_SECRET="tu-secreto-de-webhook"
   ```

3. Implementar los métodos en `PaymentService`:
   - `createPreference(orderId)` — Crea preferencia de pago y retorna URL de checkout
   - `getPaymentStatus(paymentId)` — Consulta estado de un pago
   - `processWebhook(payload, signature)` — Recibe notificaciones de MP y actualiza `Order.paymentStatus`
   - `refundPayment(paymentId, amount?)` — Emite reembolso total o parcial

4. Crear el endpoint webhook:
   ```
   POST /api/webhooks/mercadopago
   ```
   Y registrarlo en el [panel de Mercado Pago](https://www.mercadopago.cl/developers/panel/notifications/webhooks).

**Documentación oficial:**
- https://www.mercadopago.cl/developers/es/docs
- https://github.com/mercadopago/sdk-nodejs

---

---

## 14. Herramientas de API (Postman / Swagger)

Para facilitar el desarrollo y consumo de la API, se recomienda la utilización de herramientas de testeo. Dado que el proyecto define sus validaciones estrictamente en Zod (`src/validations/*`), se puede generar automáticamente una especificación OpenAPI/Swagger.

**Generación Automática (Recomendado):**
Mediante el uso de la librería `zod-to-openapi` se puede generar un archivo `swagger.json` que documente todos los esquemas, endpoints y respuestas esperadas de la API, para posteriormente ser consumido desde una interfaz interactiva de Swagger UI alojada en `GET /api/docs`.

**Importación Manual (Postman/Insomnia):**
Para pruebas rápidas sin configurar OpenAPI, puedes generar una colección estructurada de la siguiente forma e importarla a Postman o Insomnia:

1. Crea variables de entorno globales: `{{BASE_URL}}` (ej: `http://localhost:3000`) y `{{ACCESS_TOKEN}}`.
2. Para el endpoint `POST /api/auth/login`, configura una prueba (Test) automática en Postman para capturar el token y guardarlo en la variable:
   ```javascript
   let res = pm.response.json();
   if (res.success && res.data.access_token) {
       pm.environment.set("ACCESS_TOKEN", res.data.access_token);
   }
   ```
3. En la colección global, ve a la pestaña *Authorization*, selecciona tipo `Bearer Token` e introduce la variable `{{ACCESS_TOKEN}}`. Esto inyectará el token automáticamente en todas las peticiones posteriores (`GET /api/products`, `POST /api/orders`, etc.).

---

---

## 13. Administración de Clientes (Customers)

El sistema de gestión de clientes permite administrar las entidades legales (**Companies**) con las que opera el B2B.

### Características Principales
- **Validación de RUT Chileno**: Normalización automática (XXXXXXXX-D) y validación de dígito verificador mediante algoritmo Módulo 11.
- **Condiciones Comerciales**: Asignación de **descuento base (%)** que afecta a todos los pedidos de la empresa y plazos de pago (payment terms).
- **Direcciones Múltiples**: Diferenciación entre Casa Matriz, Dirección de Despacho y Dirección de Facturación.
- **Relación con Usuarios**: Visualización de todos los usuarios vinculados a una cuenta corporativa.

### Endpoints
- `GET /api/customers`: Listado con buscador por Razón Social, RUT o Fantasía.
- `POST /api/customers`: Creación de nueva empresa (Solo ADMIN).
- `PATCH /api/customers/[id]`: Actualización de condiciones comerciales y direcciones.
- `DELETE /api/customers/[id]`: Desactivación lógica del cliente.

### DRY Patterns Aplicados
- **Hooks Reutilizables**: `useCustomers` y `useCustomer` encapsulan toda la lógica de servidor.
- **Formularios Modulares**: `CustomerForm` utiliza `React Hook Form` con validación Zod centralizada en `company.schemas.ts`.
- **UI Consistente**: Uso de la paleta Zinc/Primary y componentes de tabla compartidos.

---

## 16. Gestión de Pedidos Avanzada

Se han implementado herramientas críticas para la operación diaria del equipo de ventas y logística.

### Búsqueda y Filtrado
- **Buscador (Debounced)**: Implementado en el frontend con un retraso de 400ms para optimizar el tráfico de red. Busca por `orderNumber` o `company.razonSocial`.
- **Filtros Temporales**: Uso de parámetros `from` y `to` en la API para consultas por rango de fecha.
- **Paginación Dinámica**: Ajustada a **10 items por página** por defecto para mejorar la legibilidad en pantallas de laptops.

### Integridad de Datos (Transaccional)
Todas las operaciones críticas se ejecutan dentro de `prisma.$transaction`.
- Si falla la actualización de stock, se revierte la creación del pedido.
- Si la edición de un borrador excede el nuevo límite de crédito, la transacción falla y los datos originales se mantienen intactos.

### Herramientas de Desarrollo (Mocks)
Para pruebas de carga y visualización, se incluye el script `scratch/seed_orders.js` que genera 20+ pedidos con fechas y estados variados, permitiendo validar el correcto funcionamiento de los filtros de analítica.

---

## 17. Módulo de Analytics (Inteligencia de Negocio)

El módulo de Analytics proporciona una visión estratégica del rendimiento comercial, consolidando datos de pedidos y clientes en visualizaciones interactivas.

### Arquitectura del Módulo
Fiel a la **Clean Architecture**, el módulo se divide en:
- **`AnalyticsService` (Dominio)**: Realiza cálculos complejos, agregaciones SQL y comparativas de periodos (Growth %).
- **`GET /api/analytics` (Infraestructura)**: Expone los datos con protección de roles (`ADMIN` y `SALES_REP`).
- **`useAnalytics` (Presentación/Hook)**: Gestiona el estado del servidor y la caché.

### Métricas Calculadas
1. **Resumen de Ventas**: Ingresos totales, Ticket Promedio y Crecimiento Mensual (comparativa 30d vs 30d previos).
2. **Tendencia Diaria**: Agregación por `DATE_TRUNC` para visualizar la curva de ventas.
3. **Distribución Operativa**: Conteo de pedidos por estado (`DRAFT`, `PENDING`, etc.) para identificar cuellos de botella logísticos.
4. **Ranking de Clientes**: Identificación de las 5 empresas con mayor facturación.

### Visualización Premium
Se utiliza **Recharts** con una personalización estética orientada al "Dark Mode" de Antigravity:
- **Áreas Dinámicas**: Gráficos con gradientes de color primario.
- **Resúmenes Numéricos**: Los gráficos incluyen tablas de resumen inferiores para evitar la sobrecarga visual de etiquetas internas, permitiendo una lectura rápida de los valores exactos.
- **Formateo Regional**: Todas las cifras monetarias se procesan con `Math.round` y `toLocaleString('es-CL')` para cumplir con el estándar chileno.

---

## 18. Roadmap y Próximos Pasos

- [x] **Gestión de Pedidos Avanzada:** Edición de borradores y ciclo de vida transaccional.
- [x] **Analytics Dashboard:** Visualización de ventas y KPIs.
- [ ] **Predicción de Demanda (ML):** Integración de microservicio Python para forecasting.
- [ ] **Reportes en PDF/Excel:** Generación de documentos tributarios y listas de picking.
- [ ] **Portal del Cliente (BUYER):** Dashboard simplificado para que el cliente vea su propio historial y cupo disponible.

---

## 19. Optimización del Menú de Categorías (JSON Estático)

Para garantizar un rendimiento óptimo del frontend y evitar consultas redundantes a la base de datos, el menú lateral (Mega-Menú) de cabecera lee las categorías de forma estática en lugar de consultar la API en tiempo de ejecución.

### Detalles de la Optimización:
- **Origen de datos**: `src/components/layout/categories.json`.
- **Ventaja**: Reducción de latencia a **cero**. El menú lateral se despliega al instante al hacer clic sin spinners ni consultas de red.
- **Sincronización**: Cuando se crean o modifican categorías en la base de datos (por ejemplo, a través del panel de administración), se debe regenerar el archivo estático utilizando el script de exportación:
  ```bash
  npx tsx scratch/export-categories.ts
  ```
- **Estructura visual**: El menú está diseñado como una barra lateral fija (`fixed top-[77px] left-0 bottom-0`) con las categorías padres destacadas en negrita y las subcategorías en el panel derecho en formato de lista de texto gris sobre fondo blanco.

