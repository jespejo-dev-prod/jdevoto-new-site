# Sistema de Vendedores B2B (Sales Reps) — Documentación de Negocio y Técnica

Esta documentación explica en detalle el funcionamiento, los flujos lógicos de atribución y las reglas de seguridad implementadas en el **Sistema de Vendedores (Sales Reps) B2B** para la plataforma de eCommerce.

---

## 1. Propósito del Sistema
El sistema de vendedores permite organizar al equipo comercial por zonas y asociar ejecutivos de venta directamente a las empresas clientes. Esto asegura que:
1. Las compras realizadas de forma autónoma por los clientes en el sitio web se **atribuyan automáticamente** a su respectivo vendedor para fines de comisiones, reportes y métricas de desempeño.
2. Las gestiones de venta directa que los ejecutivos realizan físicamente en terreno ingresando pedidos por la plataforma queden **atribuidas a quien realizó la gestión**.
3. Los clientes orgánicos (captados directamente por el sitio web) puedan operar de forma autónoma atendidos por el portal sin un vendedor obligatorio, permitiendo la asignación comercial manual en el futuro de forma opcional.

---

## 2. Flujos de Atribución de Pedidos (Reglas de Negocio)

El sistema evalúa de forma inteligente quién creó el pedido y quién es el cliente para asignar el vendedor correcto a cada orden de compra:

### Escenario A: Cliente Orgánico del Sitio Web (Sin Vendedor)
* **Situación:** Un cliente nuevo se registra solo a través del portal y realiza una compra.
* **Flujo Lógico:**
  * El sistema detecta que el pedido fue hecho por el cliente y revisa si la empresa tiene un vendedor asociado.
  * Al no tener vendedor asignado, la orden se guarda con el campo de vendedor en `null` (vacío).
  * **Resultado:** La venta se atribuye al **canal web directo**.
  * **Notificación de Correo:** El pie de firma del ejecutivo comercial se omite limpiamente del correo de confirmación de pedido, mostrando un formato de correo de atención directa estándar.
* **Permanencia:** El cliente puede operar y comprar permanentemente bajo este canal web autónomo.

### Escenario B: Cliente con Ejecutivo de Cartera Asignado
* **Situación:** La empresa cliente tiene asignado a un ejecutivo de ventas (ej. Carlos) en su cartera de clientes y realiza un pedido de forma autónoma en la web.
* **Flujo Lógico:**
  * El sistema detecta que la orden fue hecha por el cliente.
  * Revisa la base de datos de la empresa y encuentra que su vendedor asignado es Carlos.
  * **Resultado:** La venta se **atribuye automáticamente a Carlos** (`salesRepId`).
  * **Notificación de Correo:** Al final del correo de confirmación del pedido, se inyecta un pie de firma estético HTML con el nombre y contacto de Carlos para que el cliente tenga soporte inmediato.

### Escenario C: Venta en Terreno (Pedido Creado por un Vendedor)
* **Situación:** Un ejecutivo de ventas de tu equipo (ej. Sofía) visita al cliente en su local. Ella inicia sesión en la plataforma B2B con sus credenciales de vendedor (`SALES_REP`), selecciona a la empresa cliente y crea el pedido a nombre de ellos directamente en el sistema.
* **Flujo Lógico:**
  * El sistema detecta que quien está digitando y guardando el pedido es un usuario con el rol de `SALES_REP` (Sofía).
  * **Resultado:** La venta se **atribuye prioritariamente a Sofía** (la creadora física de la orden).
  * **Prioridad:** Esta regla anula temporalmente cualquier vendedor que la empresa cliente tenga preasignado de base en su cartera para evitar conflictos de comisiones y premiar la gestión física en terreno.
  * **Notificación de Correo:** En el correo de confirmación de este pedido, se inyecta el contacto y la firma de Sofía como la ejecutiva a cargo de la transacción.

---

## 3. Guía de Integración y Seguridad Técnica

### Modelado de Base de Datos (Prisma Schema)
Las relaciones y campos clave fueron inyectados en la base de datos PostgreSQL local en los siguientes modelos de [`prisma/schema.prisma`](file:///c:/Users/jespejo/.gemini/antigravity/scratch/prisma/schema.prisma):
* **`Company` (`companies`):** Añadido campo opcional y relacionable `salesRepId` apuntando a `User`.
* **`Order` (`orders`):** Añadido campo opcional `salesRepId` apuntando a `User` para registrar de manera inmutable qué ejecutivo comisionó esa orden en particular al momento de su creación.

### Seguridad en la API de Clientes
La asignación y desvinculación de ejecutivos se administra a través del endpoint de empresas en [`PATCH /api/customers/[id]`](file:///c:/Users/jespejo/.gemini/antigravity/scratch/src/app/api/customers/%5Bid%5D/route.ts) y [`POST /api/customers`](file:///c:/Users/jespejo/.gemini/antigravity/scratch/src/app/api/customers/route.ts):
1. **Validación de Rol:** El sistema valida rigurosamente en la base de datos que el correo electrónico ingresado (`salesRepEmail`) corresponda a un usuario existente, con el rol activo de `SALES_REP` e `isActive: true`. Si el correo no cumple con estas condiciones, la API responde con un error descriptivo para prevenir errores humanos.
2. **Bloqueo a Clientes:** El endpoint cuenta con un guardián de seguridad que bloquea peticiones de usuarios con rol `COMPANY_ADMIN`. Los administradores de las empresas clientes **no pueden** alterarse el ejecutivo asignado ni auto-asignarse comerciales bajo ninguna circunstancia. Este campo es de exclusiva administración interna de la empresa proveedora.

### Opcionalidad y Flexibilidad
* Para desvincular a un vendedor de un cliente y dejarlo de nuevo bajo atención directa 100% web, simplemente se debe enviar un payload con `salesRepEmail: null` en la petición `PATCH`. El sistema limpiará la relación de manera robusta y segura.
