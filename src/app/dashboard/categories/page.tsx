/**
 * src/app/dashboard/categories/page.tsx
 */

import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";
import { CategoryList } from "@/modules/catalog/presentation/components/Taxonomy/CategoryList";

export default function CategoriesPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Categorías</h1>
          <p className="text-zinc-500 mt-1">Gestiona la jerarquía de productos de tu catálogo.</p>
        </div>
        
        <CategoryList />
      </div>
    </RoleGuard>
  );
}
