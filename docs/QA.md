# Procedimientos de QA — JDevoto B2B Platform

> Documento de referencia para el equipo de desarrollo.
> Última actualización: Agosto 2026

---

## 1. Checklist Pre-Deploy

Antes de desplegar cualquier cambio a producción, verificar **todos** los puntos:

### Código
- [ ] `npm run test` — Todos los tests unitarios pasan (0 fallos)
- [ ] `npm run build` — Build de producción compila sin errores ni warnings críticos
- [ ] `npx eslint src/` — Sin errores de lint (warnings tolerables)
- [ ] No hay `console.log` en código de producción (solo `console.error` para errores legítimos)
- [ ] No hay credenciales, tokens o secrets hardcodeados en el código

### Variables de Entorno
- [ ] `DATABASE_URL` apunta a la base de datos correcta (producción vs staging)
- [ ] `JWT_SECRET` y `JWT_REFRESH_SECRET` son diferentes y fuertes (≥40 caracteres)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` es el token de producción (no el de sandbox)
- [ ] `ADMIN_NOTIFICATION_EMAIL` está configurado
- [ ] `RESEND_API_KEY` está configurado para emails transaccionales

### Base de Datos
- [ ] Migraciones de Prisma aplicadas (`npx prisma migrate deploy`)
- [ ] Prisma Client regenerado (`npx prisma generate`)
- [ ] Sin migraciones pendientes sin aplicar

---

## 2. Test Suite

### Ejecución de Tests

```bash
# Correr todos los tests
npm run test

# Correr tests con reporte de coverage
npm run test:coverage

# Correr tests en modo watch (desarrollo)
npm run test:watch

# Correr un archivo específico
npx vitest run test/backend/pricing-despacho.test.ts
```

### Estructura de Tests

```
test/
├── setup.ts                        # Configuración global (mocks de Next.js, env vars)
├── backend/                        # Tests de lógica de negocio y APIs
│   ├── auth-login.test.ts          # Flujo de autenticación
│   ├── auth-jwt.test.ts            # JWT y control de roles
│   ├── catalog-crud.test.ts        # CRUD de productos
│   ├── chat-messages.test.ts       # Chat de pedidos
│   ├── cuenta-corriente.test.ts    # Crédito B2B
│   ├── customer-api.test.ts        # API de clientes
│   ├── import-stock.test.ts        # Importación masiva
│   ├── order-status-transitions.test.ts # Máquina de estados de pedidos
│   ├── packaging-validation.test.ts     # Reglas de empaque
│   ├── payment-webhook.test.ts     # Webhooks de MercadoPago
│   ├── pricing-despacho.test.ts    # Motor de precios y flete
│   ├── user-management.test.ts     # Gestión de usuarios
│   ├── zod-validations.test.ts     # Schemas de validación
│   └── lib-utils.test.ts           # Utilidades compartidas
└── frontend/                       # Tests de componentes React
    ├── cart-context.test.tsx        # Carrito de compras
    ├── chat-view.test.tsx          # Vista de chat
    ├── cuenta-corriente-view.test.tsx # Vista de cuenta corriente
    ├── excel-upload.test.tsx        # Subida de Excel
    ├── order-status-badge.test.tsx  # Badge de estados
    ├── product-form.test.tsx        # Formulario de productos
    └── role-guard.test.tsx          # Guard de roles
```

### Métricas de Coverage

El reporte de coverage se genera en `./coverage/` al ejecutar `npm run test:coverage`.
Abrir `coverage/index.html` en el navegador para ver el reporte detallado.

---

## 3. Regresión Manual — Flujos Críticos

Antes de cada release mayor, verificar manualmente estos flujos:

### 3.1 Autenticación
| # | Paso | Resultado Esperado |
|---|------|-------------------|
| 1 | Login con email y contraseña válidos | Redirige al dashboard con sesión activa |
| 2 | Login con contraseña incorrecta | Muestra error "Credenciales inválidas" |
| 3 | Login con usuario desactivado | Muestra error "Credenciales inválidas" |
| 4 | Refresh token tras 1 hora | Token se renueva automáticamente sin cerrar sesión |

### 3.2 Pedido B2B con Crédito
| # | Paso | Resultado Esperado |
|---|------|-------------------|
| 1 | Agregar productos al carrito | Productos aparecen con precio correcto (lista/promo/base) |
| 2 | Seleccionar pago "Crédito Directo B2B" | Muestra crédito disponible y aplica descuento por plazo |
| 3 | Confirmar pedido dentro del cupo | Pedido se crea, `creditUsed` incrementa |
| 4 | Intentar pedido que excede cupo | Muestra error "Límite de crédito insuficiente" |
| 5 | Cancelar pedido con crédito | `creditUsed` se decrementa, stock reservado se libera |

### 3.3 Pago Online (MercadoPago)
| # | Paso | Resultado Esperado |
|---|------|-------------------|
| 1 | Seleccionar pago online en checkout | Redirige a MercadoPago |
| 2 | Completar pago en MercadoPago | Webhook actualiza estado a PAID/CONFIRMED |
| 3 | Pago desde Cuenta Corriente | Genera preferencia de pago y redirige correctamente |

### 3.4 Motor de Precios
| # | Paso | Resultado Esperado |
|---|------|-------------------|
| 1 | Producto en categoría Outlet | Muestra precio base sin descuento |
| 2 | Producto con lista de precios de empresa | Muestra precio de la lista |
| 3 | Producto con promoción activa (marca/categoría) | Aplica descuento de promoción |
| 4 | Producto sin lista ni promo | Muestra precio base |

### 3.5 Gestión de Usuarios (COMPANY_ADMIN)
| # | Paso | Resultado Esperado |
|---|------|-------------------|
| 1 | COMPANY_ADMIN lista usuarios | Solo ve usuarios de su empresa |
| 2 | COMPANY_ADMIN intenta crear ADMIN | Rechazado con error 403 |
| 3 | COMPANY_ADMIN modifica crédito | Rechazado con error 403 |

---

## 4. Smoke Tests Post-Deploy

Ejecutar inmediatamente después de cada deploy a producción:

```bash
# 1. Verificar que la API responde
curl -s https://tu-dominio.cl/api/auth/me | head -5

# 2. Verificar que los productos cargan
curl -s https://tu-dominio.cl/api/products?limit=1 | head -5

# 3. Verificar que el build está activo
curl -s -o /dev/null -w "%{http_code}" https://tu-dominio.cl
# Esperado: 200

# 4. Verificar la documentación de API
curl -s -o /dev/null -w "%{http_code}" https://tu-dominio.cl/api-docs
# Esperado: 200
```

---

## 5. Criterios de Aceptación para Release

Un release se considera **listo para producción** cuando:

1. ✅ **Todos los tests automáticos pasan** (0 fallos, 0 skipped)
2. ✅ **Build de producción compila** sin errores
3. ✅ **Flujos críticos** verificados manualmente (sección 3)
4. ✅ **Smoke tests** post-deploy exitosos (sección 4)
5. ✅ **Sin regresiones** en funcionalidad existente
6. ✅ **Variables de entorno** de producción configuradas correctamente

---

## 6. Runbook de Incidentes

### Error: Webhook de MercadoPago no procesa pagos
1. Verificar que `MERCADOPAGO_ACCESS_TOKEN` está configurado en Vercel
2. Revisar logs de Vercel: `vercel logs --filter=webhooks`
3. Verificar que el endpoint `/api/webhooks/mercadopago` está accesible públicamente
4. Confirmar que la URL de webhook está configurada en el panel de MercadoPago

### Error: "Cannot connect to database"
1. Verificar que `DATABASE_URL` es correcta
2. Verificar que el pool de conexiones no está agotado (max=10 en prod)
3. Reiniciar el deployment si es necesario: `vercel --prod`

### Error: "JWT_SECRET no está definido"
1. Verificar variables de entorno en Vercel Dashboard
2. Asegurar que `JWT_SECRET` y `JWT_REFRESH_SECRET` están configurados
3. Hacer un nuevo deploy tras configurar las variables

### Error: Crédito de empresa muestra valor incorrecto
1. Verificar en Prisma Studio (`npx prisma studio`) el valor de `creditUsed` de la empresa
2. Cruzar con los pedidos pendientes (`paymentStatus: PENDING`, `paymentMethod: credit_b2b`)
3. Si hay descuadre, recalcular `creditUsed` sumando los `totalGross` de pedidos activos con crédito
