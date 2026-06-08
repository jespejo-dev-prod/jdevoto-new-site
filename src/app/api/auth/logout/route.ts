import { cookies } from "next/headers";
import { prisma } from "@/lib/client";
import { ok, withApiHandler } from "@/lib/api-handler";

export const POST = withApiHandler(async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken) {
    // Revocar en la base de datos
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }

  // Borrar la cookie
  cookieStore.delete("refresh_token");

  return ok({ message: "Logged out successfully" });
});
