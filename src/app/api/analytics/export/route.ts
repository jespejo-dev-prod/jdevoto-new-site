import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/client";
import { extractUserFromRequest, requireRole, verifyToken } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    let user;
    const searchParams = req.nextUrl.searchParams;
    const tokenQuery = searchParams.get('token');
    
    if (tokenQuery) {
      const payload = verifyToken(tokenQuery);
      user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        companyId: payload.companyId,
        firstName: "",
        lastName: "",
      } as any;
    } else {
      user = extractUserFromRequest(req);
    }
    
    requireRole(user, [UserRole.ADMIN]);
    
    const format = searchParams.get('format') || 'jsonl';
    
    let fromDate = searchParams.get('from') ? new Date(searchParams.get('from') as string) : new Date();
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to') as string) : new Date();

    if (!searchParams.get('from')) {
      fromDate.setDate(fromDate.getDate() - 7);
    }

    const transactionalEvents = [
      'added_to_cart', 'removed_from_cart', 'checkout_started', 
      'payment_method_selected', 'payment_failed', 'order_confirmed',
      'order_pending', 'order_shipped', 'order_delivered', 
      'order_cancelled', 'order_rejected', 'order_status_changed',
      'promotion_clicked', 'promotion_product_clicked'
    ];

    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        },
        eventType: {
          in: transactionalEvents
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const headers = "id,sessionId,userId,eventType,eventData,pageUrl,referrer,userAgent,ipAddress,createdAt\n";
      const rows = events.map(e => {
        const eventDataStr = e.eventData ? JSON.stringify(e.eventData).replace(/"/g, '""') : '{}';
        return `"${e.id}","${e.sessionId}","${e.userId || ''}","${e.eventType}","${eventDataStr}","${e.pageUrl}","${e.referrer || ''}","${e.userAgent || ''}","${e.ipAddress || ''}","${e.createdAt.toISOString()}"`;
      }).join("\n");
      
      const content = headers + rows;
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-raw-${dateStr}.csv"`
        }
      });
    } else {
      const content = events.map(e => JSON.stringify(e)).join("\n");
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Content-Disposition': `attachment; filename="analytics-raw-${dateStr}.jsonl"`
        }
      });
    }
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
