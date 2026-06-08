import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/client";

// ============================================================
// GET /api/notifications
// ============================================================

export const GET = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false }
  });

  return ok({ notifications, unreadCount });
});

// ============================================================
// PATCH /api/notifications
// ============================================================

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  const body = await req.json().catch(() => ({}));

  if (body.all) {
    // Marcar todas como leídas
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    });
  } else if (body.notificationIds && Array.isArray(body.notificationIds)) {
    // Marcar específicas como leídas
    await prisma.notification.updateMany({
      where: { 
        userId: user.id, 
        id: { in: body.notificationIds } 
      },
      data: { isRead: true }
    });
  }

  return ok({ success: true });
});
