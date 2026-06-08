/**
 * validations/product.schemas.ts
 *
 * Esquemas Zod para validación de datos de Productos.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);


export const GetProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().cuid().optional(),
  search: z.string().min(1).max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
});

export type GetProductsQuery = z.infer<typeof GetProductsQuerySchema>;

export const CreateProductSchema = z.object({
  sku: z.string().min(1).max(50, "SKU demasiado largo").toUpperCase(),
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug solo permite letras minúsculas, números y guiones"),
  description: z.string().max(5000).optional(),
  unit: z.enum(["UN", "KG", "LT", "MT", "M2", "M3", "PAR", "CJA", "BOL"]).default("UN"),
  basePrice: z.coerce.number().positive("El precio debe ser mayor a 0").max(999999999999.99, "Precio demasiado grande"),
  stockQuantity: z.coerce.number().min(0, "El stock no puede ser negativo").max(1000000000000, "Stock demasiado grande").default(0),
  minOrderQty: z.coerce.number().int().min(1, "Pedido mínimo es 1").default(1),
  stockAlert: z.coerce.number().int().min(0).default(5),
  inner: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  
  // Categoría y Marca ahora son obligatorias
  categoryId: z.string().min(1, "Debes seleccionar una categoría válida"),
  brandId: z.string().min(1, "Debes seleccionar una marca válida"),

  // Array de URLs e info de imágenes del producto (max 4)
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        position: z.number().int().min(0),
        altText: z.string().optional().nullable(),
        isPrimary: z.boolean().default(false)
      })
    )
    .min(1, "Debes incluir al menos 1 imagen")
    .max(4, "Máximo 4 imágenes por producto")
    .default([]),
  weight: z.coerce.number().min(0).max(999999999, "Peso demasiado grande").optional(),
  length: z.coerce.number().min(0).max(999999999, "Largo demasiado grande").optional(),
  width: z.coerce.number().min(0).max(999999999, "Ancho demasiado grande").optional(),
  height: z.coerce.number().min(0).max(999999999, "Alto demasiado grande").optional(),
  // SEO Avanzado (Opcional)
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(1000).optional(),
  // Ficha Técnica (Opcional)
  specifications: z.preprocess(
    (val) => {
      if (!Array.isArray(val)) return [];
      return val;
    },
    z.array(z.object({
      name: z.string().optional().nullable(),
      value: z.string().optional().nullable()
    }))
  ).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial().omit({ sku: true });
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
