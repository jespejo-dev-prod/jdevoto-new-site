import { prisma } from "../src/lib/client";

async function main() {
  const email = "jorge.espejo.ibacache@gmail.com";
  console.log(`Checking user in DB for email: ${email}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: true,
    }
  });

  if (!user) {
    console.log("User not found!");
    return;
  }

  console.log("User found:");
  console.log({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    companyId: user.companyId,
    companyName: user.company?.razonSocial,
    twoFactorSecret: user.twoFactorSecret ? "SET" : "NOT_SET",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}

main().catch(console.error);
