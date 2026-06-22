/**
 * src/app/api/ai/generate-description/route.ts
 *
 * Endpoint de IA para generar descripciones comerciales/SEO automáticas de productos.
 */

import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { ValidationError } from "@/lib/errors";

export const POST = withApiHandler(async (req: NextRequest) => {
  // Validar permisos: solo administradores o ejecutivos de ventas
  const user = extractUserFromRequest(req);
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SALES_REP) {
    throw new ValidationError("No tienes permisos para realizar esta acción");
  }

  const { name, brandName, categoryName } = await req.json();

  if (!name) {
    throw new ValidationError("El nombre del producto es obligatorio para poder generar su descripción.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ValidationError("La API Key de Gemini no está configurada en las variables de entorno (GEMINI_API_KEY).");
  }

  // Prompt optimizado para descripción comercial y SEO limpio de Google
  const prompt = `Genera una descripción comercial de producto detallada, profesional y optimizada para SEO de Google, en idioma español.
Producto: "${name}"
${brandName ? `Marca: "${brandName}"` : ""}
${categoryName ? `Categoría: "${categoryName}"` : ""}

Requisitos de la descripción:
1. Sé descriptivo y destaca los beneficios clave, especificaciones lógicas y usos ideales del producto.
2. Organiza la descripción con párrafos claros separados por saltos de línea.
3. No devuelvas ningún formato markdown como "**" o "#". En su lugar, usa un tono profesional directo.
4. No uses código HTML. Devuelve únicamente la descripción pura.
5. Escribe únicamente la descripción. No agregues introducciones (ej: "Aquí tienes la descripción:") ni firmas o notas adicionales.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("GEMINI API ERROR DETAIL:", JSON.stringify(errData, null, 2));
      throw new Error(errData.error?.message || "Error al comunicarse con Gemini API");
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return ok({ text: generatedText.trim() });
  } catch (error: any) {
    throw new Error(`Error en el servicio de IA: ${error.message}`);
  }
});
