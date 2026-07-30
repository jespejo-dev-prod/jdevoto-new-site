import { prisma } from "@/lib/client";
import { sendNotificationEmail } from "@/lib/email";
import { AuditAction } from "./audit";

// Map of actions to human-readable strings
const ACTION_MAP: Partial<Record<AuditAction, { title: string; template: (userName: string, details?: any) => string; link?: string }>> = {
  ORDER_UPDATED: {
    title: "Pedido Actualizado",
    template: (name, details) => `El usuario ${name} ha actualizado un pedido.`,
    link: "/dashboard/orders"
  },
  USER_REGISTERED: {
    title: "Nuevo Usuario Registrado",
    template: (name, details) => `Un nuevo usuario se ha registrado en la plataforma: ${name} (${details?.email || "Sin correo"}).`,
    link: "/dashboard/users"
  },
  USER_UPDATED: {
    title: "Usuario Actualizado (Asignación)",
    template: (name, details) => `El usuario ${name} ha modificado un usuario (Ej: Asignación de Vendedor/Cliente).`,
    link: "/dashboard/users"
  },
  PASSWORD_RESET_COMPLETED: {
    title: "Contraseña Restablecida",
    template: (name, details) => `El usuario con correo ${details?.email || name} ha restablecido su contraseña exitosamente.`,
    link: "/dashboard/users"
  },
  PRODUCT_CREATED: {
    title: "Nuevo Producto Creado",
    template: (name, details) => `El usuario ${name} ha creado un nuevo producto.`,
    link: "/dashboard/products"
  },
  PRODUCT_UPDATED: {
    title: "Producto Actualizado",
    template: (name, details) => `El usuario ${name} ha modificado un producto.`,
    link: "/dashboard/products"
  },
  PRODUCT_DELETED: {
    title: "Producto Eliminado",
    template: (name, details) => `El usuario ${name} ha eliminado un producto.`,
    link: "/dashboard/products"
  },
  CATALOG_IMPORTED: {
    title: "Actualización Masiva de Catálogo",
    template: (name, details) => `El usuario ${name} ha realizado una importación masiva de stock y precios. Se actualizaron ${details?.successCount || 0} productos exitosamente.`,
    link: "/dashboard/products"
  },
  CATEGORY_CREATED: {
    title: "Nueva Categoría Creada",
    template: (name, details) => `El usuario ${name} ha creado una nueva categoría.`,
    link: "/dashboard/categories"
  },
  CATEGORY_UPDATED: {
    title: "Categoría Actualizada",
    template: (name, details) => `El usuario ${name} ha modificado una categoría.`,
    link: "/dashboard/categories"
  },
  CATEGORY_DELETED: {
    title: "Categoría Eliminada",
    template: (name, details) => `El usuario ${name} ha eliminado una categoría.`,
    link: "/dashboard/categories"
  },
  BRAND_CREATED: {
    title: "Nueva Marca Creada",
    template: (name, details) => `El usuario ${name} ha creado una nueva marca.`,
    link: "/dashboard/brands"
  },
  BRAND_UPDATED: {
    title: "Marca Actualizada",
    template: (name, details) => `El usuario ${name} ha modificado una marca.`,
    link: "/dashboard/brands"
  },
  BRAND_DELETED: {
    title: "Marca Eliminada",
    template: (name, details) => `El usuario ${name} ha eliminado una marca.`,
    link: "/dashboard/brands"
  },
  COMPANY_CREATED: {
    title: "Nuevo Cliente (Empresa) Creado",
    template: (name, details) => `El usuario ${name} ha creado un nuevo cliente (empresa).`,
    link: "/dashboard/customers"
  },
  COMPANY_UPDATED: {
    title: "Cliente (Empresa) Actualizado",
    template: (name, details) => `El usuario ${name} ha modificado un cliente (empresa).`,
    link: "/dashboard/customers"
  },
  COMPANY_DELETED: {
    title: "Cliente (Empresa) Eliminado",
    template: (name, details) => `El usuario ${name} ha eliminado un cliente (empresa).`,
    link: "/dashboard/customers"
  },
  PAYMENT_METHOD_CREATED: {
    title: "Nuevo Método de Pago Creado",
    template: (name, details) => `El usuario ${name} ha creado un nuevo método de pago.`,
    link: "/dashboard/settings"
  },
  PAYMENT_METHOD_UPDATED: {
    title: "Método de Pago Actualizado",
    template: (name, details) => `El usuario ${name} ha modificado un método de pago.`,
    link: "/dashboard/settings"
  },
  PAYMENT_METHOD_DELETED: {
    title: "Método de Pago Eliminado",
    template: (name, details) => `El usuario ${name} ha eliminado un método de pago.`,
    link: "/dashboard/settings"
  },
  SETTINGS_UPDATED: {
    title: "Configuración Actualizada",
    template: (name, details) => `El usuario ${name} ha modificado la configuración general de la tienda.`,
    link: "/dashboard/settings"
  }
};

export async function notifyAdminAction(action: AuditAction, userId?: string, details?: Record<string, any>) {
  if (!process.env.ADMIN_NOTIFICATION_EMAIL) return;

  const config = ACTION_MAP[action];
  if (!config) return; // Action is not mapped for notification

  let userName = "Sistema / Usuario Desconocido";
  let userRole = "";

  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true, role: true }
      });
      if (user) {
        userName = `${user.firstName} ${user.lastName}`;
        userRole = `[${user.role}] `;
      }
    } catch (error) {
      console.error("Error fetching user for admin notification:", error);
    }
  }

  const message = config.template(`${userRole}${userName}`, details);

  try {
    await sendNotificationEmail(
      process.env.ADMIN_NOTIFICATION_EMAIL,
      `${config.title} - Jdevoto.cl`,
      message,
      config.link
    );
  } catch (error) {
    console.error("Failed to send admin notification:", error);
  }
}
