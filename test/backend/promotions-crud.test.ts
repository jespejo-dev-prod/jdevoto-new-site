import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/client';
import { z } from 'zod';

vi.mock('@/lib/client', () => ({
  prisma: {
    promotion: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    }
  }
}));

const promotionSchema = z.object({
  name: z.string(),
  discount: z.number().max(100, "El descuento no puede ser mayor al 100%"),
  brandId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  isActive: z.boolean().default(true)
});

const promotionService = {
  create: async (data: any) => {
    const validData = promotionSchema.parse(data);
    return await prisma.promotion.create({ data: validData });
  },
  getActive: async () => await prisma.promotion.findMany({ where: { isActive: true } }),
  delete: async (id: string) => await prisma.promotion.delete({ where: { id } })
};

describe('Promotions CRUD operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Crea una promoción con descuento por marca (brandId set, categoryId null)', async () => {
    const data = { name: 'Promo Marca', discount: 15, brandId: 'brand-1', categoryId: null };
    (prisma.promotion.create as any).mockResolvedValue({ id: '1', ...data });

    await promotionService.create(data);
    
    expect(prisma.promotion.create).toHaveBeenCalledWith({ data: expect.objectContaining({ brandId: 'brand-1', categoryId: null }) });
  });

  it('Crea una promoción con descuento por categoría (categoryId set, brandId null)', async () => {
    const data = { name: 'Promo Categoría', discount: 20, brandId: null, categoryId: 'cat-1' };
    (prisma.promotion.create as any).mockResolvedValue({ id: '2', ...data });

    await promotionService.create(data);
    
    expect(prisma.promotion.create).toHaveBeenCalledWith({ data: expect.objectContaining({ categoryId: 'cat-1', brandId: null }) });
  });

  it('Rechaza descuento mayor a 100%', async () => {
    const data = { name: 'Promo Imposible', discount: 150 };
    
    await expect(promotionService.create(data)).rejects.toThrow();
    expect(prisma.promotion.create).not.toHaveBeenCalled();
  });

  it('Lista promociones activas filtrando por isActive:true', async () => {
    await promotionService.getActive();
    
    expect(prisma.promotion.findMany).toHaveBeenCalledWith({ where: { isActive: true } });
  });

  it('Elimina una promoción por ID', async () => {
    await promotionService.delete('promo-1');
    
    expect(prisma.promotion.delete).toHaveBeenCalledWith({ where: { id: 'promo-1' } });
  });
});
