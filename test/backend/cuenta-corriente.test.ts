import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '@/modules/orders/domain/order.service';
import { prisma } from '@/lib/client';
import { BusinessRuleError } from '@/lib/errors';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/client', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock de email
vi.mock('@/lib/email', () => ({
  sendOrderEmail: vi.fn().mockResolvedValue(undefined),
  sendOrderShippedEmail: vi.fn().mockResolvedValue(undefined),
  sendOrderStatusUpdateEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock del motor de precios para evitar consultas a listas de precios/promociones en DB
vi.mock('@/modules/pricing/domain/price.service', () => ({
  priceService: {
    getPricesForProducts: vi.fn().mockResolvedValue([
      {
        productId: 'prod-1',
        sku: 'SKU-01',
        name: 'Martillo',
        unit: 'UN',
        inner: 1,
        unitNetPrice: 50000,
        discountPercent: 0,
        discountedNetPrice: 50000,
        taxAmount: 9500,
        unitGrossPrice: 59500,
        priceSource: 'BASE_PRICE',
      },
    ]),
  },
}));

describe('Pruebas de Cuenta Corriente, Crédito y Pagos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCompany = {
    id: 'comp-1',
    razonSocial: 'Ferretería Central',
    creditLimit: 1000000, // $1.000.000 CLP de límite
    creditUsed: 200000,  // $200.000 CLP ya consumidos
    defaultDiscount: 0,
    paymentTerms: 30,
    isActive: true,
  };

  const mockUser = {
    id: 'user-1',
    role: 'BUYER',
    isActive: true,
  };

  const mockProduct = {
    id: 'prod-1',
    sku: 'SKU-01',
    name: 'Martillo',
    basePrice: 50000, // $50.000 CLP cada uno
    minOrderQty: 1,
    stockQuantity: 100,
    isActive: true,
  };

  it('debe fallar la creación del pedido si el total excede el límite de crédito disponible', async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    
    // 20 unidades * $50.000 = $1.000.000 neto. Con IVA = $1.190.000 bruto.
    // Crédito disponible = 1.000.000 (límite) - 200.000 (usado) = 800.000.
    // Excede el crédito disponible.
    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

    const input = {
      companyId: 'comp-1',
      createdById: 'user-1',
      items: [{ productId: 'prod-1', quantity: 20 }],
      paymentMethod: 'credit_b2b',
      shippingAddress: { region: 'Metropolitana', comuna: 'Santiago' },
      status: OrderStatus.CONFIRMED,
    };

    await expect(orderService.createOrder(input)).rejects.toThrow(
      /Límite de crédito insuficiente/
    );
  });

  it('debe permitir la creación del pedido si el total está dentro del crédito disponible y aumentar creditUsed', async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    
    // 3 unidades * $50.000 = $150.000 neto. Con IVA = $178.500 bruto.
    // Cabe dentro de los $800.000 disponibles.
    vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);

    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-2024-0001',
      companyId: 'comp-1',
      totalGross: 178500,
      paymentMethod: 'credit_b2b',
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
      items: [{ productId: 'prod-1', quantity: 3 }],
      paymentMethod: 'credit_b2b',
      shippingAddress: { region: 'Metropolitana', comuna: 'Santiago' },
      status: OrderStatus.CONFIRMED,
    };

    const result = await orderService.createOrder(input);

    expect(result.id).toBe('order-1');
    expect(mockTx.company.update).toHaveBeenCalledWith({
      where: { id: 'comp-1' },
      data: { creditUsed: { increment: 166005 } }, // Incrementa el crédito usado en el total bruto (con 7% dto)
    });
  });

  it('debe liberar el cupo de crédito cuando el pedido cambia a estado CANCELLED o REJECTED', async () => {
    const existingOrder = {
      id: 'order-1',
      companyId: 'comp-1',
      totalGross: 178500,
      paymentMethod: 'credit_b2b',
      status: OrderStatus.CONFIRMED,
      items: [{ productId: 'prod-1', quantity: 3 }],
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(existingOrder as any);

    const mockTx = {
      order: {
        update: vi.fn().mockResolvedValue({ ...existingOrder, status: OrderStatus.CANCELLED }),
        findUnique: vi.fn().mockResolvedValue(existingOrder),
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

    await orderService.updateOrderStatus('order-1', OrderStatus.CANCELLED);

    expect(mockTx.company.update).toHaveBeenCalledWith({
      where: { id: 'comp-1' },
      data: { creditUsed: { decrement: 178500 } }, // Libera el cupo restando del crédito utilizado
    });
  });
});
