import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { extractUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/client";
import { sendWishlistEmail } from "@/lib/email";

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  if (!user) {
    throw new Error("No autorizado. Debes iniciar sesión.");
  }

  const body = await req.json();
  const { items, emails } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("La lista de productos está vacía o es inválida.");
  }

  if (!emails || typeof emails !== 'string' || emails.trim() === '') {
    throw new Error("Debes proporcionar al menos un correo electrónico de destino.");
  }

  // Obtener los detalles completos del usuario y su empresa
  const userDetails = await prisma.user.findUnique({
    where: { id: user.id },
    include: { company: true },
  });

  if (!userDetails) {
    throw new Error("Usuario no encontrado.");
  }

  // Enviar el correo
  const result = await sendWishlistEmail(items, emails, userDetails);

  if (!result.success) {
    throw new Error("No se pudo enviar el correo de la lista de deseos.");
  }

  return ok({ 
    message: "Lista de deseos enviada correctamente", 
    messageId: result.messageId
  });
});
