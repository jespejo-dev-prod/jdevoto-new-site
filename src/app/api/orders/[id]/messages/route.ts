import { NextRequest } from "next/server";
import { withApiHandler, ok, created } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { logAuditAction } from "@/lib/audit";
import { NotFoundError, BusinessRuleError } from "@/lib/errors";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// ============================================================
// POST /api/orders/[id]/messages
// ============================================================

export const POST = withApiHandler(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = extractUserFromRequest(req);
  const { id: orderId } = await params;

  // 1. Verificar si el pedido existe
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      company: true,
      createdBy: true
    }
  });

  if (!order) throw new NotFoundError("Pedido", orderId);

  // 2. Parsear el FormData
  const formData = await req.formData();
  const messageText = formData.get("message") as string | null;
  const notifyCustomer = formData.get("notifyCustomer") === "true";
  const file = formData.get("file") as File | null;

  if (!messageText && !file) {
    throw new BusinessRuleError("Debes enviar un mensaje o un archivo", "INVALID_MESSAGE");
  }

  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  let attachmentPath: string | null = null;

  // 3. Procesar archivo si existe
  if (file && file.size > 0) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new BusinessRuleError("Por seguridad, solo se permiten archivos PDF, JPG y PNG.", "INVALID_FILE_TYPE");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Asegurar que el directorio uploads/invoices existe
    const uploadDir = join(process.cwd(), "public", "uploads", "invoices");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignorar si ya existe
    }

    // Nombre único para el archivo
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, ""); // Limpiar nombre
    const finalFilename = `${uniqueSuffix}-${originalName}`;
    attachmentPath = join(uploadDir, finalFilename);

    await writeFile(attachmentPath, buffer);

    attachmentUrl = `/uploads/invoices/${finalFilename}`;
    attachmentName = file.name;
  }

  // 4. Guardar en Base de Datos
  const newMessage = await prisma.orderMessage.create({
    data: {
      orderId,
      senderId: user.id,
      message: messageText || null,
      attachmentUrl,
      attachmentName,
      isCustomerVisible: true,
    }
  });

  // 4.1 Crear Notificaciones Globales
  const isAdmin = user.role === 'ADMIN' || user.role === 'SALES_REP';
  
  if (isAdmin) {
    // Notificar al comprador
    if (order.createdById !== user.id) {
      const notif = await prisma.notification.create({
        data: {
          userId: order.createdById,
          title: `Nuevo mensaje en Pedido #${order.orderNumber}`,
          message: `El administrador ha enviado un mensaje o factura.`,
          link: `/dashboard/orders/${order.id}`
        }
      });
      // Enviar correo de notificación
      try {
        const { sendNotificationEmail } = await import('@/lib/email');
        const recipient = await prisma.user.findUnique({ where: { id: order.createdById }, select: { email: true } });
        if (recipient?.email) {
          await sendNotificationEmail(recipient.email, notif.title, notif.message, notif.link || undefined);
        }
      } catch (err) {
        console.error("Error al enviar correo de notificación:", err);
      }
    }
  } else {
    // Notificar a todos los administradores
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });
    
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: `Nuevo mensaje de Cliente`,
          message: `${user.firstName} ${user.lastName} (Pedido #${order.orderNumber}) ha enviado un mensaje.`,
          link: `/dashboard/orders/${order.id}`
        }))
      });
      // Enviar correos de notificación a los administradores
      try {
        const { sendNotificationEmail } = await import('@/lib/email');
        const adminUsers = await prisma.user.findMany({
          where: { id: { in: admins.map(a => a.id) } },
          select: { email: true }
        });
        const title = `Nuevo mensaje de Cliente`;
        const msg = `${user.firstName} ${user.lastName} (Pedido #${order.orderNumber}) ha enviado un mensaje.`;
        const link = `/dashboard/orders/${order.id}`;
        for (const admin of adminUsers) {
          if (admin.email) {
            await sendNotificationEmail(admin.email, title, msg, link);
          }
        }
      } catch (err) {
        console.error("Error al enviar correos a administradores:", err);
      }
    }
  }

  // 5. Notificar al cliente por correo si se solicitó (sólo si es admin)
  if (notifyCustomer && isAdmin) {
    try {
      const { sendOrderMessageEmail } = await import('@/lib/email');
      let customerEmail = (order.billingAddress as any)?.email;
      if (!customerEmail) {
        customerEmail = order.createdBy?.email || "ventas@tutiendab2b.cl";
      }

      await sendOrderMessageEmail(order, newMessage, attachmentPath, customerEmail);
    } catch (err) {
      console.error("Error al enviar correo de mensaje del pedido:", err);
    }
  }

  logAuditAction({
    action: "ORDER_UPDATED",
    userId: user.id,
    entity: "Order",
    entityId: orderId,
    details: { event: "MESSAGE_ADDED", hasAttachment: !!attachmentUrl, notifyCustomer },
    req,
  });

  return created(newMessage);
});

// ============================================================
// GET /api/orders/[id]/messages
// ============================================================

export const GET = withApiHandler(async (
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const user = extractUserFromRequest(req);
  const { id: orderId } = await params;

  const messages = await prisma.orderMessage.findMany({
    where: { orderId },
    include: {
      sender: {
        select: { firstName: true, lastName: true, role: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return ok(messages);
});
