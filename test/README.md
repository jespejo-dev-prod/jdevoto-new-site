# Documentación de Pruebas Unitarias y de Integración (Vitest)

Este directorio contiene el suite completo de pruebas automatizadas (unitarias y de integración) diseñado para validar las reglas de negocio, los controles de seguridad y la interfaz de usuario de la plataforma B2B.

---

## 🚀 Cómo Ejecutar las Pruebas

Para ejecutar el conjunto de pruebas en tu entorno local, utiliza los siguientes comandos:

*   **Ejecutar una vez (Modo CI/Producción):**
    ```bash
    npm run test
    ```
*   **Ejecutar en modo interactivo (Watch mode - Desarrollo):**
    ```bash
    npm run test:watch
    ```

---

## 📊 Resumen de Cobertura de Pruebas (54 Tests Aprobados)

Todas las pruebas se ejecutan utilizando **Vitest** con el entorno de simulación **jsdom** para el frontend, y mocks atómicos y aislados de la base de datos (Prisma) para el backend.

### I. Pruebas de Backend y Reglas de Negocio (46 Tests)

#### 1. Importación Masiva de Stock y Precios (`test/backend/import-stock.test.ts`)
Valida el endpoint de actualización masiva por lote (`POST /api/products/import-stock`):
*   **Restricción de Rol:** Rechaza peticiones si el usuario no es `ADMIN`.
*   **Mensaje Vacío:** Retorna el mensaje de control correspondiente si no se envían datos.
*   **Filtro de Datos Inválidos:** Valida con Zod y añade los elementos inválidos a la lista de fallos.
*   **Acolchado de SKU:** Busca y actualiza SKUs numéricos cortos acolchándolos automáticamente con ceros a 7 dígitos (ej: "1234" a "0001234").
*   **Actualizaciones Parciales:** Permite actualizar solo el stock, solo el precio, o ambos simultáneamente de manera exitosa.

#### 2. Chat y Adjuntos de Pedidos (`test/backend/chat-messages.test.ts`)
Valida la comunicación y carga de documentos de pago en las órdenes (`POST/GET /api/orders/[id]/messages`):
*   **Pertenencia de Pedido:** Bloquea a compradores que intenten escribir o leer mensajes de pedidos de otras empresas.
*   **Permiso Administrativo:** Permite a los administradores leer y escribir mensajes en cualquier pedido.
*   **Existencia de Orden:** Retorna un error `404` si la orden no existe en la base de datos.
*   **Restricción de Archivos:** Valida que solo se puedan subir documentos e imágenes en formato **PDF**, **JPG** y **PNG** (bloqueando formatos peligrosos como `.exe`).

#### 3. CRUD del Catálogo Comercial (`test/backend/catalog-crud.test.ts`)
Prueba el caso de uso de creación de productos (`createProductUseCase`):
*   **Restricción de Rol:** Valida que solo usuarios `ADMIN` o `SALES_REP` puedan dar de alta productos.
*   **Unicidad de SKU y Slug:** Rechaza la creación y lanza un `ConflictError` si el SKU o el slug del producto ya existen.
*   **Dimensiones Físicas:** Crea correctamente el producto persistiendo peso y medidas (alto, ancho, largo, unidades inner).

#### 4. Motor de Precios B2B y Despacho (`test/backend/pricing-despacho.test.ts`)
Verifica la jerarquía comercial de precios y fletes:
*   **Jerarquía de Precios:** Aplica la prioridad correcta de asignación: Outlet (sin descuentos) > Listas de Precios (empresa o general) > Promociones activas (categoría o marca) > Fallback de precio base.
*   **Subtotal Mínimo:** Rechaza la creación de un pedido si su subtotal neto final es inferior a $100.000 CLP.
*   **Restricciones de Despacho:**
    *   Excluye el flete gratuito (Flete Incluido) para territorio insular (Juan Fernández e Isla de Pascua).
    *   Valida los mínimos de flete gratuito: RM/Valparaíso ($100.000 netos), Extremo Norte ($500.000 netos) y Extremo Sur ($1.000.000 netos).

#### 5. Cuenta Corriente y Línea de Crédito (`test/backend/cuenta-corriente.test.ts`)
Valida la consistencia de crédito de los clientes B2B:
*   **Límite de Crédito:** Bloquea la confirmación de pedidos que excedan el límite de crédito disponible.
*   **Consumo de Crédito:** Aumenta el crédito utilizado (`creditUsed`) de la empresa en el valor bruto del pedido al crearse con método `credit_b2b`.
*   **Liberación de Crédito:** Resta el valor del pedido de `creditUsed` cuando la orden pasa a estado `CANCELLED` o `REJECTED`.

#### 6. Gestión de Equipo Interno de Clientes (`test/backend/user-management.test.ts`)
Prueba las reglas de acceso y restricciones del rol `COMPANY_ADMIN`:
*   **Filtrado de Usuarios:** Valida que `COMPANY_ADMIN` solo liste usuarios pertenecientes a su empresa.
*   **Restricción de Rol en Creación:** Bloquea la creación de roles administrativos (`ADMIN` / `COMPANY_ADMIN`) por parte de administradores de cliente.
*   **Consistencia de Empresa:** Asegura que se fuerce el `companyId` del creador al dar de alta nuevos usuarios.
*   **Edición y Borrado:** Bloquea operaciones sobre perfiles de usuarios de otras empresas B2B.

#### 7. Procesamiento de Webhooks de Mercado Pago (`test/backend/payment-webhook.test.ts`)
Valida la seguridad y llamadas del endpoint de conciliación automatizada (`POST /api/webhooks/mercadopago`):
*   **Verificación HMAC:** Exige cabeceras válidas y firma SHA256 sobre el manifest cuando `MP_WEBHOOK_SECRET` está activo.
*   **Gestión de Errores de Firma:** Retorna `403 Forbidden` ante firmas alteradas o ausentes.
*   **Procesamiento Exitoso:** Envía el payload a `paymentService.processWebhook` y retorna `200 OK` para confirmar recepción.

#### 8. Reglas de Validación de Empaque Comercial (`test/backend/packaging-validation.test.ts`)
Verifica el cumplimiento de restricciones de empaque físico en órdenes de compra:
*   **Mínimo de Compra (`minOrderQty`):** Rechaza compras inferiores al mínimo establecido por producto.
*   **Múltiplos de Compra (`inner`):** Exige que la cantidad del ítem coincida estrictamente con múltiplos de su caja o empaque mínimo.

#### 9. Modificación de Crédito Manual (`test/backend/customer-api.test.ts`)
Valida la seguridad de actualización de límites financieros en `/api/customers/[id]`:
*   **Bloqueo de Modificación Financiera:** Deniega a `COMPANY_ADMIN` el cambio de `creditLimit` o `defaultDiscount`.
*   **Permiso Administrativo:** Permite únicamente a usuarios con rol `ADMIN` modificar los cupos financieros y descuentos comerciales de los clientes.

---

### II. Pruebas de Frontend y Componentes React (8 Tests)

#### 1. Formulario de Edición de Producto (`test/frontend/product-form.test.tsx`)
*   **ShippingTab:** Verifica la presencia de los campos de medidas físicas (Peso en kg y dimensiones L x A x H).
*   **InventoryTab:** Asegura el renderizado de los campos de Stock Actual, Aviso de Stock Bajo y Empaque Mínimo (Unidades Inner).

#### 2. Portal de Cuenta Corriente (`test/frontend/cuenta-corriente-view.test.tsx`)
*   Valida el renderizado correcto del resumen financiero (Cupo Autorizado, Crédito Utilizado y Crédito Disponible).
*   Verifica la visualización de la lista de facturas pendientes con sus correspondientes montos.

#### 3. Componente de Carga de Planilla (`test/frontend/excel-upload.test.tsx`)
*   **Carga Inicial:** Renderiza correctamente la zona de arrastrar archivos y el título.
*   **Validación de Formato:** Muestra el mensaje de error "Formato de archivo no válido" al subir extensiones incorrectas (ej: `.pdf`).
*   **Mapeo de Columnas:** Sube correctamente un CSV ficticio y avanza a la pantalla de asignación de columnas al hacer clic en "Continuar".

#### 4. Chat y Envío de Facturas (`test/frontend/chat-view.test.tsx`)
*   **Historial:** Renderiza los mensajes existentes y sus adjuntos descargables.
*   **Envío Interactiva:** Permite escribir en el textarea, asociar un archivo PDF y simula la llamada exitosa por POST.

---

## 🛠️ Archivos de Configuración del Suite

*   **[vitest.config.ts](file:///c:/Users/jespejo/.gemini/antigravity/scratch/vitest.config.ts):** Inicializa Vitest, habilita las variables globales y el entorno `jsdom`, e inyecta alias de ruta `@/*`.
*   **[test/setup.ts](file:///c:/Users/jespejo/.gemini/antigravity/scratch/test/setup.ts):** Define variables dummy de entorno para JWT y base de datos, y mockea las utilidades de ruteo de Next.js.
