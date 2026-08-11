import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); async function main() { console.log(await prisma.product.findMany({ where: { sku: 'TEST-001' } })); } main();
