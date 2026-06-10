import nodemailer from 'nodemailer';

// Cache transporter to avoid recreating test accounts constantly
let transporterInstance: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporterInstance) return transporterInstance;

  // Use real SMTP in production if configured
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
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
      from: '"Tu Tienda B2B" <ventas@tutiendab2b.cl>',
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
    `$${Number(val).toLocaleString('es-CL')}`;

  const company = order.company || {};
  const createdBy = order.createdBy || {};
  const items = order.items || [];
  const billing = order.billingAddress || {};
  const shipping = order.shippingAddress || {};
  const salesRep = order.salesRep || null;

  const subtotalNet = Number(order.subtotalNet) || 0;
  const taxAmount = Number(order.taxAmount) || 0;
  const discountAmount = Number(order.discountAmount) || 0;
  const totalGross = Number(order.totalGross) || 0;
  const totalNet = subtotalNet - discountAmount;

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb; color: #374151;">${item.productName || item.product?.name || 'Producto'}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; color: #374151; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; color: #374151; text-align: right;">${formatMoney(item.unitNetPrice)}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; color: #374151; text-align: center;">${item.productSku || item.product?.sku || '-'}</td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 800px; margin: 0 auto; padding: 20px; }
      .header { margin-bottom: 24px; }
      .header h2 { color: #1e40af; margin: 0 0 8px 0; font-size: 16px; }
      .header a { color: #2563eb; text-decoration: none; font-size: 16px; font-weight: 500; }
      .header a:hover { text-decoration: underline; }
      
      table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px; }
      th { background-color: #f9fafb; padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #4b5563; font-weight: 600; }
      td { padding: 12px; border: 1px solid #e5e7eb; }
      .totals-row td { padding: 12px; border: 1px solid #e5e7eb; }
      .totals-label { font-weight: 600; color: #374151; text-align: left; }
      .totals-value { text-align: left; color: #374151; }
      
      .billing-section { margin-top: 32px; border-top: 1px solid #e5e7eb; pt-4; }
      .billing-section h3 { color: #1e40af; font-size: 16px; margin-bottom: 16px; }
      .billing-details { color: #6b7280; font-style: italic; font-size: 14px; line-height: 1.5; }
      .billing-details strong { font-style: normal; color: #374151; }
      
      .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div style="text-align: left; margin-bottom: 30px;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_APP_URL + '/logo.png' : 'https://placehold.co/200x50/1e40af/ffffff?text=Tu+Tienda+B2B'}" alt="Logo de la Empresa" style="max-height: 50px;" />
      </div>
      <div class="header">
        <h2 style="margin-bottom: 4px; color: #1e40af; font-size: 16px;">Datos del Cliente</h2>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
          <strong>RUT:</strong> ${company.rut || '-'}<br>
          <strong>Razón Social:</strong> ${company.razonSocial || '-'}<br>
          ${company.giro ? `<strong>Giro:</strong> ${company.giro}<br>` : ''}
          <strong>Teléfono:</strong> ${company.telefono || createdBy.phone || billing.phone || 'No especificado'}<br>
          <strong>Correo:</strong> <a href="mailto:${billing.email || customerEmail}">${billing.email || customerEmail}</a>
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/orders/${order.id}" style="display: inline-block; margin-bottom: 20px;">Ver Pedido #${order.orderNumber}</a>
      </div>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align: center;">Cantidad</th>
            <th style="text-align: right;">Precio</th>
            <th style="text-align: center;">SKU</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          
          <tr class="totals-row">
            <td colspan="2" class="totals-label">Subtotal:</td>
            <td colspan="2" class="totals-value">${formatMoney(subtotalNet)}</td>
          </tr>
          
          ${discountAmount > 0 ? `
          <tr class="totals-row">
            <td colspan="2" class="totals-label">Descuento Especial:</td>
            <td colspan="2" class="totals-value">-${formatMoney(discountAmount)}</td>
          </tr>
          ` : ''}
          
          <tr class="totals-row">
            <td colspan="2" class="totals-label">IVA:</td>
            <td colspan="2" class="totals-value">${formatMoney(taxAmount)}</td>
          </tr>

          <tr class="totals-row">
            <td colspan="2" class="totals-label">Total Neto:</td>
            <td colspan="2" class="totals-value">${formatMoney(totalNet)}</td>
          </tr>

          <tr class="totals-row">
            <td colspan="2" class="totals-label">Total:</td>
            <td colspan="2" class="totals-value">${formatMoney(totalGross)}</td>
          </tr>
        </tbody>
      </table>

      <div class="billing-section">
        <h3>Dirección de Envío</h3>
        <div class="billing-details">
          ${shipping.street ? shipping.street + '<br>' : 'Dirección no especificada<br>'}
          ${shipping.comuna ? shipping.comuna + '<br>' : ''}
          ${shipping.region ? shipping.region + '<br>' : ''}
          <br>
          Felicidades por la venta.
        </div>
      </div>

      ${salesRep ? `
      <div style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 14px; color: #4b5563;">
        <h3 style="color: #1e40af; font-size: 15px; margin: 0 0 8px 0; font-weight: 600;">Tu Ejecutivo Comercial Asignado</h3>
        <p style="margin: 0; line-height: 1.5; font-style: italic;">
          <strong>Nombre:</strong> ${salesRep.firstName} ${salesRep.lastName}<br>
          <strong>Email:</strong> <a href="mailto:${salesRep.email}" style="color: #2563eb; text-decoration: none;">${salesRep.email}</a>
          ${salesRep.phone ? `<br><strong>Teléfono:</strong> ${salesRep.phone}` : ''}
        </p>
      </div>
      ` : ''}

      <div class="footer">
        Tu Tienda B2B — Hecho con tecnología moderna
      </div>
    </div>
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
      from: '"Tu Tienda B2B" <ventas@tutiendab2b.cl>',
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
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Tu Tienda B2B asociada a este correo electrónico.</p>
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
      from: '"Tu Tienda B2B" <soporte@tutiendab2b.cl>',
      to: email,
      ...(process.env.ADMIN_NOTIFICATION_EMAIL ? { bcc: process.env.ADMIN_NOTIFICATION_EMAIL } : {}),
      subject: 'Restablecer contraseña - Tu Tienda B2B',
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
      from: '"Tu Tienda B2B" <despachos@tutiendab2b.cl>',
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
      from: '"Tu Tienda B2B" <notificaciones@tutiendab2b.cl>',
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
      from: '"Tu Tienda B2B" <ventas@tutiendab2b.cl>',
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
