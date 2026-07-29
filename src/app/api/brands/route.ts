export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, created, noContent } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { BrandSchema } from "@/validations/taxonomy.schemas";
import { NotFoundError } from "@/lib/errors";
import { logAuditAction } from "@/lib/audit";

export const GET = withApiHandler(async () => {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
  });
  return ok(brands);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const body = await req.json();
  const data = BrandSchema.parse(body);

  const brand = await prisma.brand.create({
    data,
  });

  logAuditAction({
    userId: user.id,
    action: "BRAND_CREATED",
    entity: "Brand",
    entityId: brand.id,
    details: { name: brand.name },
    req,
  });

  return created(brand);
});

export const DELETE = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) throw new Error("ID de marca requerido");

  const existing = await prisma.brand.findUnique({ where: { id } });
  if (existing) {
    await prisma.brand.delete({ where: { id } });
    
    logAuditAction({
      userId: user.id,
      action: "BRAND_DELETED",
      entity: "Brand",
      entityId: id,
      req,
    });
  }

  return noContent();
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) throw new Error("ID de marca requerido");

  const body = await req.json();
  const data = BrandSchema.partial().parse(body);

  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Marca", id);

  const updated = await prisma.brand.update({
    where: { id },
    data,
  });

  logAuditAction({
    userId: user.id,
    action: "BRAND_UPDATED",
    entity: "Brand",
    entityId: id,
    details: { changes: Object.keys(data) },
    req,
  });

  return ok(updated);
});
