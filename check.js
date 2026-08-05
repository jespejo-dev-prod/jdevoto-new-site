const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { orderNumber: { endsWith: '0030' } }
  });
  console.log(JSON.stringify(order.billingAddress, null, 2));
}

main().finally(() => prisma.$disconnect());
