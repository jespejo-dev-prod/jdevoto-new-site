import { NextResponse } from "next/server";
import { prisma } from "@/lib/client";
import { getTransporter } from "@/lib/email"; // Tendremos que exportar getTransporter

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Verificar seguridad (asegurarnos de que solo Vercel Cron pueda llamarlo)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Calcular la fecha de corte (ej. hace 30 días)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    // 3. Buscar las órdenes abandonadas (DRAFT o PENDING) más antiguas que la fecha de corte
    const oldDrafts = await prisma.order.findMany({
      where: {
        status: { in: ['DRAFT', 'PENDING'] },
        updatedAt: { lt: cutoffDate },
      },
      include: {
        company: true,
        createdBy: true,
      }
    });

    if (oldDrafts.length === 0) {
      return NextResponse.json({ message: "No hay carritos antiguos para limpiar." });
    }

    // 4. Armar el archivo CSV en memoria
    const csvHeaders = "ID Orden,Numero Orden,Fecha Creacion,Cliente,Email,Empresa,Total Neto,Total Bruto\n";
    const csvRows = oldDrafts.map(o => {
      return `"${o.id}","${o.orderNumber}","${o.createdAt.toISOString()}","${o.createdBy.firstName} ${o.createdBy.lastName}","${o.createdBy.email}","${o.company.razonSocial}",${o.subtotalNet},${o.totalGross}`;
    }).join("\n");
    const csvContent = csvHeaders + csvRows;

    // 5. Enviar el correo electrónico con el CSV adjunto
    const transporter = await getTransporter();

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'jespejo@jdevoto.cl';

    await transporter.sendMail({
      from: `"Sistema JDevoto" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `🧹 Reporte Mensual de Carritos Abandonados - Limpieza Automática`,
      text: `Adjunto encontrarás el reporte de los ${oldDrafts.length} carritos abandonados con más de 30 días de antigüedad. Estos registros han sido eliminados de la base de datos para optimizar espacio.`,
      attachments: [
        {
          filename: `carritos-abandonados-${new Date().toISOString().split('T')[0]}.csv`,
          content: csvContent
        }
      ]
    });

    // 6. Eliminar los registros de la base de datos de Neon
    const idsToDelete = oldDrafts.map(o => o.id);
    await prisma.order.deleteMany({
      where: { id: { in: idsToDelete } }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Se enviaron y eliminaron ${oldDrafts.length} carritos abandonados.` 
    });

  } catch (error) {
    console.error("Error en cron de limpieza:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
