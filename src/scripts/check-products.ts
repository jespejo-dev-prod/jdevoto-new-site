import { prisma } from "../lib/client";

async function main() {
  console.log("=== DIAGNÓSTICO DE PRODUCTOS ===");
  const total = await prisma.product.count();
  console.log("Total de productos en BD:", total);

  const published = await prisma.product.count({
    where: { isActive: true, isDeleted: false }
  });
  console.log("Publicados (isActive=true, isDeleted=false):", published);

  const drafts = await prisma.product.count({
    where: { isActive: false, isDeleted: false }
  });
  console.log("Borradores (isActive=false, isDeleted=false):", drafts);

  const trashed = await prisma.product.count({
    where: { isDeleted: true }
  });
  console.log("Papelera (isDeleted=true):", trashed);

  const samples = await prisma.product.findMany({
    take: 5,
    select: { id: true, sku: true, name: true, isActive: true, isDeleted: true }
  });
  console.log("\nMuestra de productos:");
  console.log(samples);
}

main().finally(() => prisma.$disconnect());
