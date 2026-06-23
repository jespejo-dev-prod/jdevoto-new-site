import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '@/modules/orders/domain/order.service';
import { prisma } from '@/lib/client';
import { BusinessRuleError } from '@/lib/errors';
import { OrderStatus } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/client', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock motor de precios
vi.mock('@/modules/pricing/domain/price.service', () => ({
  priceService: {
    getPricesForProducts: vi.fn().mockResolvedValue([
      {
        productId: 'prod-1',
        sku: 'SKU-01',
        name: 'Producto A',
        unit: 'UN',
        inner: 6,
        unitNetPrice: 20000,
        discountPercent: 0,
        discountedNetPrice: 20000,
        taxAmount: 3800,
        unitGrossPrice: 23800,
        priceSource: 'BASE_PRICE',
      },
    ]),
  },
}));

// Mock email
vi.mock('@/lib/email', () => ({
  sendOrderEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('Reglas de Validación de Empaque Comercial (minOrderQty e inner)', () => {
  const mockCompany = {
    id: 'comp-1',
    razonSocial: 'Ferretería B2B',
    creditLimit: 5000000,
    creditUsed: 0,
    defaultDiscount: 0,
    paymentTerms: 30,
    isActive: true,
  };

  const mockUser = {
    id: 'user-1',
    role: 'BUYER',
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
  });

  it('debe lanzar error si la cantidad solicitada es menor que minOrderQty', async () => {
    const mockProduct = {
      id: 'prod-1',
      sku: 'SKU-01',
      name: 'Producto A',
      basePrice: 20000,
      minOrderQty: 10, // Requiere al menos 10 unidades
      inner: 1,
      stockQuantity: 100,
      isActive: true,
    };

    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

    const input = {
      companyId: 'comp-1',
      createdById: 'user-1',
      items: [{ productId: 'prod-1', quantity: 5 }], // Pide 5 (menor que 10)
      paymentMethod: 'transfer',
      shippingAddress: { region: 'Metropolitana', comuna: 'Santiago', shippingMethod: 'pickup' },
    };

    await expect(orderService.createOrder(input)).rejects.toThrow(
      /requiere cantidad mínima de 10 unidades/
    );
  });

  it('debe lanzar error si la cantidad solicitada no es múltiplo de inner pack', async () => {
    const mockProduct = {
      id: 'prod-1',
      sku: 'SKU-01',
      name: 'Producto A',
      basePrice: 20000,
      minOrderQty: 1,
      inner: 6, // Empaque de 6 unidades
      stockQuantity: 100,
      isActive: true,
    };

    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

    const input = {
      companyId: 'comp-1',
      createdById: 'user-1',
      items: [{ productId: 'prod-1', quantity: 8 }], // Pide 8 (no es múltiplo de 6)
      paymentMethod: 'transfer',
      shippingAddress: { region: 'Metropolitana', comuna: 'Santiago', shippingMethod: 'pickup' },
    };

    await expect(orderService.createOrder(input)).rejects.toThrow(
      /debe ser múltiplo de su empaque mínimo de 6 unidades/
    );
  });

  it('debe permitir la creación del pedido si cumple con minOrderQty y es múltiplo de inner pack', async () => {
    const mockProduct = {
      id: 'prod-1',
      sku: 'SKU-01',
      name: 'Producto A',
      basePrice: 20000,
      minOrderQty: 6,
      inner: 6,
      stockQuantity: 100,
      isActive: true,
    };

    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-123',
      companyId: 'comp-1',
      totalGross: 285600, // 12 * 23800
      status: OrderStatus.CONFIRMED,
    };

    const mockTx = {
      order: {
        create: vi.fn().mockResolvedValue(mockOrder),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      product: {
        update: vi.fn(),
      },
      company: {
        update: vi.fn(),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return callback(mockTx as any);
    });

    const input = {
      companyId: 'comp-1',
      createdById: 'user-1',
      items: [{ productId: 'prod-1', quantity: 12 }], // 12 >= 6, y 12 % 6 === 0
      paymentMethod: 'transfer',
      shippingAddress: { region: 'Metropolitana', comuna: 'Santiago', shippingMethod: 'pickup' },
    };

    const result = await orderService.createOrder(input);
    expect(result.id).toBe('order-123');
    expect(mockTx.order.create).toHaveBeenCalled();
  });
});
