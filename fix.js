const fs = require('fs');

const path = 'src/modules/catalog/presentation/components/ProductList/CatalogView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add usePathname import
content = content.replace(
  "import { useRouter, useSearchParams } from 'next/navigation';",
  "import { useRouter, useSearchParams, usePathname } from 'next/navigation';"
);

// 2. Add pathname var
content = content.replace(
  "const searchParams = useSearchParams();",
  "const searchParams = useSearchParams();\n  const pathname = usePathname();"
);

// 3. Update navigateWithFilters
content = content.replace(
  `    if (updates.categoryId !== undefined) {
      params.delete('categoryId'); // clean up legacy CUID param
      if (updates.categoryId) {
        const cat = categories.find(c => c.id === updates.categoryId);
        if (cat?.slug) {
          params.set('category', cat.slug);
        } else {
          params.set('category', updates.categoryId);
        }
      } else {
        params.delete('category');
      }
      
      // Limpiar subcategorías al cambiar de categoría padre
      params.delete('subcategories');

      params.delete('searchHistory');
      params.delete('recentlyViewed');
      params.delete('related');
    }`,
  `    let basePath = pathname;

    if (updates.categoryId !== undefined) {
      params.delete('categoryId'); // clean up legacy CUID param
      params.delete('category'); // clean legacy query param
      
      if (updates.categoryId) {
        const cat = categories.find(c => c.id === updates.categoryId);
        const slug = cat?.slug || updates.categoryId;
        basePath = \`/categorias/\${slug}\`;
      } else {
        basePath = '/products';
      }
      
      // Limpiar subcategorías al cambiar de categoría padre
      params.delete('subcategories');

      params.delete('searchHistory');
      params.delete('recentlyViewed');
      params.delete('related');
    }`
);

// 4. Update the router.push at the end of navigateWithFilters
content = content.replace(
  "    router.push(`/products?${params.toString()}`);",
  "    const queryString = params.toString();\n    router.push(queryString ? `${basePath}?${queryString}` : basePath);"
);

// 5. Update getPageLink
content = content.replace(
  "    return `/products?${params.toString()}`;",
  "    const queryString = params.toString();\n    return queryString ? `${pathname}?${queryString}` : pathname;"
);

// 6. Update Limpiar Filtros button
// We have two places with `router.push('/products');`
// We'll replace both with `router.push(pathname);`
content = content.replace(
  "                  router.push('/products');",
  "                  router.push(pathname);"
);
content = content.replace(
  "                  router.push('/products');",
  "                  router.push(pathname);"
);


fs.writeFileSync(path, content);
console.log('done');
