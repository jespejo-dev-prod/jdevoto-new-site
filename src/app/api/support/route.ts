import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { sendSupportTicketEmails } from "@/lib/email";
import { z } from "zod";

const SupportTicketSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Formato de correo electrónico inválido"),
  subject: z.string().min(4, "El asunto debe tener al menos 4 caracteres"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const data = SupportTicketSchema.parse(body);

  const result = await sendSupportTicketEmails(
    data.name,
    data.email,
    data.subject,
    data.message
  );

  if (!result.success) {
    throw new Error("No se pudo enviar el ticket de soporte");
  }

  return ok({ message: "Ticket de soporte enviado exitosamente" });
});
