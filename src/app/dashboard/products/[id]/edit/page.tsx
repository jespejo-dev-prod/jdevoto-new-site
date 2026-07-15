/**
 * src/app/dashboard/products/[id]/edit/page.tsx
 *
 * Página de edición de producto.
 * Carga el producto por ID y renderiza el formulario en modo edición.
 */

import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { EditProductForm } from '@/modules/catalog/presentation/components/ProductForm/EditProductForm';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/client';

interface EditProductPageProps {
 params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
 const { id } = await params;

 // Cargar producto directamente desde Prisma (Server Component)
 const product = await prisma.product.findUnique({
 where: { id },
 include: {
 category: { select: { id: true, name: true, slug: true } },
 images: {
 select: { url: true, isPrimary: true, altText: true, position: true },
 orderBy: { position: 'asc' },
 },
 },
 });

 if (!product) {
 notFound();
 }

 // Serializar los campos Decimal de Prisma a number para el cliente
 const serialized = {
 ...product,
 basePrice: Number(product.basePrice),
 stockQuantity: Number(product.stockQuantity),
 weight: product.weight ? Number(product.weight) : 0,
 length: product.length ? Number(product.length) : 0,
 width: product.width ? Number(product.width) : 0,
 height: product.height ? Number(product.height) : 0,
 specifications: (product.specifications as any) ?? [],
 };

 return (
 <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SALES_REP]}>
 <EditProductForm product={serialized as any} />
 </RoleGuard>
 );
}
