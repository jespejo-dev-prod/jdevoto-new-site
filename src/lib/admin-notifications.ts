import { prisma } from "@/lib/client";
import { sendNotificationEmail } from "@/lib/email";
import { AuditAction } from "./audit";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function detailRow(label: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `
    <tr>
      <td style="padding: 6px 12px; font-size: 13px; font-weight: 600; color: #64748b; white-space: nowrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${label}</td>
      <td style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${value}</td>
    </tr>`;
}

function detailsTable(rows: string): string {
  if (!rows.trim()) return "";
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 16px; overflow: hidden;">
      ${rows}
    </table>`;
}

function formatChanges(changes: string[] | undefined): string {
  if (!changes || changes.length === 0) return "";
  const labels: Record<string, string> = {
    razonSocial: "Razón Social",
    rut: "RUT",
    giro: "Giro",
    direccion: "Dirección",
    comuna: "Comuna",
    ciudad: "Ciudad",
    region: "Región",
    telefono: "Teléfono",
    email: "Email",
    website: "Sitio Web",
    defaultDiscount: "Descuento Base",
    creditLimit: "Límite de Crédito",
    paymentTerms: "Condición de Pago",
    paymentTermDiscount: "Descuento por Pago",
    shippingStreet: "Calle Envío",
    shippingNumber: "Número Envío",
    shippingCommune: "Comuna Envío",
    shippingCity: "Ciudad Envío",
    shippingRegion: "Región Envío",
    billingEmail: "Email Facturación",
    name: "Nombre",
    slug: "Slug",
    description: "Descripción",
    parentId: "Categoría Padre",
    isActive: "Estado Activo",
    nombreFantasia: "Nombre Fantasía",
    salesRepEmail: "Email Vendedor",
  };
  return changes.map(c => labels[c] || c).join(", ");
}

function formatMoney(val: number | undefined): string {
  if (val === undefined || val === null) return "-";
  return `$${Math.round(Number(val)).toLocaleString("es-CL")}`;
}

// ─── Notification Builders ──────────────────────────────────────────────────────

type NotificationBuilder = (userName: string, details?: any) => { title: string; message: string; link?: string };

const NOTIFICATION_BUILDERS: Partial<Record<AuditAction, NotificationBuilder>> = {

  // ── Pedidos ──────────────────────────────────────────────────────────────────
  ORDER_UPDATED: (name, d) => ({
    title: "Pedido Actualizado",
    message: `El usuario ${name} ha actualizado un pedido.` +
      detailsTable(
        detailRow("N° Pedido", d?.orderNumber) +
        detailRow("Cambios", d?.changes ? formatChanges(d.changes) : null)
      ),
    link: "/dashboard/orders",
  }),

  // ── Usuarios ─────────────────────────────────────────────────────────────────
  USER_REGISTERED: (name, d) => ({
    title: "Nuevo Usuario Registrado",
    message: `Se ha registrado un nuevo usuario en la plataforma.` +
      detailsTable(
        detailRow("Nombre", d?.firstName ? `${d.firstName} ${d.lastName || ""}` : name) +
        detailRow("Email", d?.email) +
        detailRow("Rol", d?.role) +
        detailRow("Empresa", d?.companyName)
      ),
    link: "/dashboard/users",
  }),

  USER_UPDATED: (name, d) => ({
    title: `Usuario Actualizado: ${d?.targetEmail || d?.email || ''}`,
    message: `El usuario ${name} ha modificado un usuario.` +
      detailsTable(
        detailRow("Email del usuario", d?.targetEmail || d?.email) +
        detailRow("Campos modificados", d?.changes ? formatChanges(d.changes) : null) +
        detailRow("Nuevo Rol", d?.newRole) +
        detailRow("Empresa asignada", d?.companyName)
      ),
    link: "/dashboard/users",
  }),

  USER_DELETED: (name, d) => ({
    title: `Usuario Eliminado: ${d?.targetEmail || d?.email || ''}`,
    message: `El usuario ${name} ha eliminado a un usuario de la plataforma.` +
      detailsTable(
        detailRow("Email del usuario eliminado", d?.targetEmail || d?.email)
      ),
    link: "/dashboard/users",
  }),

  PASSWORD_RESET_COMPLETED: (name, d) => ({
    title: "Contraseña Restablecida",
    message: `Un usuario ha restablecido su contraseña exitosamente.` +
      detailsTable(
        detailRow("Email", d?.email)
      ),
    link: "/dashboard/users",
  }),

  // ── Productos ────────────────────────────────────────────────────────────────
  PRODUCT_CREATED: (name, d) => ({
    title: "Nuevo Producto Creado",
    message: `El usuario ${name} ha creado un nuevo producto.` +
      detailsTable(
        detailRow("Producto", d?.productName || d?.name) +
        detailRow("SKU", d?.sku) +
        detailRow("Precio Base", d?.basePrice ? formatMoney(d.basePrice) : null) +
        detailRow("Stock", d?.stockQuantity)
      ),
    link: "/dashboard/products",
  }),

  PRODUCT_UPDATED: (name, d) => ({
    title: "Producto Actualizado",
    message: `El usuario ${name} ha modificado un producto.` +
      detailsTable(
        detailRow("Producto", d?.productName || d?.name) +
        detailRow("Precio Base", d?.basePrice ? formatMoney(d.basePrice) : null) +
        detailRow("Nuevo Stock", d?.stockQuantity) +
        detailRow("Campos modificados", d?.changes ? formatChanges(d.changes) : null)
      ),
    link: "/dashboard/products",
  }),

  PRODUCT_DELETED: (name, d) => ({
    title: "Producto Eliminado",
    message: `El usuario ${name} ha eliminado un producto.` +
      detailsTable(
        detailRow("Producto", d?.productName || d?.name) +
        detailRow("SKU", d?.sku)
      ),
    link: "/dashboard/products",
  }),

  CATALOG_IMPORTED: (name, d) => ({
    title: "Actualización Masiva de Catálogo",
    message: `El usuario ${name} ha realizado una importación masiva de stock y precios.` +
      detailsTable(
        detailRow("Productos actualizados", d?.successCount) +
        detailRow("Errores", d?.errorCount) +
        detailRow("Total procesados", d?.totalProcessed)
      ),
    link: "/dashboard/products",
  }),

  // ── Categorías ───────────────────────────────────────────────────────────────
  CATEGORY_CREATED: (name, d) => ({
    title: "Nueva Categoría Creada",
    message: `El usuario ${name} ha creado una nueva categoría.` +
      detailsTable(
        detailRow("Categoría", d?.name) +
        detailRow("Slug", d?.slug)
      ),
    link: "/dashboard/categories",
  }),

  CATEGORY_UPDATED: (name, d) => ({
    title: "Categoría Actualizada",
    message: `El usuario ${name} ha modificado una categoría.` +
      detailsTable(
        detailRow("Categoría", d?.name) +
        detailRow("Campos modificados", d?.changes ? formatChanges(d.changes) : null)
      ),
    link: "/dashboard/categories",
  }),

  CATEGORY_DELETED: (name, d) => ({
    title: "Categoría Eliminada",
    message: `El usuario ${name} ha eliminado una categoría.` +
      detailsTable(
        detailRow("Categoría", d?.name)
      ),
    link: "/dashboard/categories",
  }),

  // ── Marcas ───────────────────────────────────────────────────────────────────
  BRAND_CREATED: (name, d) => ({
    title: "Nueva Marca Creada",
    message: `El usuario ${name} ha creado una nueva marca.` +
      detailsTable(
        detailRow("Marca", d?.name) +
        detailRow("Slug", d?.slug)
      ),
    link: "/dashboard/marcas",
  }),

  BRAND_UPDATED: (name, d) => ({
    title: "Marca Actualizada",
    message: `El usuario ${name} ha modificado una marca.` +
      detailsTable(
        detailRow("Marca", d?.name) +
        detailRow("Campos modificados", d?.changes ? formatChanges(d.changes) : null)
      ),
    link: "/dashboard/marcas",
  }),

  BRAND_DELETED: (name, d) => ({
    title: "Marca Eliminada",
    message: `El usuario ${name} ha eliminado una marca.` +
      detailsTable(
        detailRow("Marca", d?.name)
      ),
    link: "/dashboard/marcas",
  }),

  // ── Promociones ──────────────────────────────────────────────────────────────
  PROMOTION_CREATED: (name, d) => ({
    title: "Nueva Promoción Creada",
    message: `El usuario ${name} ha creado una nueva promoción.` +
      detailsTable(
        detailRow("Promoción", d?.name) +
        detailRow("Descuento", d?.discount ? `${d.discount}%` : null) +
        detailRow("Categoría", d?.categoryName) +
        detailRow("Marca", d?.brandName)
      ),
    link: "/dashboard/descuentos",
  }),

  PROMOTION_UPDATED: (name, d) => ({
    title: "Promoción Actualizada",
    message: `El usuario ${name} ha actualizado una promoción.` +
      detailsTable(
        detailRow("Promoción", d?.name) +
        detailRow("Descuento", d?.discount ? `${d.discount}%` : null) +
        detailRow("Campos modificados", d?.changes ? formatChanges(d.changes) : null)
      ),
    link: "/dashboard/descuentos",
  }),

  PROMOTION_DELETED: (name, d) => ({
    title: "Promoción Eliminada",
    message: `El usuario ${name} ha eliminado una promoción.` +
      detailsTable(
        detailRow("Promoción", d?.name)
      ),
    link: "/dashboard/descuentos",
  }),

  // ── Clientes (Empresas) ──────────────────────────────────────────────────────
  COMPANY_CREATED: (name, d) => ({
    title: "Nuevo Cliente (Empresa) Creado",
    message: `El usuario ${name} ha registrado un nuevo cliente.` +
      detailsTable(
        detailRow("Razón Social", d?.razonSocial) +
        detailRow("RUT", d?.rut) +
        detailRow("Email", d?.email) +
        detailRow("Vendedor asignado", d?.salesRepEmail)
      ),
    link: "/dashboard/customers",
  }),

  COMPANY_UPDATED: (name, d) => ({
    title: "Cliente (Empresa) Actualizado",
    message: `El usuario ${name} ha modificado un cliente.` +
      detailsTable(
        detailRow("Razón Social", d?.razonSocial) +
        detailRow("RUT", d?.rut) +
        detailRow("Campos modificados", d?.changes ? formatChanges(d.changes) : null) +
        detailRow("Vendedor actualizado", d?.salesRepUpdated ? "Sí" : null) +
        detailRow("Nuevo Límite Crédito", d?.creditLimit !== undefined ? formatMoney(d.creditLimit) : null) +
        detailRow("Nuevo Descuento Base", d?.defaultDiscount !== undefined ? `${d.defaultDiscount}%` : null)
      ),
    link: "/dashboard/customers",
  }),

  COMPANY_DELETED: (name, d) => ({
    title: d?.softDelete ? "Cliente (Empresa) Desactivado" : "Cliente (Empresa) Eliminado",
    message: `El usuario ${name} ha ${d?.softDelete ? "desactivado" : "eliminado"} un cliente.` +
      detailsTable(
        detailRow("Razón Social", d?.razonSocial) +
        detailRow("RUT", d?.rut) +
        detailRow("Motivo", d?.reason) +
        detailRow("Tipo", d?.softDelete ? "Desactivación (preserva historial)" : "Eliminación definitiva")
      ),
    link: "/dashboard/customers",
  }),

  // ── Métodos de Pago ──────────────────────────────────────────────────────────
  PAYMENT_METHOD_CREATED: (name, d) => ({
    title: "Nuevo Método de Pago Creado",
    message: `El usuario ${name} ha creado un nuevo método de pago.` +
      detailsTable(
        detailRow("Método", d?.name) +
        detailRow("Tipo", d?.type)
      ),
    link: "/dashboard/settings",
  }),

  PAYMENT_METHOD_UPDATED: (name, d) => ({
    title: "Método de Pago Actualizado",
    message: `El usuario ${name} ha modificado un método de pago.` +
      detailsTable(
        detailRow("Método", d?.name) +
        detailRow("Campos modificados", d?.changes ? formatChanges(d.changes) : null)
      ),
    link: "/dashboard/settings",
  }),

  PAYMENT_METHOD_DELETED: (name, d) => ({
    title: "Método de Pago Eliminado",
    message: `El usuario ${name} ha eliminado un método de pago.` +
      detailsTable(
        detailRow("Método", d?.name)
      ),
    link: "/dashboard/settings",
  }),

  SETTINGS_UPDATED: (name, d) => ({
    title: "Configuración Actualizada",
    message: `El usuario ${name} ha modificado la configuración general de la tienda.` +
      detailsTable(
        detailRow("Sección", d?.section || d?.key) +
        detailRow("Campos modificados", d?.changes ? formatChanges(d.changes) : null)
      ),
    link: "/dashboard/settings",
  }),
};

// ─── Main Function ──────────────────────────────────────────────────────────────

export async function notifyAdminAction(action: AuditAction, userId?: string, details?: Record<string, any>) {
  if (!process.env.ADMIN_NOTIFICATION_EMAIL) return;

  const builder = NOTIFICATION_BUILDERS[action];
  if (!builder) return; // Action is not mapped for notification

  let userName = "Sistema / Usuario Desconocido";
  let userRole = "";
  let rawRole = "";

  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true, role: true }
      });
      if (user) {
        userName = `${user.firstName} ${user.lastName}`;
        userRole = `[${user.role}] `;
        rawRole = user.role;
      }
    } catch (error) {
      console.error("Error fetching user for admin notification:", error);
    }
  }

  const notification = builder(`${userRole}${userName}`, details);

  // Determinar correo de destino:
  // Si el actor es ADMIN o SUPER_ADMIN, enviar a TECH_ADMIN_EMAIL (o fallback a ADMIN_NOTIFICATION_EMAIL).
  // Si es otro rol (ej. Vendedor, Cliente), enviar al correo regular de ventas.
  let targetEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  
  if (rawRole === "ADMIN" || rawRole === "SUPER_ADMIN") {
    targetEmail = process.env.TECH_ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;
  }

  try {
    await sendNotificationEmail(
      targetEmail,
      `${notification.title} - Jdevoto.cl`,
      notification.message,
      notification.link
    );
  } catch (error) {
    console.error("Failed to send admin notification:", error);
  }
}
