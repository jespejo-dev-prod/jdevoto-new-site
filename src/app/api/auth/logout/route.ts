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

  // Borrar la cookie de forma segura especificando el path
  cookieStore.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return ok({ message: "Logged out successfully" });
});
