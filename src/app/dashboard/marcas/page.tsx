/**
 * src/app/dashboard/marcas/page.tsx
 */

import { RoleGuard } from"@/components/auth/role-guard";
import { UserRole } from"@prisma/client";
import { BrandList } from"@/modules/catalog/presentation/components/Taxonomy/BrandList";

export default function BrandsPage() {
 return (
 <RoleGuard allowedRoles={[UserRole.ADMIN]}>
 <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
 <div>
 <h1 className="text-3xl font-bold text-white tracking-tight">Marcas</h1>
 <p className="text-zinc-500 mt-1">Gestiona las marcas y fabricantes de tus productos.</p>
 </div>
 
 <BrandList />
 </div>
 </RoleGuard>
 );
}
