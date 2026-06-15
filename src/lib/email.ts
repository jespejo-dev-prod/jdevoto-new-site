import nodemailer from 'nodemailer';

// Cache transporter to avoid recreating test accounts constantly
let transporterInstance: nodemailer.Transporter | null = null;

async function getTransporter() {
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

export async function sendOrderEmail(order: any, customerEmail: string) {
  try {
    const transporter = await getTransporter();

    const htmlContent = generateOrderHtml(order, customerEmail);

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'ventas@jdevoto.cl'}>`,
      to: customerEmail,
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
      subject: `Nuevo pedido (${order.orderNumber})`,
      html: htmlContent,
    });

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

function generateOrderHtml(order: any, customerEmail: string) {
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

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Pedido ${order.orderNumber}</title>
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
                  ¡Nuevo Pedido Confirmado!
                </h1>
                
                <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Has recibido el siguiente pedido del cliente corporativo:
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
                      <td style="font-size: 13px; font-weight: 600; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Creado por:</td>
                      <td style="font-size: 13px; font-weight: 600; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${creatorFormatted}</td>
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
                    Ver Pedido #${order.orderNumber}
                  </a>
                </div>

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
        <h2 style="color: #1e40af;">Actualización en tu pedido #${order.orderNumber}</h2>
        <p>Hola,</p>
        <p>Tienes una nueva actualización o documento adjunto para tu pedido.</p>
        
        ${messageData.message ? `
        <div class="message-box">
          <strong>Mensaje:</strong><br>
          ${messageData.message.replace(/\n/g, '<br>')}
        </div>
        ` : ''}

        ${attachments.length > 0 ? `
        <p style="margin-top: 20px;"><strong>📎 Se ha adjuntado un documento a este correo.</strong></p>
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
      subject: `Actualización de pedido #${order.orderNumber}`,
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
        .btn { display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; margin-bottom: 20px; }
      </style>
    </head>
    <body style="background-color: #f9fafb; padding: 40px 0;">
      <div class="container">
        <h2 style="color: #1e40af; margin-top: 0;">Restablecer contraseña</h2>
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Jdevoto.cl asociada a este correo electrónico.</p>
        <p>Si fuiste tú, haz clic en el siguiente botón para elegir una nueva contraseña:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="btn">Restablecer mi contraseña</a>
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
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
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

    const shipping = order.shippingAddress || {};

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; }
        .btn { display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body style="background-color: #f9fafb; padding: 40px 0;">
      <div class="container">
        <h2 style="color: #16a34a; margin-top: 0;">¡Tu pedido ha sido enviado! 🚚</h2>
        <p>Hola,</p>
        <p>Nos complace informarte que tu pedido <strong>#${order.orderNumber}</strong> ha sido despachado y está en camino a la dirección de envío registrada.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 6px; font-size: 14px; color: #374151;">
          <strong>Dirección de Despacho:</strong><br>
          ${shipping.street || ''} ${shipping.number || ''}<br>
          ${shipping.comuna || ''}, ${shipping.region || ''}
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/orders/${order.id}" class="btn">Ver Estado del Pedido</a>
        </div>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Si tienes alguna consulta, por favor contáctanos respondiendo a este correo.
        </p>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'despachos@jdevoto.cl'}>`,
      to: customerEmail,
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
      subject: `Tu pedido #${order.orderNumber} ha sido enviado 🚚`,
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
        .btn { display: inline-block; background-color: #1e40af; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body style="background-color: #f9fafb; padding: 20px;">
      <div class="container">
        <h2 style="color: #1e40af; margin-top: 0;">${title}</h2>
        <p>${message}</p>
        ${link ? `<a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${link}" class="btn">Ver en la plataforma</a>` : ''}
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'notificaciones@jdevoto.cl'}>`,
      to: email,
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
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

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; }
        .btn { display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body style="background-color: #f9fafb; padding: 40px 0;">
      <div class="container">
        <h2 style="color: #1e40af; margin-top: 0;">Actualización de Estado de Pedido 📋</h2>
        <p>Hola,</p>
        <p>El estado de tu pedido <strong>#${order.orderNumber}</strong> ha sido actualizado a: <strong>${order.status}</strong>.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/orders/${order.id}" class="btn">Ver Pedido en la Tienda</a>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Jdevoto.cl" <${process.env.SMTP_USER || 'ventas@jdevoto.cl'}>`,
      to: customerEmail,
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
      subject: `Actualización de estado pedido #${order.orderNumber} -> ${order.status}`,
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
