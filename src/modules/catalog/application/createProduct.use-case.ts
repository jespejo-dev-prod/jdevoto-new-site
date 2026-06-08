/**
 * modules/catalog/application/createProduct.use-case.ts
 *
 * Orquesta la creación de un nuevo producto en el catálogo.
 *
 * Flujo:
 *   1. Autorización — solo ADMIN y SALES_REP pueden crear productos
 *   2. Unicidad — valida que SKU y slug no estén en uso
 *   3. Archivos — mueve imágenes de /temp a /products
 *   4. Persistencia — transacción atómica en la base de datos
 *
 * Si la transacción falla después de mover archivos, se revierten los
 * movimientos (acción compensatoria).
 */

import { prisma } from "@/lib/client";
import { serializeDecimal } from "@/lib/utils";
import { CreateProductInput } from "@/validations/product.schemas";
import { Product, Prisma, UserRole } from "@prisma/client";
import { ConflictError, BusinessRuleError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { AuthenticatedUser } from "@/types/domain";
import { LocalStorageService } from "./services/StorageService";

// ─── Use Case ──────────────────────────────────────────────────────────────────

export async function createProductUseCase(
  data: CreateProductInput,
  user: AuthenticatedUser
): Promise<Product> {
  // 1. Solo ADMIN y SALES_REP pueden crear productos
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  // 2. Validar que SKU y slug sean únicos
  await validateUniqueness(data.sku, data.slug);

  const storage = new LocalStorageService();

  // 3. Mover imágenes de /temp a /products (preparación antes de la transacción)
  const movedUrls = await moveImages(data, storage);

  try {
    // 4. Persistir en la base de datos con una transacción atómica
    const product = await persistProduct(data);
    return serializeDecimal(product as Record<string, unknown>) as unknown as Product;
  } catch (error: any) {
    // Acción compensatoria: revertir archivos movidos si la BD falla
    if (movedUrls.length > 0) {
      await storage.rollbackMove(movedUrls).catch((e) =>
        console.error("[ROLLBACK_ERROR]", e)
      );
    }

    // Relanzar errores de dominio conocidos sin envolverlos
    if (error instanceof ConflictError || error instanceof BusinessRuleError) throw error;

    // Categoría o marca inválida (Prisma: registro relacionado no existe)
    if (error.code === "P2025") {
      throw new ConflictError("La categoría o marca seleccionada no es válida");
    }

    console.error("[CREATE_PRODUCT_ERROR]", error);
    throw new BusinessRuleError(`Error en la creación: ${error.message ?? "Error desconocido"}`);
  }
}

// ─── Sub-funciones privadas ────────────────────────────────────────────────────

/**
 * validateUniqueness
 * Verifica que el SKU y el slug no existan previamente en la base de datos.
 */
async function validateUniqueness(sku: string, slug?: string) {
  const [existingSku, existingSlug] = await Promise.all([
    prisma.product.findUnique({ where: { sku }, select: { id: true } }),
    slug ? prisma.product.findUnique({ where: { slug }, select: { id: true } }) : null,
  ]);

  if (existingSku) throw new ConflictError(`El SKU '${sku}' ya está registrado`);
  if (existingSlug) throw new ConflictError(`El enlace '${slug}' ya está en uso`);
}

/**
 * moveImages
 * Mueve las imágenes subidas desde el directorio temporal al directorio final.
 * Retorna las URLs finales para poder revertirlas si la BD falla.
 */
async function moveImages(data: CreateProductInput, storage: LocalStorageService): Promise<string[]> {
  const movedUrls: string[] = [];

  if (!data.images?.length) return movedUrls;

  for (const img of data.images) {
    if (img.url.includes("/temp/")) {
      try {
        const finalUrl = await storage.move(img.url, "products");
        movedUrls.push(finalUrl);
        img.url = finalUrl; // Actualiza la URL en el objeto para usar en la transacción
      } catch (e) {
        console.error("[STORAGE_MOVE_ERROR]", e);
        throw new BusinessRuleError("Error al procesar las imágenes del producto.");
      }
    } else {
      movedUrls.push(img.url);
    }
  }

  return movedUrls;
}

/**
 * persistProduct
 * Crea el producto y sus imágenes en una transacción atómica.
 * Si cualquier operación falla, la base de datos hace rollback automático.
 */
async function persistProduct(data: CreateProductInput): Promise<Product> {
  return prisma.$transaction(async (tx) => {
    return tx.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        unit: data.unit,
        basePrice: new Prisma.Decimal(data.basePrice),
        stockQuantity: data.stockQuantity,
        minOrderQty: data.minOrderQty,
        stockAlert: data.stockAlert,
        inner: data.inner,
        isActive: data.isActive,
        weight: data.weight != null ? new Prisma.Decimal(data.weight) : null,
        length: data.length != null ? new Prisma.Decimal(data.length) : null,
        width: data.width != null ? new Prisma.Decimal(data.width) : null,
        height: data.height != null ? new Prisma.Decimal(data.height) : null,
        category: { connect: { id: data.categoryId } },
        brand: { connect: { id: data.brandId } },
        seoTitle: data.seoTitle ?? data.name,
        seoDescription: data.seoDescription ?? data.description ?? null,
        specifications: data.specifications ?? [],
        images: {
          create: data.images.map((img) => ({
            url: img.url,
            position: img.position,
            altText: img.altText,
            isPrimary: img.isPrimary,
          })),
        },
      },
      include: { images: true },
    });
  });
}
