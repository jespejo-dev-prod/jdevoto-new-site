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
      <td style="padding: 5px 8px; border: 1px solid #d1d5db; color: #374151; font-family: Arial, sans-serif;">${item.productName || item.product?.name || 'Producto'}</td>
      <td style="padding: 5px 8px; border: 1px solid #d1d5db; color: #374151; font-family: Arial, sans-serif;">${item.quantity}</td>
      <td style="padding: 5px 8px; border: 1px solid #d1d5db; color: #374151; font-family: Arial, sans-serif;">${formatMoney(item.unitNetPrice)}</td>
      <td style="padding: 5px 8px; border: 1px solid #d1d5db; color: #374151; font-family: Arial, sans-serif;">${item.productSku || item.product?.sku || '-'}</td>
    </tr>
  `).join('');

  const creatorName = `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim().toLowerCase();

  const logoUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/logo-svg.png` 
    : 'https://www.jdevoto.cl/wp-content/uploads/2024/06/logo-svg.png';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; background-color: #ffffff; margin: 0; padding: 20px;">
    <!-- Wrapper Table for Outlook compatibility -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff;">
      <tr>
        <td align="center" style="padding: 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; text-align: left;">
            <tr>
              <td style="padding: 0;">
                
                <!-- Logo -->
                <div style="text-align: left; margin-bottom: 25px;">
                  <img src="${logoUrl}" alt="Logo Jdevoto" style="max-height: 25px; height: 25px; display: block; border: 0;" />
                </div>

                <!-- Header info -->
                <p style="font-size: 14px; color: #4b5563; margin: 0 0 15px 0; font-family: Arial, sans-serif;">
                  Has recibido el siguiente pedido de ${creatorName}:
                </p>
                
                <p style="font-size: 16px; font-weight: bold; color: #1e40af; margin: 15px 0 5px 0; font-family: Arial, sans-serif;">
                  RUT del cliente: ${company.rut || '-'}
                </p>
                
                <p style="margin: 5px 0 20px 0; font-family: Arial, sans-serif;">
                  <a href="${appUrl}/dashboard/orders/${order.id}" style="font-size: 16px; color: #2563eb; text-decoration: underline; font-weight: bold; font-family: Arial, sans-serif;">Pedido #${order.orderNumber}</a>
                </p>

                <!-- Products Table -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; font-family: Arial, sans-serif;">
                  <thead>
                    <tr>
                      <th style="border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">Producto</th>
                      <th style="border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">Cantidad</th>
                      <th style="border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">Precio</th>
                      <th style="border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                    
                    <!-- Subtotal -->
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 5px 8px; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">Subtotal:</td>
                      <td style="border: 1px solid #d1d5db; padding: 5px 8px; color: #374151; font-family: Arial, sans-serif;">${formatMoney(baseSubtotalNet)}</td>
                    </tr>
                    
                    <!-- Descuento Especial -->
                    ${discountAmount > 0 ? `
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 5px 8px; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">Descuento Especial: (${discountPct}%):</td>
                      <td style="border: 1px solid #d1d5db; padding: 5px 8px; color: #374151; font-family: Arial, sans-serif;">${formatMoney(discountAmount)}</td>
                    </tr>
                    ` : ''}

                    <!-- IVA -->
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 5px 8px; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">IVA:</td>
                      <td style="border: 1px solid #d1d5db; padding: 5px 8px; color: #374151; font-family: Arial, sans-serif;">${formatMoney(taxAmount)}</td>
                    </tr>

                    <!-- Total Neto -->
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 5px 8px; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">Total Neto:</td>
                      <td style="border: 1px solid #d1d5db; padding: 5px 8px; color: #374151; font-family: Arial, sans-serif;">${formatMoney(totalNet)}</td>
                    </tr>

                    <!-- Total -->
                    <tr>
                      <td colspan="3" style="border: 1px solid #d1d5db; padding: 5px 8px; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">Total:</td>
                      <td style="border: 1px solid #d1d5db; padding: 5px 8px; color: #374151; font-family: Arial, sans-serif;">${formatMoney(totalGross)}</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Shipping Address -->
                ${shipping.street ? `
                <div style="margin-top: 30px; border-top: 1px solid #d1d5db; padding-top: 15px; font-size: 13px; color: #4b5563; font-family: Arial, sans-serif;">
                  <p style="margin: 0 0 5px 0; font-weight: bold; color: #374151; font-family: Arial, sans-serif;">Dirección de Despacho:</p>
                  <p style="margin: 0; font-style: italic; font-family: Arial, sans-serif;">
                    ${shipping.street} ${shipping.number || ''}<br>
                    ${shipping.comuna || ''}, ${shipping.region || ''}
                  </p>
                </div>
                ` : ''}

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
