import { describe, it, expect, vi, beforeEach } from 'vitest';
import { priceService } from '@/modules/pricing/domain/price.service';
import { orderService } from '@/modules/orders/domain/order.service';
import { prisma } from '@/lib/client';
import { BusinessRuleError } from '@/lib/errors';
import { OrderStatus } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/client', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
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
      findFirst: vi.fn(),
    },
    priceList: {
      findMany: vi.fn(),
    },
    promotion: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock email to prevent side effects
vi.mock('@/lib/email', () => ({
  sendOrderEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('Motor de Precios B2B y Reglas de Despacho', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Motor de Precios B2B - Jerarquía', () => {
    const mockCategory = { id: 'cat-1', name: 'Herramientas', isOutlet: false };
    const mockOutletCategory = { id: 'cat-outlet', name: 'Outlet Htas', isOutlet: true };
    
    const mockProduct = {
      id: 'prod-1',
      sku: 'SKU-01',
      name: 'Taladro',
      basePrice: 50000,
      categoryId: 'cat-1',
      brandId: 'brand-1',
      category: mockCategory,
    };

    it('1. OUTLET: Debe retornar precio base sin descuentos si el producto es de categoría outlet', async () => {
      const outletProduct = { ...mockProduct, category: mockOutletCategory, categoryId: 'cat-outlet' };
      
      // Loaders retornan listas vacías para simplificar
      vi.mocked(prisma.priceList.findMany).mockResolvedValue([]);
      vi.mocked(prisma.promotion.findMany).mockResolvedValue([]);
      vi.mocked(prisma.category.findMany).mockResolvedValue([mockOutletCategory] as any);
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const [price] = await priceService.getPricesForProducts([outletProduct as any], 'company-1');
      expect(price.priceSource).toBe('OUTLET');
      expect(price.discountedNetPrice).toBe(50000);
      expect(price.discountPercent).toBe(0);
    });

    it('2. LISTA: Debe aplicar el precio neto de la lista si está definido', async () => {
      // Lista de precios que incluye el producto con un precio específico de $45.000 y 5% de descuento adicional
      const mockPriceList = {
        id: 'list-1',
        type: 'COMPANY',
        globalDiscount: 0,
        items: [{ productId: 'prod-1', netPrice: 45000, discount: 5 }],
      };

      vi.mocked(prisma.priceList.findMany).mockResolvedValue([mockPriceList] as any);
      vi.mocked(prisma.promotion.findMany).mockResolvedValue([]);
      vi.mocked(prisma.category.findMany).mockResolvedValue([mockCategory] as any);
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const [price] = await priceService.getPricesForProducts([mockProduct as any], 'company-1');
      expect(price.priceSource).toBe('COMPANY_LIST');
      // netPrice = 45000, discountPercent = 5. discountedNetPrice = 45000 * 0.95 = 42750
      expect(price.unitNetPrice).toBe(45000);
      expect(price.discountPercent).toBe(5);
      expect(price.discountedNetPrice).toBe(42750);
    });

    it('3. PROMOCIÓN: Debe aplicar descuento de promoción si no hay lista de precios activa', async () => {
      const mockPromo = {
        id: 'promo-1',
        brandId: 'brand-1',
        categoryId: null,
        discount: 15,
        isActive: true,
      };

      vi.mocked(prisma.priceList.findMany).mockResolvedValue([]);
      vi.mocked(prisma.promotion.findMany).mockResolvedValue([mockPromo] as any);
      vi.mocked(prisma.category.findMany).mockResolvedValue([mockCategory] as any);
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const [price] = await priceService.getPricesForProducts([mockProduct as any], 'company-1');
      expect(price.priceSource).toBe('PROMOTION');
      expect(price.discountPercent).toBe(15);
      expect(price.discountedNetPrice).toBe(42500); // 50000 * 0.85
    });

    it('5. FALLBACK: Debe retornar precio base si no hay lista ni promoción', async () => {
      vi.mocked(prisma.priceList.findMany).mockResolvedValue([]);
      vi.mocked(prisma.promotion.findMany).mockResolvedValue([]);
      vi.mocked(prisma.category.findMany).mockResolvedValue([mockCategory] as any);
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const [price] = await priceService.getPricesForProducts([mockProduct as any], 'company-1');
      expect(price.priceSource).toBe('BASE_PRICE');
      expect(price.discountedNetPrice).toBe(50000);
    });
  });

  describe('Reglas de Despacho y Flete', () => {
    const mockCompany = { id: 'c-1', razonSocial: 'Ferretería S.A.', defaultDiscount: 0, creditLimit: 500000, creditUsed: 0, paymentTerms: 30, paymentTermDiscount: 0, isActive: true };
    const mockUser = { id: 'u-1', role: 'BUYER', isActive: true };
    const mockProduct = { id: 'p-1', sku: 'SKU-1', name: 'Martillo', basePrice: 10000, minOrderQty: 1, stockQuantity: 200, isActive: true };

    beforeEach(() => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
    });

    it('Monto Mínimo: Debe fallar si el subtotal neto del pedido es inferior a $100.000 CLP', async () => {
      // 5 unidades de Martillo = $50.000 neto (menor a $100.000)
      const input = {
        companyId: 'c-1',
        createdById: 'u-1',
        items: [{ productId: 'p-1', quantity: 5 }],
        shippingAddress: { region: 'Metropolitana', comuna: 'Santiago', shippingMethod: 'pickup' },
        paymentMethod: 'transfer',
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        /El subtotal neto del pedido.*debe ser de al menos \$100\.000/
      );
    });

    it('Despacho Insular: Debe fallar si se selecciona despacho gratuito en Juan Fernández o Isla de Pascua', async () => {
      // 15 unidades de Martillo = $150.000 neto (satisface mínimo global)
      const input = {
        companyId: 'c-1',
        createdById: 'u-1',
        items: [{ productId: 'p-1', quantity: 15 }],
        shippingAddress: { region: 'Valparaíso', comuna: 'Isla de Pascua', shippingMethod: 'free' },
        paymentMethod: 'transfer',
      };

      await expect(orderService.createOrder(input)).rejects.toThrow(
        /El despacho gratuito.*no está disponible para territorio insular/
      );
    });

    it('Mínimo Flete RM: Debe fallar si el subtotal es inferior a $100.000 para flete incluido en RM', async () => {
      // Supongamos que aplicamos un descuento y baja de $100.000, o el cálculo de flete incluido en RM falla si es menor
      // Nota: el mínimo de flete incluido en RM es de $100.000
      // Mandamos un pedido de $90.000 netos. Fallará primero por mínimo de compra global de 100k,
      // pero si el subtotal antes del descuento es menor a 100k para flete incluido, se valida.
      // Probemos con Zona Extrema Norte (mínimo $500.000) y mandamos un pedido de $150.000
      const inputNorte = {
        companyId: 'c-1',
        createdById: 'u-1',
        items: [{ productId: 'p-1', quantity: 15 }], // $150.000 CLP netos
        shippingAddress: { region: 'Arica y Parinacota', comuna: 'Arica', shippingMethod: 'free' },
        paymentMethod: 'transfer',
      };

      await expect(orderService.createOrder(inputNorte)).rejects.toThrow(
        /es inferior al mínimo requerido para flete incluido en su zona \(\$500\.000/
      );
    });

    it('Mínimo Flete Sur: Debe fallar si el subtotal es inferior a $1.000.000 para flete incluido en Zona Extrema Sur', async () => {
      const inputSur = {
        companyId: 'c-1',
        createdById: 'u-1',
        items: [{ productId: 'p-1', quantity: 30 }], // $300.000 CLP netos
        shippingAddress: { region: 'Aysén', comuna: 'Cochrane', shippingMethod: 'free' },
        paymentMethod: 'transfer',
      };

      await expect(orderService.createOrder(inputSur)).rejects.toThrow(
        /es inferior al mínimo requerido para flete incluido en su zona \(\$1\.000\.000/
      );
    });
  });
});
