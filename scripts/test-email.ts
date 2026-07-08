import { prisma } from '../src/lib/client';
import { sendOrderEmail } from '../src/lib/email';

async function main() {
  console.log('--- Probando envío de correo de pedido local ---');
  
  // Intentar buscar el último pedido en la base de datos
  let order: any = null;
  try {
    order = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        createdBy: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  } catch (error) {
    console.log('⚠️ No se pudo consultar la base de datos para obtener un pedido real (o no hay conexión).');
  }

  // Si no hay pedido real, creamos uno de prueba idéntico en estructura
  if (order) {
    console.log(`✅ Pedido real encontrado en la base de datos: #${order.orderNumber}`);
  } else {
    console.log('ℹ️ Usando datos de prueba (Mock Order) para el envío...');
    order = {
      id: 'mock-order-id-12345',
      orderNumber: 'ORD-2026-0016',
      createdAt: new Date(),
      subtotalNet: 187312,
      discountAmount: 20813,
      taxAmount: 35589,
      totalGross: 222901,
      notes: 'Por favor despachar por la mañana.',
      company: {
        rut: '76123456-0',
        razonSocial: 'Jdevoto Distribuciones S.A.'
      },
      createdBy: {
        firstName: 'admin',
        lastName: 'cliente'
      },
      items: [
        {
          id: 'item-1',
          productName: 'PAPEL TERMICO 57 x 40 x 17mts',
          quantity: 125,
          unitNetPrice: 1413,
          productSku: '0230056'
        },
        {
          id: 'item-2',
          productName: 'FUNDA PLASTICA',
          quantity: 700,
          unitNetPrice: 45,
          productSku: '0150102'
        }
      ],
      shippingAddress: {
        street: 'Av. Providencia 1234',
        number: 'Of 502',
        comuna: 'PROVIDENCIA',
        region: 'METROPOLITANA DE SANTIAGO'
      }
    };
  }

  // Correo de destino preferido
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL || 'jespejo@jdevoto.cl';
  console.log(`Destinatario del correo: ${recipient}`);
  console.log('Enviando...');

  const result = await sendOrderEmail(order, recipient);

  if (result.success) {
    console.log('==========================================');
    console.log('🎉 ¡CORREO ENVIADO CON ÉXITO!');
    console.log(`ID del mensaje: ${result.messageId}`);
    console.log('==========================================');
  } else {
    console.error('❌ Error al enviar el correo:', result.error);
  }
}

main()
  .catch(err => {
    console.error('Error general ejecutando el script:', err);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
  });
