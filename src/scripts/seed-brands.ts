import 'dotenv/config';
import { prisma } from '../lib/client';
import slugify from 'slugify';

const BRANDS = [
  "HP",
  "Dell",
  "Lenovo",
  "Logitech",
  "Samsung",
  "Tramontina",
  "3M",
  "Makita",
  "Bosch",
  "Torre"
];

async function main() {
  console.log("--- Iniciando Seed de Marcas ---");

  for (const name of BRANDS) {
    const slug = slugify(name, { lower: true });
    
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: {
        name,
        slug
      }
    });
    
    console.log(`Marca creada/actualizada: ${name}`);
  }

  console.log("--- Seed de Marcas completado ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
