/**
 * lib/utils.ts
 *
 * Utilidades compartidas del proyecto.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Tailwind ─────────────────────────────────────────────────────────────────

/** Combina clases de Tailwind sin conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Prisma Serialization ─────────────────────────────────────────────────────

/**
 * serializeDecimal
 *
 * Prisma retorna objetos Decimal (decimal.js) y BigInt que no son serializables 
 * directamente a Client Components en Next.js.
 *
 * Esta función limpia recursivamente el objeto para asegurar que solo pasen
 * objetos planos con Numbers en lugar de Decimals.
 */
export function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  // Si es un array, serializar cada elemento
  if (Array.isArray(obj)) {
    return obj.map(item => serializeDecimal(item)) as unknown as T;
  }

  // Si es un bigint
  if (typeof obj === 'bigint') {
    return Number(obj) as unknown as T;
  }

  // Si no es un objeto o es un tipo primitivo, retornar tal cual
  if (typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  // Si es un objeto Decimal (tiene el método toJSON o es de Prisma)
  // Nota: Verificamos si tiene el método toJSON que devuelve un string numérico
  if (obj.constructor && obj.constructor.name === 'Decimal') {
    return Number(obj) as unknown as T;
  }

  const result = { ...obj } as Record<string, unknown>;

  const numericFields = [
    "basePrice", "stockQuantity", "minOrderQty", "stockAlert",
    "inner", "weight", "length", "width", "height",
    "defaultDiscount", "discount", "unitGrossPrice", "unitNetPrice",
    "discountedNetPrice", "taxAmount"
  ];

  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const value = result[key];

      if (numericFields.includes(key) && value !== null && value !== undefined) {
        result[key] = Number(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = serializeDecimal(value);
      }
    }
  }

  return result as T;
}
