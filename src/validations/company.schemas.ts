/**
 * validations/company.schemas.ts
 *
 * Schemas Zod para el registro y actualización de Companies (Empresas B2B).
 *
 * FORMATO DE RUT CHILENO:
 *  ✅ Almacenar: sin puntos, con guión → "12345678-9" o "12345678-K"
 *  ❌ Rechazar: "12.345.678-9" (con puntos) o "123456789" (sin guión)
 *
 * Esto facilita:
 *  - Búsquedas exactas en la DB (un solo formato canónico)
 *  - Integración con el SII (Servicio de Impuestos Internos)
 *  - Comparaciones y deduplicación de empresas
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);


// ============================================================
// UTILIDAD: Validación del dígito verificador del RUT chileno
// ============================================================

/**
 * Valida el dígito verificador del RUT usando el algoritmo Módulo 11.
 * Entrada: RUT normalizado sin guión, e.g. "123456789" o "12345678K"
 */
function validateRutCheckDigit(rutSinGuion: string): boolean {
  const body = rutSinGuion.slice(0, -1);
  const dv = rutSinGuion.slice(-1).toUpperCase();

  if (!/^\d+$/.test(body)) return false;

  // Algoritmo Módulo 11
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedDv =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);

  return dv === expectedDv;
}

/**
 * Normaliza un RUT chileno al formato canónico: XXXXXXXX-D
 *  - Elimina puntos si los tiene
 *  - Asegura que tenga guión antes del dígito verificador
 *  - Convierte dígito verificador a mayúscula
 *
 * Ejemplos:
 *  "12.345.678-9" → "12345678-9"
 *  "12345678-k"   → "12345678-K"
 *  "123456789"    → "12345678-9"   (agrega guión)
 */
function normalizeRut(rut: string): string {
  // Eliminar puntos y espacios
  const cleaned = rut.replace(/\./g, "").replace(/\s/g, "").toUpperCase();

  // Si ya tiene guión, normalizar
  if (cleaned.includes("-")) {
    const [body, dv] = cleaned.split("-");
    return `${body}-${dv}`;
  }

  // Sin guión: el último carácter es el dígito verificador
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  return `${body}-${dv}`;
}

// ============================================================
// ZOD REFINEMENT: RUT Chileno
// ============================================================

/**
 * Schema Zod reutilizable para validar un RUT chileno.
 *
 * Reglas:
 *  1. Formato: XXXXXXXX-D (sin puntos, con guión) — se acepta con puntos y se normaliza
 *  2. El cuerpo del RUT debe tener entre 7 y 8 dígitos
 *  3. El dígito verificador debe ser correcto (algoritmo Módulo 11)
 *  4. La salida SIEMPRE es el RUT normalizado: sin puntos, con guión, DV en mayúscula
 */
export const RutSchema = z
  .string()
  .min(8, "RUT demasiado corto")
  .max(12, "RUT demasiado largo")
  .transform((val) => normalizeRut(val))
  .refine(
    (rut) => {
      // Regex para formato canónico: 7 u 8 dígitos, guión, dígito/K
      const formatOk = /^\d{7,8}-[\dK]$/.test(rut);
      if (!formatOk) return false;

      // Validar dígito verificador
      const sinGuion = rut.replace("-", "");
      return validateRutCheckDigit(sinGuion);
    },
    {
      message:
        "RUT inválido. Formato esperado: 12345678-9 (sin puntos, con guión). " +
        "Verifica que el dígito verificador sea correcto.",
    }
  );

export type RutInput = z.input<typeof RutSchema>;
export type RutOutput = z.output<typeof RutSchema>;

// ============================================================
// SCHEMA: Registro de Empresa
// ============================================================

// Esquema base con todas las validaciones pero SIN valores por defecto.
// Esto es necesario para que el .partial() de las actualizaciones no inserte ceros/valores default.
export const BaseCompanySchema = z.object({
  // RUT: se acepta con o sin puntos, se normaliza automáticamente
  rut: RutSchema,

  // Datos legales obligatorios
  razonSocial: z
    .string()
    .min(3, "La razón social debe tener al menos 3 caracteres")
    .max(255),

  giro: z.string().min(1, "El giro comercial es obligatorio").max(255),

  // Datos opcionales
  nombreFantasia: z.string().max(255).optional(),
  
  // Dirección Tributaria / Legal (Obligatorios)
  direccion: z.string().min(1, "La dirección es obligatoria").max(500),
  comuna: z.string().min(1, "La comuna es obligatoria").max(100),
  ciudad: z.string().min(1, "La ciudad es obligatoria").max(100),
  region: z.string().min(1, "La región es obligatoria").max(100),
  pais: z.string().length(2, "Código de país ISO 2 letras (ej: CL)").optional(),
  
  // Contacto (Obligatorios)
  telefono: z.string().min(1, "El teléfono es obligatorio").max(20),
  email: z.string().email("Email de contacto inválido"),
  website: z.string().url("URL del sitio web inválida").optional().or(z.literal("")),
  salesRepEmail: z.string().email("Email de vendedor inválido").optional().nullable().or(z.literal("")),

  shippingStreet: z.string().max(255).optional(),
  shippingNumber: z.string().max(50).optional(),
  shippingApartment: z.string().max(50).optional(),
  shippingCommune: z.string().max(100).optional(),
  shippingCity: z.string().max(100).optional(),
  shippingRegion: z.string().max(100).optional(),

  billingStreet: z.string().max(255).optional(),
  billingNumber: z.string().max(50).optional(),
  billingApartment: z.string().max(50).optional(),
  billingCommune: z.string().max(100).optional(),
  billingCity: z.string().max(100).optional(),
  billingRegion: z.string().max(100).optional(),
  billingEmail: z.string().email("Email de facturación inválido").optional().or(z.literal("")),

  // Condiciones comerciales
  paymentTerms: z.number().int().min(0).max(180).optional(),
  paymentTermDiscount: z.number().min(0).max(100).optional(),
  defaultDiscount: z.number().min(0).max(100).optional(),
  creditLimit: z.number().min(0).optional(),
  creditUsed: z.number().optional(),
  isActive: z.boolean().optional(),
});

// Esquema para REGISTRO (Creación) - Aquí SÍ aplicamos los valores por defecto.
export const RegisterCompanySchema = BaseCompanySchema.extend({
  pais: z.string().length(2).default("CL"),
  paymentTerms: z.number().int().default(0),
  paymentTermDiscount: z.number().default(0),
  defaultDiscount: z.number().default(0),
  creditLimit: z.number().default(0),
  isActive: z.boolean().default(true),
  initialPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
});

export type RegisterCompanyDto = z.infer<typeof RegisterCompanySchema>;

// Esquema para ACTUALIZACIÓN (Partial) - Basado en el esquema SIN defaults.
export const UpdateCompanySchema = BaseCompanySchema
  .partial();

export type UpdateCompanyDto = z.infer<typeof UpdateCompanySchema>;

// ============================================================
// SCHEMA: Búsqueda de empresa por RUT (normaliza antes de buscar)
// ============================================================

export const FindByRutSchema = z.object({
  rut: RutSchema,
});
