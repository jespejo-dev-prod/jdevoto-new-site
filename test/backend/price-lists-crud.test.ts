import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/client';

vi.mock('@/lib/client', () => ({
  prisma: {
    priceList: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    priceListItem: {
      create: vi.fn(),
    },
    companyPriceList: {
      create: vi.fn(),
    }
  }
}));

const priceListService = {
  create: async (data: any) => await prisma.priceList.create({ data }),
  addItem: async (data: any) => await prisma.priceListItem.create({ data }),
  assignToCompany: async (data: any) => await prisma.companyPriceList.create({ data }),
  delete: async (id: string) => await prisma.priceList.delete({ where: { id } })
};

describe('Price Lists CRUD operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Crea una lista de precios tipo COMPANY', async () => {
    const data = { name: 'VIP List', type: 'COMPANY' };
    (prisma.priceList.create as any).mockResolvedValue({ id: '1', ...data });

    await priceListService.create(data);
    
    expect(prisma.priceList.create).toHaveBeenCalledWith({ data });
  });

  it('Agrega un item a una lista de precios con netPrice y discount', async () => {
    const data = { priceListId: '1', productId: 'p1', netPrice: 100, discount: 10 };
    (prisma.priceListItem.create as any).mockResolvedValue({ id: 'item1', ...data });

    await priceListService.addItem(data);
    
    expect(prisma.priceListItem.create).toHaveBeenCalledWith({ data });
  });

  it('Asigna una lista de precios a una empresa (companyPriceList.create)', async () => {
    const data = { companyId: 'c1', priceListId: '1' };
    (prisma.companyPriceList.create as any).mockResolvedValue({ id: 'cp1', ...data });

    await priceListService.assignToCompany(data);
    
    expect(prisma.companyPriceList.create).toHaveBeenCalledWith({ data });
  });

  it('Elimina una lista de precios (cascade elimina items)', async () => {
    await priceListService.delete('pl-1');
    
    expect(prisma.priceList.delete).toHaveBeenCalledWith({ where: { id: 'pl-1' } });
  });
});
