import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { logAuditAction } from "@/lib/audit";

const NotifyImportSchema = z.object({
  successCount: z.number().int().min(0),
  failuresCount: z.number().int().min(0),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const body = await req.json();
  const { successCount, failuresCount } = NotifyImportSchema.parse(body);

  if (successCount > 0) {
    await logAuditAction({
      userId: user.id,
      action: "CATALOG_IMPORTED",
      entity: "Catalog",
      details: {
        successCount,
        failuresCount,
      },
      req,
    });
  }

  return ok({ message: "Notificación enviada" });
});
