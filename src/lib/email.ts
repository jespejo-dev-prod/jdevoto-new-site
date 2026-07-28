import nodemailer from 'nodemailer';

// Cache transporter to avoid recreating test accounts constantly
let transporterInstance: nodemailer.Transporter | null = null;

export async function getTransporter() {
  if (transporterInstance) return transporterInstance;

  // Use real SMTP if configured
  if (process.env.SMTP_HOST) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development mode: Create a fake Ethereal account
    const testAccount = await nodemailer.createTestAccount();
    transporterInstance = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporterInstance;
}

const STATUS_CONFIGS: Record<string, { label: string; title: string; subject: string; description: string; color: string }> = {
  PENDING: {
    label: "Pendiente",
    title: "¡Pedido Pendiente de Confirmación!",
    subject: "Pedido pendiente",
    description: "Tu pedido ha sido recibido y se encuentra en estado pendiente de aprobación o pago.",
    color: "#d97706", // amber-600
  },
  CONFIRMED: {
    label: "Confirmado",
    title: "¡Pedido Confirmado!",
    subject: "Pedido confirmado",
    description: "Tu pedido ha sido confirmado y está siendo preparado para su despacho.",
    color: "#1e3a8a", // blue-900 / primary
  },
  SHIPPED: {
    label: "Enviado",
    title: "¡Pedido Enviado! 🚚",
    subject: "Pedido enviado",
    description: "¡Buenas noticias! Tu pedido ha sido despachado y está en camino.",
    color: "#0d9488", // teal-600
  },
  DELIVERED: {
    label: "Entregado",
    title: "¡Pedido Entregado! ✅",
    subject: "Pedido entregado",
    description: "Tu pedido ha sido entregado exitosamente. ¡Gracias por tu compra!",
    color: "#16a34a", // green-600
  },
  CANCELLED: {
    label: "Cancelado",
    title: "¡Pedido Cancelado!",
    subject: "Pedido cancelado",
    description: "Tu pedido ha sido cancelado.",
    color: "#dc2626", // red-600
  },
  REJECTED: {
    label: "Rechazado",
    title: "¡Pedido Rechazado!",
    subject: "Pedido rechazado",
    description: "Tu pedido ha sido rechazado.",
    color: "#7f1d1d", // red-900
  },
  DRAFT: {
    label: "Borrador",
    title: "¡Borrador de Pedido!",
    subject: "Borrador de pedido",
    description: "Este es un borrador de tu pedido.",
    color: "#4b5563", // gray-600
  },
};

function getStatusConfig(status: string) {
  const normalized = (status || '').toUpperCase();
  return STATUS_CONFIGS[normalized] || {
    label: status || "Confirmado",
    title: "¡Pedido Confirmado!",
    subject: "Pedido",
    description: "Tu pedido ha sido procesado.",
    color: "#1e3a8a",
  };
}

let cachedBankConfig: any = null;
let bankConfigLastFetch = 0;
const BANK_CONFIG_TTL = 5 * 60 * 1000; // 5 minutes

async function getBankTransferConfig() {
  if (cachedBankConfig && (Date.now() - bankConfigLastFetch) < BANK_CONFIG_TTL) {
    return cachedBankConfig;
  }
  const { prisma } = await import('@/lib/client');
  const config = await prisma.storeSettings.findUnique({ where: { key: 'bank_transfer_config' } });
  cachedBankConfig = config;
  bankConfigLastFetch = Date.now();
  return config;
}

export async function sendOrderEmail(order: any, customerEmail: string) {
  try {
    const transporter = await getTransporter();

    let bankConfig = null;
    if (order.paymentMethod === 'transfer' || order.paymentMethod === 'TRANSFER') {
      const setting = await getBankTransferConfig();
      if (setting && setting.value) {
        bankConfig = setting.value as any;
      }
    }

    const htmlContent = generateOrderHtml(order, customerEmail, bankConfig, false);
    const statusConfig = getStatusConfig(order.status);
    const shortOrderNumber = order.orderNumber.split('-').pop();
    const subject = `${statusConfig.subject}: #${shortOrderNumber}`;

    const info = await transporter.sendMail({
      from: `"${process.env.STORE_NAME || 'Jdevoto.cl'}" <${process.env.SMTP_USER || 'ventas@jdevoto.cl'}>`,
      to: customerEmail,
      subject,
      html: htmlContent,
    });

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      const adminHtmlContent = generateOrderHtml(order, customerEmail, null, true);
      await transporter.sendMail({
        from: `"${process.env.STORE_NAME || 'Jdevoto.cl'}" <${process.env.SMTP_USER || 'ventas@jdevoto.cl'}>`,
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `Nuevo Pedido Ingresado: #${shortOrderNumber}`,
        html: adminHtmlContent,
      });
    }

    console.log("==========================================");
    console.log(`📧 Correo enviado exitosamente a ${customerEmail}`);
    if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
      console.log("👀 Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    console.log("==========================================");

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando correo de pedido:", error);
    return { success: false, error };
  }
}

function generateOrderHtml(order: any, customerEmail: string, bankConfig: any = null, isAdmin: boolean = false) {
  const formatMoney = (val: number) => 
    `$${Math.round(Number(val)).toLocaleString('es-CL')}`;

  const company = order.company || {};
  const createdBy = order.createdBy || {};
  const items = order.items || [];
  const shipping = order.shippingAddress || {};

  const discountAmount = Number(order.discountAmount) || 0;
  const totalNet = Number(order.subtotalNet) || 0;
  const baseSubtotalNet = totalNet + discountAmount;
  const taxAmount = Number(order.taxAmount) || 0;
  const totalGross = Number(order.totalGross) || 0;
  const discountPct = baseSubtotalNet > 0 ? Math.round((discountAmount / baseSubtotalNet) * 100) : 0;

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="border: 1px solid #d1d5db; padding: 4px 8px; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2;">
        ${item.productName || item.product?.name || 'Producto'}
      </td>
      <td style="border: 1px solid #d1d5db; padding: 4px 8px; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2; font-weight: 500;">
        ${item.quantity}
      </td>
      <td style="border: 1px solid #d1d5db; padding: 4px 8px; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2; font-weight: 500;">
        ${formatMoney(item.unitNetPrice)}
      </td>
      <td style="border: 1px solid #d1d5db; padding: 4px 8px; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2;">
        ${item.productSku || item.product?.sku || '-'}
      </td>
    </tr>
  `).join('');

  const creatorName = `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim();
  const creatorFormatted = creatorName 
    ? creatorName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') 
    : 'un cliente';

  const logoUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/logo-svg.png` 
    : 'https://www.jdevoto.cl/wp-content/uploads/2024/06/logo-svg.png';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const baseStatusConfig = getStatusConfig(order.status);
  const statusConfig = isAdmin ? {
    title: "¡Nuevo Pedido Ingresado!",
    description: `El cliente ${company.razonSocial || creatorName || customerEmail} ha ingresado un nuevo pedido en la plataforma.`,
    color: baseStatusConfig.color,
    label: baseStatusConfig.label,
    subject: "Nuevo Pedido",
  } : baseStatusConfig;
  
  const shortOrderNumber = order.orderNumber.split('-').pop();

  const rawDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const day = rawDate.getDate();
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const month = months[rawDate.getMonth()];
  const year = rawDate.getFullYear();
  const formattedDate = `${day} de ${month} de ${year}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${statusConfig.title} #${shortOrderNumber}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
    <!-- Wrapper Table -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; width: 100%; padding: 20px 0;">
      <tr>
        <td align="center" style="padding: 0;">
          <!-- Card Container -->
          <table cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px; max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: left; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden;">
            
            <!-- Header (Logo) -->
            <tr>
              <td style="padding: 35px 40px 20px 40px; border-bottom: 1px solid #f1f5f9;">
                <img src="${logoUrl}" alt="Jdevoto.cl" height="60" style="display: block; border: 0; height: 60px; max-height: 60px; width: auto;" />
              </td>
            </tr>

            <!-- Content Body -->
            <tr>
              <td style="padding: 30px 40px 40px 40px;">
                
                <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  ${statusConfig.title}
                </h1>
                
                <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  ${statusConfig.description}
                </p>

                <!-- Resumen de pedido (WooCommerce style) -->
                <h2 style="font-size: 15px; font-weight: 700; color: #475569; margin: 30px 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">
                  Resumen del pedido
                </h2>
                <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Pedido #${shortOrderNumber} (${formattedDate})
                </p>

                <!-- Customer Details Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding-bottom: 8px; width: 35%; font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">RUT Cliente:</td>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${company.rut || '-'}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Razón Social:</td>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${company.razonSocial || '-'}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Creado por:</td>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${creatorFormatted}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Email Creador:</td>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${createdBy.email || '-'}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Teléfono:</td>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${createdBy.phone || company.telefono || '-'}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Estado:</td>
                      <td style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; color: ${statusConfig.color}; background-color: ${statusConfig.color}15; border: 1px solid ${statusConfig.color}30;">
                          ${statusConfig.label.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Products Table -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.2;">
                  <thead>
                    <tr style="background-color: #f8fafc;">
                      <th width="50%" style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; font-weight: 700; color: #374151; font-size: 12px; line-height: 1.2;">Producto</th>
                      <th width="12%" style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; font-weight: 700; color: #374151; font-size: 12px; line-height: 1.2;">Cantidad</th>
                      <th width="20%" style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; font-weight: 700; color: #374151; font-size: 12px; line-height: 1.2;">Precio</th>
                      <th width="18%" style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; font-weight: 700; color: #374151; font-size: 12px; line-height: 1.2;">SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                    
                    <!-- Subtotal -->
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 4px 8px; font-weight: 700; color: #374151; font-size: 12px; line-height: 1.2;">Subtotal:</td>
                      <td style="border: 1px solid #d1d5db; padding: 4px 8px; color: #374151; font-weight: 600; font-size: 12px; line-height: 1.2;">${formatMoney(baseSubtotalNet)}</td>
                    </tr>
                    
                    <!-- Descuento Especial -->
                    ${discountAmount > 0 ? `
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 4px 8px; font-weight: 700; color: #16a34a; font-size: 12px; line-height: 1.2;">Descuento Especial (${discountPct}%):</td>
                      <td style="border: 1px solid #d1d5db; padding: 4px 8px; color: #16a34a; font-weight: 600; font-size: 12px; line-height: 1.2;">-${formatMoney(discountAmount)}</td>
                    </tr>
                    ` : ''}

                    <!-- IVA -->
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 4px 8px; font-weight: 700; color: #374151; font-size: 12px; line-height: 1.2;">IVA:</td>
                      <td style="border: 1px solid #d1d5db; padding: 4px 8px; color: #374151; font-weight: 600; font-size: 12px; line-height: 1.2;">${formatMoney(taxAmount)}</td>
                    </tr>

                    <!-- Total Neto -->
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 4px 8px; font-weight: 700; color: #374151; font-size: 12px; line-height: 1.2;">Total Neto:</td>
                      <td style="border: 1px solid #d1d5db; padding: 4px 8px; color: #374151; font-weight: 600; font-size: 12px; line-height: 1.2;">${formatMoney(totalNet)}</td>
                    </tr>

                    <!-- Total -->
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 4px 8px; font-weight: 700; color: #0f172a; font-size: 13px; background-color: #f8fafc; line-height: 1.2;">Total:</td>
                      <td style="border: 1px solid #d1d5db; padding: 4px 8px; color: #1e3a8a; font-size: 14px; font-weight: 800; background-color: #f8fafc; line-height: 1.2;">${formatMoney(totalGross)}</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Action Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${appUrl}/dashboard/orders/${order.id}" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 30px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    Ver Pedido #${shortOrderNumber}
                  </a>
                </div>

                <!-- Bank Transfer Details Card -->
                ${((order.paymentMethod === 'transfer' || order.paymentMethod === 'TRANSFER') && bankConfig?.accounts?.length > 0) ? `
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 25px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #1e3a8a;">Datos para transferencia bancaria</h3>
                  ${(bankConfig.instructions || bankConfig.description) ? `<p style="margin: 0 0 15px 0; color: #475569;">${bankConfig.instructions || bankConfig.description}</p>` : ''}
                  
                  ${bankConfig.accounts.map((acc: any) => `
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
                      ${acc.bankName ? `<div style="margin-bottom: 4px;"><strong>Banco:</strong> ${acc.bankName}</div>` : ''}
                      ${acc.accountDetails ? `<div style="margin-bottom: 4px;"><strong>Cuenta:</strong> ${acc.accountDetails}</div>` : ''}
                      ${acc.accountName ? `<div style="margin-bottom: 4px;"><strong>Titular:</strong> ${acc.accountName}</div>` : ''}
                      ${acc.rut ? `<div style="margin-bottom: 4px;"><strong>RUT:</strong> ${acc.rut}</div>` : ''}
                      ${acc.email ? `<div style="margin-bottom: 4px;"><strong>Correo:</strong> ${acc.email}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
                ` : ''}

                <!-- Shipping Address Card -->
                ${shipping.street ? `
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <p style="margin: 0 0 6px 0; font-weight: 700; color: #334155; font-size: 14px;">📍 Dirección de Despacho</p>
                  <p style="margin: 0; color: #475569; line-height: 1.4;">
                    ${shipping.street} ${shipping.number || ''}<br>
                    ${shipping.comuna || ''}, ${shipping.region || ''}
                  </p>
                </div>
                ` : ''}

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #475569;">Jdevoto.cl - B2B eCommerce</p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">Este es un correo automático, por favor no respondas a este mensaje.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}


export async function sendOrderMessageEmail(order: any, messageData: any, attachmentPath: string | null, customerEmail: string) {
  try {
    const transporter = await getTransporter();

    const attachments = [];
    if (attachmentPath && messageData.attachmentName) {
      attachments.push({
        filename: messageData.attachmentName,
        path: attachmentPath
      });
    }

    const isPdf = messageData.attachmentName?.toLowerCase().endsWith('.pdf');
    const emailSubject = isPdf 
      ? `Factura adjunta para tu pedido #${order.orderNumber.split('-').pop()}`
      : `Actualización de pedido #${order.orderNumber.split('-').pop()}`;
      
    const headerTitle = isPdf
      ? `Factura de tu pedido #${order.orderNumber.split('-').pop()}`
      : `Actualización en tu pedido #${order.orderNumber.split('-').pop()}`;
      
    const introText = isPdf
      ? `Se ha adjuntado la factura en PDF para tu pedido.`
      : `Tienes una nueva actualización o documento adjunto para tu pedido.`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .message-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="color: #1e40af;">${headerTitle}</h2>
        <p>Hola,</p>
        <p>${introText}</p>
        
        ${messageData.message ? `
        <div class="message-box">
          <strong>Mensaje:</strong><br>
          ${messageData.message.replace(/\n/g, '<br>')}
        </div>
        ` : ''}

        ${attachments.length > 0 ? `
        <p style="margin-top: 20px;"><strong>📎 Se ha adjuntado la factura en PDF a este correo.</strong></p>
        ` : ''}

        <p style="margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/orders/${order.id}" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver mi pedido en la tienda</a>
        </p>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'ventas@jdevoto.cl'}>`,
      to: customerEmail,
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
      subject: emailSubject,
      html: htmlContent,
      attachments
    });

    console.log("==========================================");
    console.log(`📧 Mensaje enviado a ${customerEmail}`);
    if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
      console.log("👀 Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    console.log("==========================================");

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando mensaje de pedido:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const transporter = await getTransporter();
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; }
      </style>
    </head>
    <body style="background-color: #f9fafb; padding: 40px 0;">
      <div class="container">
        <h2 style="color: #1e40af; margin-top: 0;">Restablecer contraseña</h2>
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Jdevoto.cl asociada a este correo electrónico.</p>
        <p>Si fuiste tú, haz clic en el siguiente botón para elegir una nueva contraseña:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; margin-bottom: 20px;">Restablecer mi contraseña</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>

        <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura y tu cuenta permanecerá protegida.
        </p>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'soporte@jdevoto.cl'}>`,
      to: email,
      // Se elimina el BCC al administrador por seguridad, para que no pueda interceptar tokens de recuperación de contraseñas de usuarios.
      subject: 'Restablecer contraseña - Jdevoto.cl',
      html: htmlContent,
    });

    console.log("==========================================");
    console.log(`📧 Enlace de reseteo enviado a ${email}`);
    if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
      console.log("👀 Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    console.log("==========================================");

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando correo de reseteo:", error);
    return { success: false, error };
  }
}

export async function sendOrderShippedEmail(order: any, customerEmail: string) {
  try {
    const transporter = await getTransporter();

    let bankConfig = null;
    if (order.paymentMethod === 'transfer' || order.paymentMethod === 'TRANSFER') {
      const setting = await getBankTransferConfig();
      if (setting && setting.value) {
        bankConfig = setting.value as any;
      }
    }

    const htmlContent = generateOrderHtml(order, customerEmail, bankConfig);
    const statusConfig = getStatusConfig(order.status);
    const subject = `Tu pedido #${order.orderNumber.split('-').pop()} ha sido enviado 🚚`;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'despachos@jdevoto.cl'}>`,
      to: customerEmail,
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
      subject,
      html: htmlContent,
    });

    console.log("==========================================");
    console.log(`📧 Correo de despacho enviado a ${customerEmail}`);
    if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
      console.log("👀 Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    console.log("==========================================");

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando correo de despacho:", error);
    return { success: false, error };
  }
}

export async function sendNotificationEmail(email: string, title: string, message: string, link?: string) {
  try {
    const transporter = await getTransporter();
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; }
      </style>
    </head>
    <body style="background-color: #f9fafb; padding: 20px;">
      <div class="container">
        <h2 style="color: #1e40af; margin-top: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${title}</h2>
        <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333;">${message}</p>
        ${link ? `<a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${link}" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Ver en la plataforma</a>` : ''}
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'notificaciones@jdevoto.cl'}>`,
      to: email,
      subject: title,
      html: htmlContent,
    });

    console.log("==========================================");
    console.log(`📧 Notificación de correo enviada a ${email}`);
    if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
      console.log("👀 Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    console.log("==========================================");

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando correo de notificación:", error);
    return { success: false, error };
  }
}

export async function sendOrderStatusUpdateEmail(order: any, customerEmail: string) {
  try {
    const transporter = await getTransporter();

    let bankConfig = null;
    if (order.paymentMethod === 'transfer' || order.paymentMethod === 'TRANSFER') {
      const setting = await getBankTransferConfig();
      if (setting && setting.value) {
        bankConfig = setting.value as any;
      }
    }

    const htmlContent = generateOrderHtml(order, customerEmail, bankConfig);
    const statusConfig = getStatusConfig(order.status);
    const subject = `Actualización de estado pedido #${order.orderNumber.split('-').pop()} -> ${statusConfig.label}`;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'ventas@jdevoto.cl'}>`,
      to: customerEmail,
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
      subject,
      html: htmlContent,
    });

    console.log("==========================================");
    console.log(`📧 Correo de cambio de estado enviado a ${customerEmail}`);
    if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
      console.log("👀 Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    console.log("==========================================");

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando correo de cambio de estado:", error);
    return { success: false, error };
  }
}

export async function sendSupportTicketEmails(name: string, senderEmail: string, subject: string, message: string) {
  try {
    const transporter = await getTransporter();
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'soporte@jdevoto.cl';
    
    // 1. Correo para el Administrador
    const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff; }
        .header { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #4b5563; }
        .value { margin-top: 5px; color: #1f2937; }
        .message-box { background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin-top: 5px; white-space: pre-wrap; }
      </style>
    </head>
    <body style="background-color: #f9fafb; padding: 20px;">
      <div class="container">
        <div class="header">Nuevo Ticket de Soporte - Jdevoto.cl</div>
        <div class="field">
          <div class="label">Nombre del Cliente:</div>
          <div class="value">${name}</div>
        </div>
        <div class="field">
          <div class="label">Email de Contacto:</div>
          <div class="value"><a href="mailto:${senderEmail}">${senderEmail}</a></div>
        </div>
        <div class="field">
          <div class="label">Asunto:</div>
          <div class="value">${subject}</div>
        </div>
        <div class="field">
          <div class="label">Detalle de la Solicitud:</div>
          <div class="message-box">${message}</div>
        </div>
      </div>
    </body>
    </html>
    `;

    const adminInfo = await transporter.sendMail({
      from: `"Soporte Jdevoto.cl" <${process.env.SMTP_USER || 'soporte@jdevoto.cl'}>`,
      to: adminEmail,
      replyTo: senderEmail,
      subject: `[Soporte B2B] ${subject} - de ${name}`,
      html: adminHtml,
    });

    console.log(`📧 Ticket de soporte enviado al Administrador (${adminEmail})`);

    // 2. Correo de Confirmación para el Cliente
    const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; }
        .header { font-size: 20px; font-weight: bold; color: #1e40af; margin-bottom: 20px; }
      </style>
    </head>
    <body style="background-color: #f9fafb; padding: 40px 0;">
      <div class="container">
        <h2 style="color: #1e40af; margin-top: 0;">Hemos recibido tu solicitud de soporte</h2>
        <p>Hola ${name},</p>
        <p>Confirmamos que hemos recibido tu ticket de soporte sobre el asunto: <strong>"${subject}"</strong>.</p>
        <p>Nuestro equipo de soporte revisará tu solicitud y se pondrá en contacto contigo a la brevedad a través de este correo electrónico.</p>
        <p>Detalle de tu mensaje:</p>
        <blockquote style="background-color: #f9fafb; border-left: 4px solid #1e40af; padding: 10px 15px; margin: 20px 0; color: #4b5563; white-space: pre-wrap;">${message}</blockquote>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Este es un correo automático de Jdevoto.cl. Por favor, no respondas directamente a este mensaje.
        </p>
      </div>
    </body>
    </html>
    `;

    const customerInfo = await transporter.sendMail({
      from: `"Soporte Jdevoto.cl" <${process.env.SMTP_USER || 'soporte@jdevoto.cl'}>`,
      to: senderEmail,
      subject: `Hemos recibido tu solicitud: ${subject} - Jdevoto.cl`,
      html: customerHtml,
    });

    console.log(`📧 Confirmación de ticket enviada al Cliente (${senderEmail})`);

    return { success: true, adminMessageId: adminInfo.messageId, customerMessageId: customerInfo.messageId };
  } catch (error) {
    console.error("Error enviando correos de soporte:", error);
    return { success: false, error };
  }
}

export async function sendWishlistEmail(items: any[], recipientEmails: string, userDetails: any) {
  try {
    const transporter = await getTransporter();

    const htmlContent = generateWishlistHtml(items, userDetails);
    
    const name = `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim();
    const companyName = userDetails.company?.razonSocial || 'Invitado';
    const subject = `Lista de Deseos J. Devoto - de ${name} (${companyName})`;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'ventas@jdevoto.cl'}>`,
      to: recipientEmails,
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
      subject,
      html: htmlContent,
    });

    console.log("==========================================");
    console.log(`📧 Lista de deseos enviada exitosamente a ${recipientEmails}`);
    if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
      console.log("👀 Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    console.log("==========================================");

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando correo de lista de deseos:", error);
    return { success: false, error };
  }
}

export async function sendUserDeletedAdminNotification(email: string, role: string) {
  try {
    const transporter = await getTransporter();
    
    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const logoUrl = `${appUrl}/logo-svg.png`;
      const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; width: 100%; padding: 20px 0;">
          <tr><td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px; max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: left; overflow: hidden;">
              <tr><td style="padding: 35px 40px 20px 40px; border-bottom: 1px solid #f1f5f9;">
                <img src="${logoUrl}" alt="Jdevoto.cl" height="60" style="display: block; border: 0; height: 60px; width: auto;" />
              </td></tr>
              <tr><td style="padding: 30px 40px 40px 40px;">
                <p style="font-size: 14px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Notificación del Sistema</p>
                <h1 style="font-size: 26px; font-weight: 800; color: #1e293b; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Usuario eliminado</h1>
                <p style="color: #475569; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Se ha eliminado (o desactivado) un usuario en la plataforma B2B con los siguientes datos:</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0; margin-bottom: 28px;">
                  <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Email</span><br/>
                    <span style="font-size: 15px; font-weight: 600; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${email}</span>
                  </td></tr>
                  <tr><td style="padding: 16px 20px;">
                    <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Rol Eliminado</span><br/>
                    <span style="font-size: 15px; font-weight: 600; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${role}</span>
                  </td></tr>
                </table>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="border-radius: 8px;" bgcolor="#1e3a8a">
                            <a href="${appUrl}/dashboard/users" target="_blank" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff !important; text-decoration: none; border-radius: 8px; padding: 12px 28px; border: 1px solid #1e3a8a; display: inline-block; font-weight: 700;">Ver Gestión de Equipo</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td></tr>
              <tr><td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Este es un correo automático de Jdevoto.cl. Solo tú (administrador) lo recibes.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
      `;
      await transporter.sendMail({
        from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'soporte@jdevoto.cl'}>`,
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `Usuario eliminado: ${email} (${role})`,
        html: adminHtml,
      });
    }
  } catch (error) {
    console.error("Error enviando notificación de eliminación a admin:", error);
  }
}

export async function sendUserUpdatedAdminNotification(email: string, role: string, isReactivated: boolean = false) {
  try {
    const transporter = await getTransporter();
    
    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const logoUrl = `${appUrl}/logo-svg.png`;
      const title = isReactivated ? "Usuario reactivado" : "Rol actualizado";
      const description = isReactivated 
        ? "Un usuario previamente desactivado ha sido reactivado en la plataforma B2B:"
        : "Se ha actualizado el rol de un usuario en la plataforma B2B:";
        
      const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; width: 100%; padding: 20px 0;">
          <tr><td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px; max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: left; overflow: hidden;">
              <tr><td style="padding: 35px 40px 20px 40px; border-bottom: 1px solid #f1f5f9;">
                <img src="${logoUrl}" alt="Jdevoto.cl" height="60" style="display: block; border: 0; height: 60px; width: auto;" />
              </td></tr>
              <tr><td style="padding: 30px 40px 40px 40px;">
                <p style="font-size: 14px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Notificación del Sistema</p>
                <h1 style="font-size: 26px; font-weight: 800; color: #1e293b; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${title}</h1>
                <p style="color: #475569; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${description}</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0; margin-bottom: 28px;">
                  <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Email</span><br/>
                    <span style="font-size: 15px; font-weight: 600; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${email}</span>
                  </td></tr>
                  <tr><td style="padding: 16px 20px;">
                    <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Rol Asignado</span><br/>
                    <span style="font-size: 15px; font-weight: 600; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${role}</span>
                  </td></tr>
                </table>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="border-radius: 8px;" bgcolor="#1e3a8a">
                            <a href="${appUrl}/dashboard/users" target="_blank" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff !important; text-decoration: none; border-radius: 8px; padding: 12px 28px; border: 1px solid #1e3a8a; display: inline-block; font-weight: 700;">Ver Gestión de Equipo</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td></tr>
              <tr><td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Este es un correo automático de Jdevoto.cl. Solo tú (administrador) lo recibes.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
      `;
      await transporter.sendMail({
        from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'soporte@jdevoto.cl'}>`,
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `${title}: ${email} (${role})`,
        html: adminHtml,
      });
    }
  } catch (error) {
    console.error("Error enviando notificación de actualización a admin:", error);
  }
}


export async function sendSetupPasswordEmail(email: string, token: string, roleName: string) {
  try {
    const transporter = await getTransporter();
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; }
      </style>
    </head>
    <body style="background-color: #f9fafb; padding: 40px 0;">
      <div class="container">
        <h2 style="color: #1e40af; margin-top: 0;">¡Bienvenido a Jdevoto.cl!</h2>
        <p>Hola,</p>
        <p>Se ha creado una cuenta para ti en nuestra plataforma B2B con el rol de <strong>${roleName}</strong>.</p>
        <p>Para comenzar a utilizarla, por favor crea tu contraseña haciendo clic en el siguiente enlace:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; margin-bottom: 20px;">Crear mi contraseña</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>

        <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Este enlace expirará en 1 hora.
        </p>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'soporte@jdevoto.cl'}>`,
      to: email,
      subject: 'Crea tu contraseña - Jdevoto.cl',
      html: htmlContent,
    });

    // Notificar al admin con un correo propio y con estilo
    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const logoUrl = `${appUrl}/logo-svg.png`;
      const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; width: 100%; padding: 20px 0;">
          <tr><td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px; max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: left; overflow: hidden;">
              <tr><td style="padding: 35px 40px 20px 40px; border-bottom: 1px solid #f1f5f9;">
                <img src="${logoUrl}" alt="Jdevoto.cl" height="60" style="display: block; border: 0; height: 60px; width: auto;" />
              </td></tr>
              <tr><td style="padding: 30px 40px 40px 40px;">
                <p style="font-size: 14px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Notificación del Sistema</p>
                <h1 style="font-size: 26px; font-weight: 800; color: #1e293b; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Nuevo usuario creado</h1>
                <p style="color: #475569; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Se ha creado un nuevo usuario en la plataforma B2B con los siguientes datos:</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0; margin-bottom: 28px;">
                  <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Email</span><br/>
                    <span style="font-size: 15px; font-weight: 600; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${email}</span>
                  </td></tr>
                  <tr><td style="padding: 16px 20px;">
                    <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Rol Asignado</span><br/>
                    <span style="font-size: 15px; font-weight: 600; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${roleName}</span>
                  </td></tr>
                </table>
                <p style="color: #475569; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Se le envió al usuario un enlace para que cree su contraseña (válido por 1 hora).</p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="border-radius: 8px;" bgcolor="#1e3a8a">
                            <a href="${appUrl}/dashboard/users" target="_blank" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff !important; text-decoration: none; border-radius: 8px; padding: 12px 28px; border: 1px solid #1e3a8a; display: inline-block; font-weight: 700;">Ver Gestión de Equipo</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td></tr>
              <tr><td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Este es un correo automático de Jdevoto.cl. Solo tú (administrador) lo recibes.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
      `;
      await transporter.sendMail({
        from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'soporte@jdevoto.cl'}>`,
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `Nuevo usuario creado: ${email} (${roleName})`,
        html: adminHtml,
      });
    }

    console.log("==========================================");
    console.log(`📧 Enlace de configuración de contraseña enviado a ${email}`);
    if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
      console.log("👀 Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    console.log("==========================================");

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error enviando correo de configuración de contraseña:", error);
    return { success: false, error };
  }
}

function generateWishlistHtml(items: any[], userDetails: any) {
  const formatMoney = (val: number) => 
    `$${Math.round(Number(val)).toLocaleString('es-CL')}`;

  const company = userDetails.company || {};
  const creatorName = `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim();
  const creatorFormatted = creatorName 
    ? creatorName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') 
    : 'un cliente';

  const logoUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/logo-svg.png` 
    : 'https://www.jdevoto.cl/wp-content/uploads/2024/06/logo-svg.png';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const subtotalNeto = Math.round(items.reduce((acc: number, item: any) => {
    const qty = item.quantity || 1;
    return acc + (item.price * qty);
  }, 0));
  const iva = Math.round(subtotalNeto * 0.19);
  const total = Math.round(subtotalNeto + iva);

  const itemsHtml = items.map((item: any) => {
    const qty = item.quantity || 1;
    const lineTotal = Math.round(item.price * qty);

    return `
    <tr>
      <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2;">
        ${item.image ? `<img src="${item.image.startsWith('http') ? item.image : `${appUrl}${item.image}`}" alt="${item.name}" height="40" style="height: 40px; width: auto; max-width: 40px; display: block; margin: 0 auto; object-fit: contain;" />` : '-'}
      </td>
      <td style="border: 1px solid #d1d5db; padding: 6px 8px; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2;">
        <strong>${item.brandName || item.brand?.name || ''}</strong><br/>
        ${item.name}
        ${item.discountPercent > 0 ? `
          <div style="margin-top: 4px;">
            <span style="display: inline-block; padding: 1px 4px; font-size: 9px; font-weight: bold; color: #16a34a; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; margin-right: 4px;">${item.discountPercent}% OFF</span>
          </div>
        ` : ''}
      </td>
      <td style="border: 1px solid #d1d5db; padding: 6px 8px; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2; font-weight: 600; text-align: center;">
        ${qty}
      </td>
      <td style="border: 1px solid #d1d5db; padding: 6px 8px; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2;">
        ${item.sku}
      </td>
      <td style="border: 1px solid #d1d5db; padding: 6px 8px; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2; font-weight: 600; text-align: right;">
        <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${formatMoney(lineTotal)} Neto</span>
        ${(qty > 1 || item.discountPercent > 0) ? `<br/><span style="font-size: 10px; color: #64748b;">${formatMoney(item.price)} c/u Neto</span>` : ''}
      </td>
      <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.2;">
        <a href="${appUrl}/products/${item.slug}" style="display: inline-block; background-color: #1e3a8a; color: #ffffff !important; font-size: 10px; font-weight: 700; text-decoration: none; padding: 4px 8px; border-radius: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          Ver
        </a>
      </td>
    </tr>
    `;
  }).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lista de Deseos - J. Devoto</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
    <!-- Wrapper Table -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; width: 100%; padding: 20px 0;">
      <tr>
        <td align="center" style="padding: 0;">
          <!-- Card Container -->
          <table cellpadding="0" cellspacing="0" border="0" width="650" style="width: 650px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: left; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden;">
            
            <!-- Header (Logo) -->
            <tr>
              <td style="padding: 35px 40px 20px 40px; border-bottom: 1px solid #f1f5f9;">
                <img src="${logoUrl}" alt="Jdevoto.cl" height="60" style="display: block; border: 0; height: 60px; max-height: 60px; width: auto;" />
              </td>
            </tr>

            <!-- Content Body -->
            <tr>
              <td style="padding: 30px 40px 40px 40px;">
                
                <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Lista de Deseos / Cotización Guardada
                </h1>
                
                <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Has recibido una selección de productos recomendados de la plataforma mayorista B2B <strong>J. Devoto</strong>.
                </p>

                <!-- Customer Details Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding-bottom: 8px; width: 35%; font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Razón Social:</td>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 700; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${company.razonSocial || 'Invitado'}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">RUT:</td>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${company.rut || '-'}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Enviado por:</td>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${creatorFormatted} (${userDetails.email})</td>
                    </tr>
                    ${userDetails.phone ? `
                    <tr>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Teléfono:</td>
                      <td style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${userDetails.phone}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>

                <!-- Products Table -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.2;">
                  <thead>
                    <tr style="background-color: #f8fafc;">
                      <th width="10%" style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: 700; color: #374151; font-size: 12px;">Imagen</th>
                      <th width="38%" style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 700; color: #374151; font-size: 12px;">Producto</th>
                      <th width="10%" style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: 700; color: #374151; font-size: 12px;">Cant.</th>
                      <th width="15%" style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 700; color: #374151; font-size: 12px;">SKU</th>
                      <th width="17%" style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 700; color: #374151; font-size: 12px;">Precio Neto</th>
                      <th width="10%" style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: 700; color: #374151; font-size: 12px;">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                    <!-- Subtotal Neto -->
                    <tr style="background-color: #f8fafc; font-weight: bold; border-top: 1px solid #d1d5db;">
                      <td colSpan="4" style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 700; color: #374151; font-size: 12px;">Subtotal Neto:</td>
                      <td style="border: 1px solid #d1d5db; padding: 8px; color: #374151; font-weight: 600; font-size: 12px; text-align: right; white-space: nowrap;">${formatMoney(subtotalNeto)}</td>
                      <td style="border: 1px solid #d1d5db; padding: 8px;"></td>
                    </tr>
                    <!-- IVA -->
                    <tr style="background-color: #f8fafc; font-weight: bold;">
                      <td colSpan="4" style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 700; color: #374151; font-size: 12px;">IVA (19%):</td>
                      <td style="border: 1px solid #d1d5db; padding: 8px; color: #374151; font-weight: 600; font-size: 12px; text-align: right; white-space: nowrap;">${formatMoney(iva)}</td>
                      <td style="border: 1px solid #d1d5db; padding: 8px;"></td>
                    </tr>
                    <!-- Total -->
                    <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1;">
                      <td colSpan="4" style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 800; color: #0f172a; font-size: 13px;">Total Final:</td>
                      <td style="border: 1px solid #d1d5db; padding: 8px; color: #1e3a8a; font-size: 14px; font-weight: 800; text-align: right; white-space: nowrap;">${formatMoney(total)}</td>
                      <td style="border: 1px solid #d1d5db; padding: 8px;"></td>
                    </tr>
                  </tbody>
                </table>

                <div style="margin-top: 30px; font-size: 13px; color: #475569; line-height: 1.5;">
                  <p><em>Nota: Los precios indicados son netos y están sujetos a variaciones de stock. Puedes ingresar a la plataforma con tu cuenta corporativa para realizar la compra o cotizar formalmente.</em></p>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${appUrl}/products" style="display: inline-block; background-color: #1e3a8a; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 30px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    Ir a la Tienda Mayorista
                  </a>
                </div>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #475569;">Jdevoto.cl - B2B eCommerce</p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">Este es un correo enviado desde la lista de deseos de un usuario registrado en J. Devoto.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}


export async function sendAnalyticsPurgeEmail(csvContent: string) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'jespejo@jdevoto.cl';
  const transporter = await getTransporter();
  
  const mailOptions = {
    from: `"J. Devoto Sistema" <${process.env.SMTP_FROM || 'no-reply@jdevoto.cl'}>`,
    to: adminEmail,
    subject: '📊 Respaldo de Analíticas - Purgado Automático',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Respaldo de Analíticas</h2>
        <p>Hola Administrador,</p>
        <p>Adjunto encontrarás el archivo CSV con las analíticas transaccionales de los últimos días.</p>
        <p>Los datos han sido purgados de la base de datos de Neon exitosamente para liberar espacio.</p>
        <br>
        <p>Saludos,<br>Sistema Comercial J. Devoto</p>
      </div>
    `,
    attachments: [
      {
        filename: `analytics-backup-${new Date().toISOString().split('T')[0]}.csv`,
        content: csvContent,
        contentType: 'text/csv'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Backup de analíticas enviado:', info.messageId);
    if (info.messageId && info.messageId.includes('@')) {
      // Ethereal url if it's test
      console.log('🔗 URL de Ethereal (si aplica):', nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error('❌ Error enviando backup de analíticas:', error);
    return false;
  }
}
