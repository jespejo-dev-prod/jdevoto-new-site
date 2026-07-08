import { prisma } from "../src/lib/client";

async function main() {
  const email = "jorge.espejo.ibacache@gmail.com";
  console.log(`Activating user: ${email}`);
  
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { isActive: true }
  });

  console.log("User updated successfully:", {
    id: updatedUser.id,
    email: updatedUser.email,
    isActive: updatedUser.isActive,
  });
}

main().catch(console.error);
