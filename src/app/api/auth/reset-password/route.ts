import { NextRequest } from "next/server";
import { withApiHandler, ok } from "@/lib/api-handler";
import { prisma } from "@/lib/client";
import { logAuditAction } from "@/lib/audit";
import { sendNotificationEmail } from "@/lib/email";
import { BusinessRuleError } from "@/lib/errors";
import bcrypt from "bcryptjs";

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { token, password } = body;

  if (!token || !password) {
    throw new BusinessRuleError("Token y nueva contraseña son obligatorios", "INVALID_INPUT");
  }

  if (password.length < 7 || !/[A-Z]/.test(password) || !/[0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
    throw new BusinessRuleError("La contraseña debe tener al menos 7 caracteres, una mayúscula y un número o símbolo.", "WEAK_PASSWORD");
  }

  // 1. Validate token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetToken) {
    throw new BusinessRuleError("El enlace de recuperación es inválido o ha expirado.", "INVALID_TOKEN");
  }

  // 2. Check expiration
  if (resetToken.expires < new Date()) {
    // Clean up expired token
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    throw new BusinessRuleError("El enlace de recuperación ha expirado. Por favor solicita uno nuevo.", "EXPIRED_TOKEN");
  }

  // 3. Prevent reusing old password & Hash new password
  const user = await prisma.user.findUnique({
    where: { email: resetToken.email }
  });

  if (user && await bcrypt.compare(password, user.passwordHash)) {
    throw new BusinessRuleError("Por seguridad, la nueva contraseña no puede ser igual a la anterior.", "SAME_PASSWORD");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Update user password
  await prisma.user.update({
    where: { email: resetToken.email },
    data: { passwordHash: hashedPassword }
  });

  // 5. Delete the token so it can't be reused
  await prisma.passwordResetToken.delete({
    where: { id: resetToken.id }
  });

  await logAuditAction({
    action: "PASSWORD_RESET_COMPLETED",
    userId: user?.id,
    details: { email: resetToken.email },
    req,
  });

  // The centralized notification system inside logAuditAction will handle the admin email

  return ok({ message: "Contraseña actualizada exitosamente." });
});
