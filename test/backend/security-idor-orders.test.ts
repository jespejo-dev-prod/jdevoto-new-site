import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '@/app/api/orders/[id]/route';
import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { extractUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/client';
import { orderService } from '@/modules/orders/domain/order.service';
import { BusinessRuleError } from '@/lib/errors';

vi.mock('@/lib/auth', () => ({
  extractUserFromRequest: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock('@/lib/client', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    }
  }
}));

vi.mock('@/modules/orders/domain/order.service', () => ({
  orderService: {
    getOrderById: vi.fn(),
    updateOrder: vi.fn(),
  }
}));

describe('IDOR en Orders API (Security Regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/orders/[id] previene IDOR enviando salesRepContext y companyContext al servicio', async () => {
    vi.mocked(extractUserFromRequest).mockReturnValue({
      id: 'sales-rep-1',
      role: UserRole.SALES_REP,
      companyId: null,
      isActive: true,
      email: 'rep@test.com'
    } as any);

    const req = new NextRequest('http://localhost:3000/api/orders/order-123');
    await GET(req, { params: Promise.resolve({ id: 'order-123' }) } as any);

    expect(orderService.getOrderById).toHaveBeenCalledWith(
      'order-123',
      undefined, // companyContext para SALES_REP es undefined
      'sales-rep-1' // salesRepContext se inyecta
    );
  });

  it('PATCH /api/orders/[id] bloquea edición a SALES_REP de empresa ajena', async () => {
    vi.mocked(extractUserFromRequest).mockReturnValue({
      id: 'sales-rep-1',
      role: UserRole.SALES_REP,
      companyId: null,
      isActive: true,
      email: 'rep@test.com'
    } as any);

    // Mockeamos la bd indicando que la orden pertenece a un vendedor diferente
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-123',
      companyId: 'company-2',
      company: { salesRepId: 'sales-rep-999' }
    } as any);

    const req = new NextRequest('http://localhost:3000/api/orders/order-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' })
    });

    await expect(PATCH(req, { params: Promise.resolve({ id: 'order-123' }) } as any))
      .rejects.toThrowError(BusinessRuleError);
  });
});
