import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH as updateCustomer } from '@/app/api/customers/[id]/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/client';
import { extractUserFromRequest } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/client', () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock Auth
vi.mock('@/lib/auth', () => ({
  extractUserFromRequest: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock('@/lib/admin-notifications', () => ({
  notifyAdminAction: vi.fn().mockResolvedValue(undefined),
}));

describe('Modificación de Crédito Manual - API Cliente B2B', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockExistingCompany = {
    id: 'comp-1',
    razonSocial: 'Ferretería Central',
    creditLimit: 1000000,
    defaultDiscount: 10,
    salesRepId: 'sales-1',
  };

  it('debe rechazar si un COMPANY_ADMIN intenta modificar el límite de crédito de su empresa', async () => {
    const mockUser = { id: 'user-admin', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
    vi.mocked(extractUserFromRequest).mockReturnValue(mockUser as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockExistingCompany as any);

    const payload = {
      creditLimit: 2000000, // Intenta aumentar el límite
    };

    const req = new NextRequest('http://localhost/api/customers/comp-1', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const res = await updateCustomer(req, { params: Promise.resolve({ id: 'comp-1' }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toContain('No estás autorizado para modificar el límite de crédito');
  });

  it('debe rechazar si un COMPANY_ADMIN intenta modificar el descuento por defecto de su empresa', async () => {
    const mockUser = { id: 'user-admin', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
    vi.mocked(extractUserFromRequest).mockReturnValue(mockUser as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockExistingCompany as any);

    const payload = {
      defaultDiscount: 15, // Intenta aumentar el descuento
    };

    const req = new NextRequest('http://localhost/api/customers/comp-1', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const res = await updateCustomer(req, { params: Promise.resolve({ id: 'comp-1' }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.message).toContain('No estás autorizado para modificar el límite de crédito o el descuento base');
  });

  it('debe permitir a un COMPANY_ADMIN editar otros campos de su empresa', async () => {
    const mockUser = { id: 'user-admin', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
    vi.mocked(extractUserFromRequest).mockReturnValue(mockUser as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockExistingCompany as any);
    vi.mocked(prisma.company.update).mockResolvedValue({
      ...mockExistingCompany,
      giro: 'Ferretería al por mayor',
    } as any);

    const payload = {
      giro: 'Ferretería al por mayor',
    };

    const req = new NextRequest('http://localhost/api/customers/comp-1', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const res = await updateCustomer(req, { params: Promise.resolve({ id: 'comp-1' }) });
    expect(res.status).toBe(200);
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'comp-1' },
      data: expect.objectContaining({
        giro: 'Ferretería al por mayor',
      }),
    });
  });

  it('debe permitir a un ADMIN modificar el límite de crédito y descuento de cualquier empresa', async () => {
    const mockUser = { id: 'admin-user', role: UserRole.ADMIN };
    vi.mocked(extractUserFromRequest).mockReturnValue(mockUser as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockExistingCompany as any);
    vi.mocked(prisma.company.update).mockResolvedValue({
      ...mockExistingCompany,
      creditLimit: 3000000,
      defaultDiscount: 25,
    } as any);

    const payload = {
      creditLimit: 3000000,
      defaultDiscount: 25,
    };

    const req = new NextRequest('http://localhost/api/customers/comp-1', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const res = await updateCustomer(req, { params: Promise.resolve({ id: 'comp-1' }) });
    expect(res.status).toBe(200);
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'comp-1' },
      data: expect.objectContaining({
        creditLimit: 3000000,
        defaultDiscount: 25,
      }),
    });
  });
});
