/**
 * src/validations/taxonomy.schemas.ts
 */

import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
});

export const BrandSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().max(1000, "La URL es demasiado larga").optional().nullable(),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
export type BrandInput = z.infer<typeof BrandSchema>;
