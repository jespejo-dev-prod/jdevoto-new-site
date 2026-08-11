import { NextRequest } from "next/server";
import { withApiHandler, ok, created } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { logAuditAction } from "@/lib/audit";
import { NotFoundError, BusinessRuleError, ForbiddenError } from "@/lib/errors";
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

  // 1.1 Verificar permisos / Alcance de la empresa
  const { requireOrderAccess } = await import('@/lib/auth');
  await requireOrderAccess(user, order.companyId);

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

    // Configurar cloudinary
    const { v2: cloudinary } = await import('cloudinary');
    if (!process.env.CLOUDINARY_URL && process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }

    // Subir a Cloudinary usando upload_stream
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'jdevoto_invoices',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    attachmentUrl = uploadResult.secure_url;
    attachmentPath = uploadResult.secure_url; // nodemailer will fetch it from this URL
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

  const isAdminOrRep = user.role === 'ADMIN' || user.role === 'SALES_REP' || user.role === 'SUPER_ADMIN';
  const isInvoicePdf = file && file.type === 'application/pdf' && isAdminOrRep;

  // 4.1 Crear Notificaciones Globales
  if (isAdminOrRep) {
    // Notificar al comprador
    if (order.createdById !== user.id) {
      const notifTitle = isInvoicePdf
        ? `Factura adjunta para Pedido #${order.orderNumber}`
        : `Nuevo mensaje en Pedido #${order.orderNumber}`;

      const notifMessage = isInvoicePdf
        ? `El administrador ha adjuntado la factura en PDF para tu pedido.`
        : `El administrador ha enviado un mensaje o factura.`;

      const notif = await prisma.notification.create({
        data: {
          userId: order.createdById,
          title: notifTitle,
          message: notifMessage,
          link: `/dashboard/orders/${order.id}`
        }
      });
      // Enviar correo de notificación (sólo si no se envía el email del mensaje detallado abajo)
      if (!notifyCustomer && !isInvoicePdf) {
        try {
          const { sendNotificationEmail } = await import('@/lib/email');
          if (order.createdBy?.email) {
            await sendNotificationEmail(order.createdBy.email, notif.title, notif.message, notif.link || undefined);
          }
        } catch (err) {
          console.error("Error al enviar correo de notificación:", err);
        }
      }
    }
  } else {
    // Notificar a todos los administradores (Unificando consultas de IDs y emails)
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true }
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
      // Enviar correos de notificación a los administradores en paralelo
      try {
        const { sendNotificationEmail } = await import('@/lib/email');
        const title = `Nuevo mensaje de Cliente`;
        const msg = `${user.firstName} ${user.lastName} (Pedido #${order.orderNumber}) ha enviado un mensaje.`;
        const link = `/dashboard/orders/${order.id}`;
        
        await Promise.all(
          admins
            .filter(admin => admin.email)
            .map(admin => sendNotificationEmail(admin.email!, title, msg, link))
        );
      } catch (err) {
        console.error("Error al enviar correos a administradores:", err);
      }
    }
  }

  // 5. Notificar al cliente por correo si se solicitó o si es una factura en PDF (sólo si es admin)
  if ((notifyCustomer || isInvoicePdf) && isAdminOrRep) {
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

  await logAuditAction({
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

  // Enforce company scoping
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { companyId: true }
  });

  if (!order) throw new NotFoundError("Pedido", orderId);

  const { requireOrderAccess } = await import('@/lib/auth');
  await requireOrderAccess(user, order.companyId);

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
