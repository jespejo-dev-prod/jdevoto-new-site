import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { sendPasswordResetEmail } from "@/lib/email";
import { AppError } from "@/lib/errors";
import crypto from "crypto";

export const POST = withApiHandler(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return ok({ message: "Si el correo existe en nuestro sistema, recibirás un enlace de recuperación." });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return ok({ message: "Si el correo existe en nuestro sistema, recibirás un enlace de recuperación." });
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
      console.error(`Fallo al enviar correo de recuperación a ${email}: ${errorMessage}`);
      throw new Error(`Error del servidor de correos: ${errorMessage}`);
    }

    return ok({ message: "Si el correo existe en nuestro sistema, recibirás un enlace de recuperación." });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message || String(error), stack: error.stack }), { status: 500 });
  }
});
