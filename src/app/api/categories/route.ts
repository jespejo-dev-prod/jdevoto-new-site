export const dynamic = "force-dynamic";

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
    // 1. Obtener o crear la categoría por defecto "Sin categoría"
    let defaultCategory = await prisma.category.findUnique({
      where: { slug: "sin-categoria" }
    });

    if (!defaultCategory) {
      defaultCategory = await prisma.category.findFirst({
        where: { name: { equals: "Sin categoría", mode: "insensitive" } }
      });

      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            name: "Sin categoría",
            slug: "sin-categoria",
            description: "Productos sin categoría asignada",
          }
        });
      }
    }

    // Bloquear eliminación de la categoría por defecto
    if (existing.id === defaultCategory.id) {
      throw new Error("No se puede eliminar la categoría por defecto 'Sin categoría'");
    }

    // 2. Eliminar promociones asociadas a esta categoría
    await prisma.promotion.deleteMany({
      where: { categoryId: existing.id }
    });

    // 3. Promover subcategorías reasignando su parentId al parentId de la categoría que se elimina
    await prisma.category.updateMany({
      where: { parentId: existing.id },
      data: { parentId: existing.parentId }
    });

    // 4. Reasignar productos a "Sin categoría"
    await prisma.product.updateMany({
      where: { categoryId: existing.id },
      data: { categoryId: defaultCategory.id }
    });

    // 5. Eliminar físicamente la categoría
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
