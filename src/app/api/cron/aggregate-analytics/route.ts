import { NextResponse } from "next/server";
import { prisma } from "@/lib/client";
import { getTransporter } from "@/lib/email";
import { UAParser } from "ua-parser-js";
import * as XLSX from "xlsx";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cutoffDate = new Date();
    // cutoffDate.setDate(cutoffDate.getDate() - 7);

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

    // Calcular fechas
    const startDate = new Date(oldEvents[0].createdAt);
    const endDate = new Date(oldEvents[oldEvents.length - 1].createdAt);
    
    const formatDateForFilename = (d: Date) => d.toISOString().split('T')[0];
    const dateRangeStr = `${formatDateForFilename(startDate)}-to-${formatDateForFilename(endDate)}`;

    const formatReadableDate = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const day = pad(d.getUTCDate());
      const month = pad(d.getUTCMonth() + 1);
      const year = d.getUTCFullYear();
      const hours = pad(d.getUTCHours());
      const minutes = pad(d.getUTCMinutes());
      const seconds = pad(d.getUTCSeconds());
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} hrs`;
    };

    // Resumen para el correo
    const eventCountsByType: Record<string, number> = {};
    const uniqueSessions = new Set<string>();
    const uniqueUsers = new Set<string>();

    // Arrays para CSV y JSONL
    const csvRows: string[] = [];
    const csvHeaders = [
      'id', 'createdAt', 'eventType', 'sessionId', 'userId',
      'productId', 'sku', 'price', 'quantity', 'priceSource',
      'pageUrl', 'referrer',
      'browser', 'operatingSystem', 'deviceType',
      'userAgentRaw', 'ipAddress'
    ];
    csvRows.push(csvHeaders.join(','));

    const jsonlRows: string[] = [];

    // Parseador de User Agent
    const parser = new UAParser();

    // Step 2: Generar datos CSV y JSONL y resumen
    for (const event of oldEvents) {
      // JSONL
      jsonlRows.push(JSON.stringify(event));

      // Resumen
      eventCountsByType[event.eventType] = (eventCountsByType[event.eventType] || 0) + 1;
      if (event.sessionId) uniqueSessions.add(event.sessionId);
      if (event.userId) uniqueUsers.add(event.userId);

      // Parseo User Agent
      parser.setUA(event.userAgent || '');
      const browserInfo = parser.getBrowser();
      const osInfo = parser.getOS();
      const deviceInfo = parser.getDevice();

      const browser = `${browserInfo.name || ''} ${browserInfo.version || ''}`.trim();
      const os = `${osInfo.name || ''} ${osInfo.version || ''}`.trim();
      const deviceType = deviceInfo.type || 'desktop';

      // Event Data
      const data = (event.eventData || {}) as any;

      // Escape helper para CSV
      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '';
        const stringified = String(str);
        if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
          return `"${stringified.replace(/"/g, '""')}"`;
        }
        return stringified;
      };

      const row = [
        event.id,
        formatReadableDate(new Date(event.createdAt)),
        event.eventType,
        event.sessionId,
        event.userId,
        data.productId,
        data.sku,
        data.price,
        data.quantity,
        data.priceSource,
        event.pageUrl,
        event.referrer,
        browser,
        os,
        deviceType,
        event.userAgent,
        event.ipAddress
      ].map(escapeCsv);

      csvRows.push(row.join(','));
    }

    const jsonlContent = jsonlRows.join("\n");
    const csvContent = csvRows.join("\n");

    // Generar XLSX
    // Utilizaremos los mismos datos del CSV pero transformados a array bidimensional
    const excelData = [csvHeaders];
    for (const event of oldEvents) {
      parser.setUA(event.userAgent || '');
      const browserInfo = parser.getBrowser();
      const osInfo = parser.getOS();
      const deviceInfo = parser.getDevice();
      const browser = `${browserInfo.name || ''} ${browserInfo.version || ''}`.trim();
      const os = `${osInfo.name || ''} ${osInfo.version || ''}`.trim();
      const deviceType = deviceInfo.type || 'desktop';
      const data = (event.eventData || {}) as any;

      excelData.push([
        event.id,
        formatReadableDate(new Date(event.createdAt)),
        event.eventType,
        event.sessionId || '',
        event.userId || '',
        data.productId || '',
        data.sku || '',
        data.price || '',
        data.quantity || '',
        data.priceSource || '',
        event.pageUrl || '',
        event.referrer || '',
        browser,
        os,
        deviceType,
        event.userAgent || '',
        event.ipAddress || ''
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Email Body
    let emailText = `Reporte semanal de analíticas\n\n`;
    emailText += `Este archivo contiene todos los eventos registrados entre:\n`;
    emailText += `${formatReadableDate(startDate)}\n`;
    emailText += `y\n`;
    emailText += `${formatReadableDate(endDate)}\n\n`;
    emailText += `Total de eventos: ${oldEvents.length}\n\n`;
    emailText += `Eventos por tipo:\n`;
    for (const [type, count] of Object.entries(eventCountsByType)) {
      emailText += `- ${type}: ${count}\n`;
    }
    emailText += `\nSesiones únicas: ${uniqueSessions.size}\n`;
    emailText += `Usuarios únicos: ${uniqueUsers.size}\n`;

    // Step 3: Send email with attachments
    const transporter = await getTransporter();
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'jespejo@jdevoto.cl';

    await transporter.sendMail({
      from: `"Sistema JDevoto" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `📊 Backup Semanal de Analíticas - ${dateRangeStr}`,
      text: emailText,
      attachments: [
        {
          filename: `analytics-events-${dateRangeStr}.xlsx`,
          content: excelBuffer
        },
        {
          filename: `analytics-events-${dateRangeStr}.csv`,
          content: csvContent
        },
        {
          filename: `analytics-events-${dateRangeStr}.jsonl`,
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
