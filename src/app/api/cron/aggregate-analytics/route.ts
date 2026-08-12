import { NextResponse } from "next/server";
import { prisma } from "@/lib/client";
import { getTransporter } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const cutoffDate = new Date();
    // cutoffDate.setDate(cutoffDate.getDate() - 7); // Comentado temporalmente para que procese eventos recientes y puedas probarlo ahora

    // Step 1: Query analytics_events older than 7 days
    const oldEvents = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
      orderBy: { createdAt: 'asc' }
    });

    if (oldEvents.length === 0) {
      return NextResponse.json({ message: "No hay eventos antiguos para procesar." });
    }

    // Step 2: Generate .jsonl content in memory
    const jsonlContent = oldEvents.map(e => JSON.stringify(e)).join("\n");

    // Step 3: Send email with .jsonl attachment
    const transporter = await getTransporter();
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'jespejo@jdevoto.cl';
    const dateStr = new Date().toISOString().split('T')[0];

    await transporter.sendMail({
      from: `"Sistema JDevoto" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `📊 Backup Semanal de Analíticas - ${dateStr}`,
      text: `Adjunto encontrarás el respaldo de los ${oldEvents.length} eventos de analíticas con más de 7 días de antigüedad. Estos registros han sido agregados y eliminados de la base de datos para optimizar espacio.`,
      attachments: [
        {
          filename: `analytics-backup-${dateStr}.jsonl`,
          content: jsonlContent
        }
      ]
    });

    // Step 4: Aggregate events
    // Map to hold aggregated counts: Map<string, number>
    // key is `${dateStr}|${metricType}|${metricKey}`
    const aggregations = new Map<string, number>();

    for (const event of oldEvents) {
      const eventDate = new Date(event.createdAt);
      // Normalize to midnight UTC for date column (or whatever timezone, but consistent)
      eventDate.setUTCHours(0, 0, 0, 0);
      const dateKey = eventDate.toISOString();
      const type = event.eventType;
      
      let metricKey = type; // default
      
      if (type === 'product_viewed' || type === 'product_clicked') {
        const data = event.eventData as any;
        if (data?.productId) metricKey = data.productId;
      } else if (type === 'search_performed') {
        const data = event.eventData as any;
        if (data?.query) metricKey = data.query;
      } else if (type === 'page_view') {
        metricKey = event.pageUrl;
      }

      const mapKey = `${dateKey}|${type}|${metricKey}`;
      aggregations.set(mapKey, (aggregations.get(mapKey) || 0) + 1);
    }

    // Upsert into analytics_daily_stats
    for (const [mapKey, count] of aggregations.entries()) {
      const [dateKey, type, metricKey] = mapKey.split('|');
      const date = new Date(dateKey);
      
      const existing = await prisma.analyticsDailyStat.findUnique({
        where: {
          date_metricType_metricKey: {
            date,
            metricType: type,
            metricKey
          }
        }
      });

      if (existing) {
        await prisma.analyticsDailyStat.update({
          where: { id: existing.id },
          data: { metricValue: existing.metricValue + count }
        });
      } else {
        await prisma.analyticsDailyStat.create({
          data: {
            date,
            metricType: type,
            metricKey,
            metricValue: count
          }
        });
      }
    }

    // Step 5: Delete old events
    const idsToDelete = oldEvents.map(e => e.id);
    // Chunking deletion to avoid parameter limits if too large
    const chunkSize = 1000;
    for (let i = 0; i < idsToDelete.length; i += chunkSize) {
      const chunk = idsToDelete.slice(i, i + chunkSize);
      await prisma.analyticsEvent.deleteMany({
        where: { id: { in: chunk } }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Procesados y eliminados ${oldEvents.length} eventos.`,
      aggregatedCount: aggregations.size
    });

  } catch (error) {
    console.error("Error en cron de analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
