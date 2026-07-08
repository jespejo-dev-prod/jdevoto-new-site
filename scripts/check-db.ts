import { prisma } from "../src/lib/client";

async function main() {
  const setting = await prisma.storeSettings.findUnique({
    where: { key: 'hideOutOfStock' },
  });
  console.log("Setting 'hideOutOfStock':", setting);

  const products = await prisma.product.findMany({
    where: {
      name: { contains: "cinta", mode: "insensitive" }
    },
    select: {
      id: true,
      sku: true,
      name: true,
      stockQuantity: true,
      isActive: true,
      isDeleted: true
    }
  });
  console.log("Products matching 'cinta':", products.map(p => ({
    ...p,
    stockQuantity: p.stockQuantity.toString()
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
