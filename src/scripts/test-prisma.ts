import { PrismaClient } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  try {
    console.log("Checking if paymentTermDiscount exists in Prisma models...");
    // @ts-ignore
    const fields = prisma._runtimeDataModel.models.Company.fields;
    const hasField = fields.some((f: any) => f.name === 'paymentTermDiscount');
    console.log("Has paymentTermDiscount:", hasField);
    process.exit(hasField ? 0 : 1);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

test();
