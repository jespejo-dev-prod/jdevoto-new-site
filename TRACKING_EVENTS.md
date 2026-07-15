# Estrategia de Analíticas y Tracking (B2B E-Commerce)

> ⚠️ **ROADMAP / TODO:** Este documento describe la estrategia planificada. Los eventos de tracking aún **no están implementados** en el código. No hay integración con GA4 ni PostHog actualmente. La sección de "Carritos Abandonados" al final sí está implementada via Cron Job.

Este documento detalla los eventos clave (Sales Funnel & User Behavior) que deben medirse en la plataforma (utilizando herramientas como **Google Analytics 4** o **PostHog**) para tener una visibilidad completa del rendimiento del negocio.

---

## 1. Descubrimiento y Navegación
Eventos para entender cómo los clientes encuentran los productos y navegan por el catálogo.

- **`search_performed` (Búsqueda realizada):** Registra los términos exactos que los usuarios escriben en la barra de búsqueda. Útil para identificar demanda de productos no listados.
- **`product_viewed` (Producto Visto):** Registra qué productos específicos se están visualizando. Ayuda a cruzar datos con las compras reales.
- **`user_login` / `user_registered` (Inicio de Sesión / Registro):** Esencial en un entorno B2B para rastrear la actividad a nivel de empresa/cliente registrado.

---

## 2. El Embudo de Compra (Checkout Funnel)
Eventos críticos donde ocurre la conversión y la retención del dinero.

- **`added_to_cart` (Agregó al Carrito):** Se dispara cada vez que un usuario presiona el botón "Agregar" en un producto.
- **`cart_viewed` (Visitó el Carrito):** El usuario entró a revisar el resumen de su cotización/pedido.
- **`checkout_started` (Inició Checkout):** El usuario hizo clic en "Pagar" o "Finalizar Orden" desde el carrito.
- **`payment_method_selected` (Eligió Método de Pago/Despacho):** Útil para saber la preferencia logística o financiera (Mercado Pago, Transferencia, etc.).
- **`payment_failed` (Pago Fallido / Rechazado):** **[CRÍTICO]** Ocurre si falla la pasarela de pagos. Permite accionar rápidamente (llamada al cliente) para recuperar la venta.
- **`order_confirmed` (Pago Exitoso / Orden Confirmada):** La conversión final. El pedido pasa a estar activo en el sistema.

---

## 3. Post-Venta y Fidelización B2B
Eventos de seguimiento logístico y comportamiento de recompra.

- **`order_shipped` (Orden Despachada):** El pedido salió de bodega.
- **`order_delivered` (Orden Recibida):** El cliente confirma recepción.
- **`document_downloaded` (Descargó Factura/Cotización):** Frecuente en B2B para propósitos contables.
- **`added_to_wishlist` (Lista de Deseos):** El cliente guarda productos frecuentes, indicando intención de compra futura o armando listas de abastecimiento mensual.

---

## Gestión de Carritos Abandonados (Solución Actual)

Para mantener la base de datos optimizada en el tier gratuito de Neon, **no se almacenan logs pesados**. En su lugar, el proyecto cuenta con un proceso automatizado (Cron Job):

1. Todas las órdenes iniciadas quedan en estado `DRAFT` o `PENDING`.
2. El día 1 de cada mes a las 3:00 AM, un **Vercel Cron Job** (`/api/cron/cleanup-drafts`) busca los carritos abandonados con más de 30 días de antigüedad.
3. Se genera un reporte en **CSV (Excel)** y se envía al administrador por correo.
4. Los registros antiguos se eliminan de la base de datos de Neon para liberar espacio (manteniendo el sistema siempre limpio y 100% gratuito).
