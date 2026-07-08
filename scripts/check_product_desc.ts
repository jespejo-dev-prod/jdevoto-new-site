import { prisma } from "../src/lib/client";

async function main() {
  const slug = "mica-transparente-200-mic-carta-0155043";
  console.log(`Checking product desc for slug: ${slug}`);
  
  const product = await prisma.product.findUnique({
    where: { slug }
  });

  if (!product) {
    console.log("Product not found!");
    return;
  }

  console.log("Product Description raw:");
  console.log(JSON.stringify(product.description));
  console.log("Product Description pretty:");
  console.log(product.description);
}

main().catch(console.error);
