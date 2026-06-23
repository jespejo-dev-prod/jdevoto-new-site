import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProductUseCase } from '@/modules/catalog/application/createProduct.use-case';
import { prisma } from '@/lib/client';
import { ConflictError, BusinessRuleError } from '@/lib/errors';
import { UserRole } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/client', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock LocalStorageService
vi.mock('@/modules/catalog/application/services/StorageService', () => {
  return {
    LocalStorageService: vi.fn().mockImplementation(function() {
      return {
        move: vi.fn().mockImplementation(async (url: string) => url.replace('/temp/', '/products/')),
        rollbackMove: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

describe('Catalog CRUD - createProductUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    companyId: 'company-1',
    firstName: 'Admin',
    lastName: 'User',
  };

  const validProductInput = {
    sku: 'PROD-001',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Description',
    unit: 'UN',
    basePrice: 10000,
    stockQuantity: 100,
    minOrderQty: 1,
    stockAlert: 5,
    inner: 1,
    isActive: true,
    categoryId: 'cat-1',
    brandId: 'brand-1',
    weight: 1.5,
    length: 10.0,
    width: 20.0,
    height: 5.5,
    seoTitle: 'SEO Title',
    seoDescription: 'SEO Desc',
    specifications: [],
    images: [{ url: '/temp/img1.png', position: 0, altText: 'Img 1', isPrimary: true }],
  };

  it('debe rechazar la creación si el rol del usuario no es ADMIN o SALES_REP', async () => {
    const mockBuyerUser = { ...mockAdminUser, role: UserRole.BUYER };
    await expect(
      createProductUseCase(validProductInput, mockBuyerUser as any)
    ).rejects.toThrow(/Rol 'BUYER' no tiene acceso/);
  });

  it('debe lanzar ConflictError si el SKU ya existe en el sistema', async () => {
    vi.mocked(prisma.product.findUnique)
      .mockResolvedValueOnce({ id: 'existing-id' } as any) // SKU exists
      .mockResolvedValueOnce(null); // Slug unique

    await expect(
      createProductUseCase(validProductInput, mockAdminUser as any)
    ).rejects.toThrow(ConflictError);
  });

  it('debe lanzar ConflictError si el Slug ya existe en el sistema', async () => {
    vi.mocked(prisma.product.findUnique)
      .mockResolvedValueOnce(null) // SKU unique
      .mockResolvedValueOnce({ id: 'existing-id' } as any); // Slug exists

    await expect(
      createProductUseCase(validProductInput, mockAdminUser as any)
    ).rejects.toThrow(ConflictError);
  });

  it('debe crear un producto correctamente con todos los atributos dimensionales e imágenes', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null); // SKU & Slug unique
    
    const mockCreatedProduct = {
      ...validProductInput,
      id: 'new-product-id',
      images: [
        { id: 'img-id-1', url: '/products/img1.png', position: 0, altText: 'Img 1', isPrimary: true },
      ],
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const mockTx = {
        product: {
          create: vi.fn().mockResolvedValue(mockCreatedProduct),
        },
      };
      return callback(mockTx as any);
    });

    const result = await createProductUseCase(validProductInput, mockAdminUser as any);
    
    expect(result.id).toBe('new-product-id');
    expect(result.sku).toBe('PROD-001');
    expect(result.weight).toBe(1.5);
    expect(result.height).toBe(5.5);
    expect(result.images[0].url).toBe('/products/img1.png'); // Mapeado de temp a products
  });
});
