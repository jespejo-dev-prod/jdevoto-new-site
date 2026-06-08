/**
 * src/modules/catalog/application/hooks/useProductForm.ts
 *
 * Hook DRY para el formulario de producto.
 * Funciona tanto en modo CREAR como en modo EDITAR según si recibe `product`.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProductSchema, CreateProductInput } from '@/validations/product.schemas';
import { useCreateProduct } from '@/modules/catalog/presentation/hooks/useCreateProduct';
import { useUpdateProduct } from '@/modules/catalog/presentation/hooks/useUpdateProduct';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { slugify } from '@/lib/slugify';
import { DashboardProduct } from '@/modules/catalog/presentation/hooks/useProducts';

interface UseProductFormOptions {
  /** Si se pasa, el formulario opera en modo edición */
  product?: DashboardProduct & {
    brandId?: string;
    description?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    specifications?: { name: string; value: string }[];
    unit?: string;
    basePrice: number;
    minOrderQty?: number;
    stockAlert?: number;
    inner?: number;
    weight?: number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
  };
}

export function useProductForm({ product }: UseProductFormOptions = {}) {
  const router = useRouter();
  const isEditing = !!product;

  const { mutateAsync: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isSubmitting = isCreating || isUpdating;

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema) as any,
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          description: product.description ?? '',
          unit: (product.unit as any) ?? 'UN',
          basePrice: product.basePrice,
          stockQuantity: product.stockQuantity,
          minOrderQty: product.minOrderQty ?? 1,
          stockAlert: product.stockAlert ?? 5,
          inner: product.inner ?? 1,
          isActive: product.isActive ?? true,
          categoryId: product.category?.id ?? '',
          brandId: product.brandId ?? '',
          seoTitle: product.seoTitle ?? '',
          seoDescription: product.seoDescription ?? '',
          weight: product.weight ?? 0,
          length: product.length ?? 0,
          width: product.width ?? 0,
          height: product.height ?? 0,
          specifications: (Array.isArray(product.specifications) && product.specifications.length > 0)
            ? product.specifications
            : [{ name: '', value: '' }],
          images: product.images.map((img, i) => ({
            url: img.url,
            position: i,
            altText: img.altText ?? null,
            isPrimary: img.isPrimary,
          })),
        }
      : {
          unit: 'UN',
          stockQuantity: 0,
          minOrderQty: 1,
          stockAlert: 5,
          inner: 1,
          isActive: true,
          images: [],
          specifications: [{ name: '', value: '' }],
          weight: 0,
          length: 0,
          width: 0,
          height: 0,
        } as any,
  });

  const { watch, setValue, handleSubmit } = form;
  const productName = watch('name') || '';

  // Auto-generar slug sólo en modo creación
  useEffect(() => {
    if (!isEditing) {
      const slug = slugify(productName);
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [productName, setValue, isEditing]);

  const onSubmit = async (data: CreateProductInput) => {
    try {
      const payload = {
        ...data,
        minOrderQty: data.inner, // Mapea MOQ a inner para mantener consistencia
        seoTitle: data.seoTitle || data.name,
        seoDescription: data.seoDescription || data.description,
        specifications: data.specifications?.filter(
          (s) => s && s.name && s.name.trim() !== ''
        ) as any,
      };

      if (isEditing && product) {
        await updateProduct({ id: product.id, data: payload });
        toast.success('Producto actualizado exitosamente');
        router.refresh(); // Refrescar el Server Component para mostrar los últimos datos guardados
      } else {
        const newProduct = await createProduct(payload);
        toast.success('Producto creado exitosamente');
        if (newProduct?.id) {
          router.push(`/dashboard/products/${newProduct.id}/edit`);
        } else {
          router.push('/dashboard/products');
        }
      }
    } catch (e) {
      console.error(e);
      // Los hooks ya muestran toast de error
    }
  };

  const onInvalid = (errors: any) => {
    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) {
      const fieldLabels: Record<string, string> = {
        name: 'Nombre',
        sku: 'SKU',
        basePrice: 'Precio',
        brandId: 'Marca',
        categoryId: 'Categoría',
        description: 'Descripción',
        stockQuantity: 'Stock',
        slug: 'Enlace',
        images: 'Imágenes',
      };

      const failingFields = errorFields.map((f) => fieldLabels[f] || f).join(', ');

      toast.error(`Formulario incompleto (${errorFields.length} errores)`, {
        description: `Revisa los campos: ${failingFields}`,
      });
    }
  };

  return {
    form,
    onSubmit: handleSubmit(onSubmit, onInvalid),
    isSubmitting,
    isEditing,
    slug: watch('slug'),
  };
}
