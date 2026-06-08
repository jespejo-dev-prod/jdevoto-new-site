import 'dotenv/config';
import { prisma } from '../lib/client';
import slugify from 'slugify';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const categories = [
  'Papelería',
  'Aseo',
  'Ferretería',
  'Oficina',
  'Alimentos'
];

async function main() {
  console.log('--- Iniciando Seed de Categorías ---');

  // 1. Limpiar categorías existentes (Precaución: Esto fallará si hay productos vinculados sin SET NULL)
  // Intentaremos borrar todo.
  try {
    console.log('Limpiando categorías existentes...');
    // Desactivamos temporalmente el check de FK si fuera necesario, 
    // pero con Prisma lo ideal es simplemente intentar borrar.
    await prisma.category.deleteMany({});
    console.log('Categorías eliminadas con éxito.');
  } catch (error) {
    console.error('Error al limpiar categorías:', error);
    console.log('Continuando con la creación (puede haber duplicados)...');
  }

  // 2. Crear nuevas categorías
  for (const name of categories) {
    const slug = slugify(name, { lower: true });
    await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: {
        name,
        slug,
        description: `Productos de la categoría ${name}`
      }
    });
    console.log(`Categoría creada/actualizada: ${name} (${slug})`);
  }

  console.log('--- Seed completado ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
