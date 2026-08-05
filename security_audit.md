# Auditoría Completa de Seguridad - JDevoto B2B

*Fecha:* 04 de Agosto, 2026
*Auditor:* Senior Application Security Engineer

---

## 📊 Resumen Ejecutivo

- **Riesgo Global del Proyecto:** 75/100 (Alto - Requiere acción inmediata).
- **Nivel de Madurez de Seguridad:** Nivel 1 (Fundamental). Existen buenas prácticas implementadas (RBAC estricto, abstracción del ORM), pero fallas arquitectónicas en el manejo de registros y Serverless.
- **Probabilidad de Compromiso:** Alta (Debido a vulnerabilidades lógicas explotables externamente).
- **Prioridad de Remediación:** Máxima (Bloqueante para salida a producción).

---

## 🔍 Hallazgos Detallados

### 1. Mass Assignment: Auto-asignación de descuentos corporativos
- **Severidad:** Critical
- **Impacto:** Un atacante puede registrarse públicamente inyectando `"defaultDiscount": 100` en el body del JSON, obteniendo un 100% de descuento automático de por vida en todas sus compras.
- **Riesgo:** Pérdida financiera directa, bypass total de política de precios.
- **Archivo:** `src/app/api/auth/register/route.ts`
- **Línea:** 55 (`defaultDiscount` en `RegisterSchema`).
- **Explicación:** La ruta de registro público expone la propiedad `defaultDiscount` en el validador Zod. El atacante solo necesita usar Postman o cURL para enviar este campo.
- **Evidencia:** `defaultDiscount: z.number().min(0).max(100).default(0)` en `RegisterSchema`.
- **Cómo corregirlo:** Eliminar `defaultDiscount` del `RegisterSchema`. En la transacción de Prisma, forzar explícitamente `defaultDiscount: 0` al crear la empresa.

### 2. Ineffective Rate Limiting (Serverless Bypass)
- **Severidad:** High
- **Impacto:** Los atacantes pueden realizar ataques de fuerza bruta contra el inicio de sesión y la creación masiva de cuentas (DDoS de base de datos) sin ser mitigados.
- **Riesgo:** Compromiso de cuentas (Credential Stuffing) y agotamiento de recursos.
- **Archivo:** `src/proxy.ts`
- **Línea:** 6 (`const rateLimitMap = new Map<string, { count: number, resetAt: number }>();`)
- **Explicación:** Vercel utiliza funciones Edge/Serverless. Cada invocación en frío (Cold Start) o aislamiento concurrente levanta su propia memoria de Node/Edge. El Map en memoria se reiniciará constantemente o no se compartirá entre nodos, volviendo inútil el límite. Además, 1000 requests / 15 min es excesivo.
- **Evidencia:** Uso de variables locales (`Map`) para rate limiting global en un entorno distribuido sin estado.
- **Cómo corregirlo:** Reemplazar el rate limiting en memoria por una solución persistente, preferiblemente usando Upstash Redis (`@upstash/ratelimit`) o Vercel KV. Bajar el límite del `/login` a 5-10 requests por IP cada 15 minutos.

### 3. Cross-Site Scripting (Stored XSS) en Descripción de Producto
- **Severidad:** High
- **Impacto:** Si un administrador con permisos (o un atacante que escale privilegios) inyecta scripts `<script>` o handlers maliciosos (ej. `<img src=x onerror=alert(1)>`) en la descripción del producto, el payload se ejecutará en los navegadores de todos los compradores.
- **Riesgo:** Secuestro de sesión (si se usan cookies no protegidas o localStorage), robo de datos, defacement.
- **Archivo:** `src/app/products/[slug]/page.tsx`
- **Línea:** 348 (`dangerouslySetInnerHTML`)
- **Explicación:** Se inyecta HTML crudo en el DOM de React utilizando `dangerouslySetInnerHTML` basado en un input del usuario (la base de datos) sin sanitización.
- **Evidencia:** `dangerouslySetInnerHTML={{ __html: product.description.replace(...) }}`.
- **Cómo corregirlo:** Implementar la librería `dompurify` (o similar en el servidor como `isomorphic-dompurify`) para limpiar exhaustivamente el string HTML antes de insertarlo.

### 4. Falta de Revocación de Tokens JWT (Session Fixation/Replay)
- **Severidad:** Medium
- **Impacto:** Los tokens JWT viven por 1 hora (Access) y 1 día (Refresh) de forma "stateless". No hay mecanismo de validación contra una "blocklist" o sesión de base de datos.
- **Riesgo:** Si a un administrador se le bajan los permisos o un usuario hace logout, sus tokens existentes seguirán teniendo poder total hasta su vencimiento matemático.
- **Archivo:** `src/lib/auth.ts` y `src/proxy.ts`
- **Línea:** N/A (Defecto arquitectónico)
- **Explicación:** `jwtVerify` en `proxy.ts` solo comprueba la firma matemática.
- **Evidencia:** No hay llamadas a Redis o Prisma en el middleware para comprobar si el JTI o sesión han sido revocados o si el usuario sigue activo.
- **Cómo corregirlo:** Disminuir la vida del `accessToken` a 5-15 minutos. Para eventos críticos (logout, cambio de clave, borrado de usuario), almacenar el `jti` (JWT ID) o ID de usuario en una Blacklist (Redis) y verificar en el middleware. Alternativamente, verificar en la base de datos el campo `isActive` periódicamente.

---

## 🔒 Aspectos Fuertes Auditados (Sin vulnerabilidades directas halladas)

1. **Inyección SQL (A03):** Mitigada eficientemente. No existen llamadas `$queryRawUnsafe`. Todo el I/O pasa por el motor de Prisma que escapa los parámetros.
2. **Broken Access Control e IDOR (Multi-Tenant Escape) (A01):** La estructura del negocio B2B ha implementado robustos chequeos perimetrales. `api/users/[id]` y `api/customers/[id]` correctamente interceptan solicitudes verificando el `companyId`.
3. **Manejo de Errores (Information Disclosure):** La función central de captura en `src/lib/api-handler.ts` silencia correctamente errores desconocidos a genéricos ("Error interno del servidor") y evita escupir stack traces en producción, evitando divulgación de arquitectura a posibles atacantes.
4. **Almacenamiento del Token (XSS exposure):** El token JWT no se almacena de forma persistente en `localStorage`. Se inyecta y mantiene en memoria mediante React Context (`auth-context.tsx`) y un HTTP-Only secure refresh token.

---

## 📋 Checklist Final para Producción

- [ ] (Crítico) Corregir el agujero de Mass Assignment en `/api/auth/register` (Borrar `defaultDiscount`).
- [ ] (Alto) Mudar el Rate Limit de `proxy.ts` de Memoria (Map) a Redis. Ajustar cuotas (Login: 5/15m).
- [ ] (Alto) Añadir `isomorphic-dompurify` a las renderizaciones `dangerouslySetInnerHTML`.
- [ ] (Medio) Implementar invalidación de sesiones en Logout.
- [ ] (Medio) Asegurarse que Next.js Server Actions estén protegidos contra CSRF, y habilitar explícitamente origin-check en la API.
- [ ] (Mejora) Implementar escaneo Snyk/npm-audit en CI/CD Pipeline.
- [ ] (Mejora) Configurar Security Headers estrictos (CSP, HSTS) en `next.config.js`.
