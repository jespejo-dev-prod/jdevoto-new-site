import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slug = 'test-999';
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true }
  });

  if (!product) {
    console.log(`Product with slug ${slug} not found.`);
    return;
  }

  console.log('Product Found:', {
    id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: product.category?.name
  });

  if (product.categoryId) {
    const relatedCount = await prisma.product.count({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true
      }
    });
    console.log(`Related active products in same category: ${relatedCount}`);
    
    const related = await prisma.product.findMany({
       where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true
      },
      take: 5,
      select: { name: true, slug: true }
    });
    console.log('Related sample:', related);
  } else {
    console.log('Product has no categoryId.');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
