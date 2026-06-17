import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { sendPasswordResetEmail } from "@/lib/email";
import { AppError } from "@/lib/errors";
import crypto from "crypto";

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return ok({ message: "Si el correo existe en nuestro sistema, recibirás un enlace de recuperación." });
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError("El correo electrónico ingresado no está registrado en nuestro sistema.", "NOT_FOUND", 404);
  }

  // Delete any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email }
  });

  // Generate new token (64 hex characters = 32 bytes)
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  // Send the email
  const emailResult = await sendPasswordResetEmail(email, token);

  if (!emailResult.success) {
    const errorDetails = emailResult.error;
    const errorMessage = errorDetails instanceof Error ? errorDetails.message : String(errorDetails);
    const stack = errorDetails instanceof Error ? errorDetails.stack : undefined;
    
    await prisma.systemErrorLog.create({
      data: {
        path: "/api/auth/forgot-password (email sending)",
        method: "POST",
        errorName: "SMTPSendingError",
        message: `Fallo al enviar correo de recuperación a ${email}: ${errorMessage}`,
        stack,
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
      }
    }).catch(err => console.error("Error al registrar error SMTP en DB:", err));
  }

  return ok({ message: "Si el correo existe en nuestro sistema, recibirás un enlace de recuperación." });
});
