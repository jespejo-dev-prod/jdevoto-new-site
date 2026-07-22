/**
 * categories-menu-server.tsx
 *
 * Server Component wrapper for CategoriesMenu.
 * Fetches categories live from the DB using unstable_cache with the
 * 'categories' tag. When the categories API calls revalidateTag('categories'),
 * Next.js will purge this cache and the next request will get fresh data.
 */
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/client';
import { CategoriesMenuClient } from './categories-menu-client';

const getCategoriesCached = unstable_cache(
  async () => {
    const cats = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, parentId: true },
    });
    return cats;
  },
  ['nav-categories'],
  { revalidate: 3600, tags: ['categories'] }
);

export async function CategoriesMenuServer({
  onCloseAction,
  topOffset,
}: {
  onCloseAction: string;
  topOffset?: string;
}) {
  const categories = await getCategoriesCached();
  return (
    <CategoriesMenuClient
      categories={categories}
      onCloseAction={onCloseAction}
      topOffset={topOffset}
    />
  );
}
