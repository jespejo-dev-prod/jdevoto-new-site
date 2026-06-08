import { NextRequest } from "next/server";
import { prisma } from "@/lib/client";
import { withApiHandler, ok, created, noContent } from "@/lib/api-handler";
import { extractUserFromRequest, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { CategorySchema } from "@/validations/taxonomy.schemas";
import { NotFoundError } from "@/lib/errors";

export const GET = withApiHandler(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      parent: {
        select: {
          name: true,
        },
      },
    },
  });
  return ok(categories);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const body = await req.json();
  const data = CategorySchema.parse(body);

  const category = await prisma.category.create({
    data,
  });

  return created(category);
});

// Nota: Para DELETE, Prisma requiere que las categorías no tengan productos asociados
// o que se maneje la cascada. En este esquema, Product tiene categoryId opcional.
export const DELETE = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) throw new Error("ID de categoría requerido");

  const existing = await prisma.category.findUnique({ where: { id } });
  if (existing) {
    await prisma.category.delete({ where: { id } });
  }

  return noContent();
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) throw new Error("ID de categoría requerido");

  const body = await req.json();
  const data = CategorySchema.partial().parse(body);

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Categoría", id);

  const updated = await prisma.category.update({
    where: { id },
    data,
  });

  return ok(updated);
});
