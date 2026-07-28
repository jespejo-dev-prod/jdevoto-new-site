import { NextResponse } from 'next/server';
import { prisma } from '@/lib/client';
import { sendAnalyticsPurgeEmail } from '@/lib/email';

// Required for Vercel Cron
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Basic protection (optional)
    const { searchParams } = new URL(req.url);
    const testMode = searchParams.get('test') === 'true';
    
    // In production, Vercel sets this header for cron requests
    const authHeader = req.headers.get('authorization');
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    
    if (!isVercelCron && !testMode && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine the cutoff date (events older than this will be purged)
    // For testing (test=true), we purge ALL events.
    // For normal cron, we purge events older than 7 days.
    const cutoffDate = new Date();
    if (!testMode) {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    }

    // 1. Fetch the events
    const eventsToPurge = await prisma.analyticsEvent.findMany({
      where: testMode ? {} : {
        createdAt: {
          lt: cutoffDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (eventsToPurge.length === 0) {
      return NextResponse.json({ message: 'No hay eventos para purgar.' });
    }

    // 2. Generate CSV
    const headers = "id,sessionId,userId,eventType,eventData,pageUrl,referrer,userAgent,ipAddress,createdAt\n";
    const rows = eventsToPurge.map(e => {
      const eventDataStr = e.eventData ? JSON.stringify(e.eventData).replace(/"/g, '""') : '{}';
      return `"${e.id}","${e.sessionId}","${e.userId || ''}","${e.eventType}","${eventDataStr}","${e.pageUrl}","${e.referrer || ''}","${e.userAgent || ''}","${e.ipAddress || ''}","${e.createdAt.toISOString()}"`;
    }).join("\n");
    const csvContent = headers + rows;

    // 3. Send email with attachment
    const emailSent = await sendAnalyticsPurgeEmail(csvContent);
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send backup email. Aborting purge.' }, { status: 500 });
    }

    // 4. Delete the events from the database
    const deleteResult = await prisma.analyticsEvent.deleteMany({
      where: testMode ? {} : {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    return NextResponse.json({ 
      message: 'Purge completed successfully', 
      recordsPurged: deleteResult.count 
    });

  } catch (error) {
    console.error('CRON Purge Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
