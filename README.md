# Antigravity B2B — Documentación del Proyecto

> Plataforma de comercio mayorista B2B para empresas chilenas.
> Stack: **Next.js 16 · Prisma · PostgreSQL · TypeScript**

---

## 📚 Documentación Adicional

Para más detalles sobre la arquitectura, base de datos y funcionamiento del sistema, consulta los siguientes documentos en la carpeta [docs/](file:///c:/Users/jespejo/.gemini/antigravity/scratch/docs/):

* **[Estructura del Proyecto y Guía de Archivos](file:///c:/Users/jespejo/.gemini/antigravity/scratch/docs/ESTRUCTURA_PROYECTO.md)**: Explicación completa del árbol de directorios y la función de cada archivo del sistema.
* **[Guía de Arquitectura](file:///c:/Users/jespejo/.gemini/antigravity/scratch/docs/ARCHITECTURE.md)**: Detalles sobre el monolito modular, Clean Architecture y flujos de datos.
* **[Casos de Uso Críticos](file:///c:/Users/jespejo/.gemini/antigravity/scratch/docs/USE_CASES.md)**: Explicación paso a paso de los casos de uso (`createProduct`, `PriceService`, etc.).
* **[Documentación Técnica Completa](file:///c:/Users/jespejo/.gemini/antigravity/scratch/docs/DOCUMENTATION.md)**: Setup, instalación, endpoints de API y modelos.
* **[Guía de Componentes](file:///c:/Users/jespejo/.gemini/antigravity/scratch/docs/COMPONENT_GUIDE.md)**: Explicación del funcionamiento de componentes y helpers.
* **[Usuarios de Prueba](file:///c:/Users/jespejo/.gemini/antigravity/scratch/docs/TEST_USERS.md)**: Credenciales e instrucciones para crear usuarios de prueba.

---

## Estructura del Proyecto

```
src/
├── app/                        # Páginas y rutas (Next.js App Router)
│   ├── products/[slug]/        # Detalle de producto (público)
│   ├── dashboard/              # Panel de administración (ADMIN / SALES_REP)
│   ├── cart/                   # Carrito de compras
│   ├── checkout/               # Proceso de pago
│   ├── login / register/       # Autenticación
│   └── api/                    # Route Handlers
│       ├── auth/               # Login, refresh token
│       ├── catalog/price/[slug]  # Precio B2B asíncrono (Opción A)
│       ├── products/           # CRUD de productos
│       ├── orders/             # CRUD de órdenes
│       ├── customers/          # CRUD de empresas/clientes
│       ├── brands/             # CRUD de marcas
│       ├── categories/         # CRUD de categorías
│       ├── analytics/          # Métricas de ventas
│       ├── files/              # Servicio de archivos estáticos
│       └── upload/             # Subida de imágenes
│
├── modules/                    # Lógica de negocio por dominio (Clean Architecture)
│   ├── catalog/
│   │   ├── application/        # Use Cases (orquestadores)
│   │   ├── domain/             # Entidades y contratos
│   │   └── presentation/       # Componentes React del catálogo
│   ├── pricing/
│   │   └── domain/             # Motor de precios B2B (PriceService)
│   ├── orders/
│   ├── customers/
│   ├── auth/
│   ├── analytics/
│   └── billing/
│
├── components/                 # Componentes UI globales reutilizables
│   ├── ui/                     # Primitivos (Button, Input, ProductSlider...)
│   └── layout/                 # Header, Footer públicos y del dashboard
│
├── lib/                        # Utilidades y servicios de infraestructura
│   ├── api-handler.ts          # HOF que envuelve todos los Route Handlers
│   ├── auth.ts                 # requireRole() — autorización por rol
│   ├── client.ts               # Instancia singleton de Prisma
│   ├── errors.ts               # Jerarquía de errores de dominio
│   ├── server-auth.ts          # getServerUser() — lectura del JWT en servidor
│   ├── slugify.ts              # Generación de slugs SEO
│   └── utils.ts                # cn() + serializeDecimal()
│
├── context/                    # React Contexts (CartContext)
├── types/
│   └── domain.ts               # Tipos del dominio (ProductWithPrice, PriceBreakdown, etc.)
└── validations/                # Schemas Zod para validación de entrada
```

---

## Arquitectura

El proyecto sigue **Clean Architecture** con 3 capas por módulo:

```
Presentation (React)  →  Application (Use Cases)  →  Domain (Services + Prisma)
```

- **Presentation**: Componentes React. Solo reciben datos, no llaman a Prisma directamente.
- **Application (Use Cases)**: Orquestan la lógica de negocio. Son las únicas que pueden llamar Services y Prisma.
- **Domain (Services)**: Lógica pura de negocio (ej: cálculo de precios B2B).

---

## Motor de Precios B2B

**Archivo:** `src/modules/pricing/domain/price.service.ts`

El `PriceService` calcula el precio correcto para cada empresa siguiendo esta jerarquía de prioridad:

| Prioridad | Regla | Fuente |
|-----------|-------|--------|
| 1 | Categoría Outlet | `category.isOutlet = true` |
| 2 | Lista de precios empresa | `PriceList type=COMPANY` |
| 3 | Lista de precios general | `PriceList type=GENERAL` |
| 4 | Promoción por marca/categoría | `Promotion` |
| 5 | Descuento por defecto de empresa | `Company.defaultDiscount` |
| 6 | Precio base (fallback) | `Product.basePrice` |

Las listas de precios y promociones se cachean 5 minutos con `unstable_cache` de Next.js.

---

## Patrón "Opción A" — Carga Instantánea con Precio B2B Diferido

La página de producto (`/products/[slug]`) usa un patrón de carga en dos fases:

```
1. Servidor (crítico ~20ms)
   └─ getProductDetailsUseCase(slug)  → 1 query Prisma, sin PriceService
   └─ HTML con precio base + IVA disponible inmediatamente

2. Cliente (background ~100-200ms)
   └─ BuyBox monta → fetch /api/catalog/price/[slug]
   └─ Precio B2B reemplaza precio base silenciosamente
```

Esto elimina el cuello de botella del PriceService en el critical path de renderizado.

---

## Use Cases del Catálogo

| Archivo | Propósito | Llama a PriceService |
|---------|-----------|----------------------|
| `getProductDetails.use-case.ts` | Página de detalle (critical path) | ❌ No (intencional) |
| `getRelatedProducts.use-case.ts` | Sección "Productos Relacionados" | ✅ Sí |
| `getBundleSuggestion.use-case.ts` | Sección "Sugerencia de compra" | ✅ Sí |
| `createProduct.use-case.ts` | Crear producto desde el dashboard | ❌ No |

---

## API Routes

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/login` | Autenticación JWT | — |
| `GET` | `/api/catalog/price/[slug]` | Precio B2B del producto | Opcional |
| `GET/POST` | `/api/products` | Listar / crear productos | ADMIN, SALES_REP |
| `PATCH/DELETE` | `/api/products/[id]` | Editar / eliminar producto | ADMIN |
| `GET/POST` | `/api/orders` | Listar / crear órdenes | Autenticado |
| `GET/PATCH` | `/api/orders/[id]` | Ver / actualizar orden | Autenticado |
| `GET/POST` | `/api/customers` | Listar / crear empresas | ADMIN, SALES_REP |
| `GET/PATCH` | `/api/customers/[id]` | Ver / actualizar empresa | ADMIN, SALES_REP |
| `GET/POST` | `/api/brands` | Listar / crear marcas | ADMIN |
| `GET/POST` | `/api/categories` | Listar / crear categorías | ADMIN |
| `GET` | `/api/analytics` | Métricas de ventas | ADMIN, SALES_REP |
| `POST` | `/api/upload` | Subir imagen | ADMIN, SALES_REP |
| `GET` | `/api/files/[...path]` | Servir archivos estáticos | — |

---

## Convenciones de Código

### DRY — Helpers compartidos

- **`serializeDecimal(obj)`** en `lib/utils.ts`: convierte campos Decimal/BigInt de Prisma a `Number`. Usar siempre al retornar datos de un use case.
- **`withApiHandler(handler)`** en `lib/api-handler.ts`: envuelve todos los Route Handlers. Maneja errores, logging y formato de respuesta.
- **`ok(data)` / `created(data)` / `noContent()`** en `lib/api-handler.ts`: helpers de respuesta HTTP.

### Errores de Dominio

Lanzar desde `lib/errors.ts`. El `withApiHandler` los captura y convierte al código HTTP correcto:

```typescript
throw new NotFoundError("Producto", slug);    // → 404
throw new ConflictError("SKU ya en uso");     // → 409
throw new UnauthorizedError();                // → 401
throw new ValidationError("Inválido", {});   // → 400
```

### Comentarios

- Los comentarios están en **español**.
- Cada función de más de 10 líneas debe tener un JSDoc explicando su propósito.
- Las sub-funciones dentro de un use case deben estar documentadas con su responsabilidad específica.

---

## Scripts

```bash
npm run dev       # Servidor de desarrollo (Turbopack)
npm run build     # Build de producción
npx prisma studio # Explorador de base de datos
npx prisma db push # Sincronizar schema con la BD
```

---

## Variables de Entorno

```env
DATABASE_URL=           # Conexión PostgreSQL
JWT_SECRET=             # Clave para firmar tokens JWT
NEXT_PUBLIC_BASE_URL=   # URL pública del sitio
```