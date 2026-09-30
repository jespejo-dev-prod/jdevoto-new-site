# Informe Estratégico Comercial - JDevoto
**Período Base:** Septiembre/Octubre 2026

## 1. Situación actual
*Tráfico, usuarios, ventas, pedidos, clientes.*

- **Tráfico:** 1.230 usuarios (GA4)
- **Ventas Netas Validadas (Sin test/cancelados):** $7.999.482 CLP (17 pedidos exitosos)

## 2. Embudo comercial
*Visita → producto → carrito → checkout → pedido → venta.*

- **Usuarios:** 1.230 (100%)
- **Visualizan producto:** 459 (37,3%)
- **Agregan al carrito (Usuarios únicos):** 62 (5,0%)
- **Inician Checkout y Compra Final:** *Punto ciego de medición.* (GA4 no está registrando los eventos `begin_checkout`, `add_shipping_info`, `add_payment_info` ni `purchase`). 

**⚠️ Nota Metodológica:** Actualmente no es posible cruzar los 17 pedidos validados en la base de datos con los 1.230 usuarios de GA4 para obtener una tasa de conversión web real. La "Conversión Web" queda pendiente hasta implementar una correcta atribución (Pedido ↔ Sesión GA4) y reparar la medición del checkout.

## 3. Adquisición
*Direct / Organic / Referral / Social / campañas.*
*(Datos a extraer de GA4 Acquisition Report)*

## 4. SEO y demanda existente
*Qué buscan en Google, impresiones, clics, productos/categorías.*
*(Pendiente de Search Console)*

## 5. Comportamiento de producto
*Productos vistos, buscados, agregados y comprados.*

*Nota técnica sobre "Added to cart": Los 794 eventos sobre 62 usuarios (~12 por usuario) son característicos del B2B, donde un usuario cotiza múltiples SKUs o ajusta cantidades repetidamente. Para el embudo, utilizaremos el conteo de **Usuarios únicos** (62).*

## 6. Clientes
*Nuevos/recurrentes, empresas, tamaño de compra, frecuencia.*

## 7. Ventas Reales (Baseline)
*Facturación, ticket promedio, productos, categorías y vendedores.*

**Criterios de Limpieza (Metodología aplicada a la BD):**
Para aislar las ventas reales, partimos de 31 pedidos y eliminamos:
1. **Pedidos cancelados/rechazados** (`status === CANCELLED` o `REJECTED`). *(Excluye 9 pedidos)*
2. **Empresas de prueba** (Donde el nombre de la empresa contiene "test" o "webpack").
3. **Usuarios de prueba** (Donde el email del cliente o del creador del pedido contiene "test").
4. **Pedidos de monto cero** (`totalGross === 0`).

**Criterios de Segmentación:**
- **Venta Autónoma:** Pedidos sin un vendedor asignado, o asignados explícitamente a la cuenta de la casa (`ventasweb@jdevoto.cl`).
- **Venta Asistida:** Pedidos vinculados al ID de un vendedor humano real.

**Resultados Validados:**
- **Total Ingresos Validados:** $7.999.482 CLP (17 pedidos)
- **Venta Autónoma (Web):** 9 pedidos ($2.212.783) - *Ticket Promedio: $245.864*
- **Venta Asistida (Vendedor):** 8 pedidos ($5.786.699) - *Ticket Promedio: $723.337*

## 8. Segmentación basada en datos
*Identificar segmentos reales en base a la compra asistida vs autónoma.*

## 9. Plan promocional 90 días
*SEO + Google Ads + remarketing + email/B2B + contenido/categorías, según lo que revelen los datos.*

## 10. KPIs
- **Conversión Web Autónoma:** TBD
- **Ticket Promedio Global:** $470.557
- **Tasa de Abandono de Carrito:** TBD (calculable con datos GA4 pendientes)
