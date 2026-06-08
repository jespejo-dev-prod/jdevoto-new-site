/**
 * lib/slugify.ts
 *
 * Convierte texto libre en un slug URL-amigable.
 *
 * Ejemplos:
 *   "Tornillo M8 Hexagonal" → "tornillo-m8-hexagonal"
 *   "  Perno  M10  "        → "perno-m10"
 *   "Ángulo 90°"            → "ngulo-90"
 *
 * Usado por: useProductForm (auto-slug al escribir el nombre del producto)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Espacios → guión
    .replace(/[^\w-]+/g, '')  // Elimina caracteres especiales (excepto letras, números y guiones)
    .replace(/--+/g, '-');    // Múltiples guiones consecutivos → un solo guión
}
