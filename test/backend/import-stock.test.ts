import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/products/import-stock/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/client';
import { extractUserFromRequest, requireRole } from '@/lib/auth';
import { ForbiddenError } from '@/lib/errors';
import { UserRole } from '@prisma/client';

// Mock de la base de datos (Prisma client)
vi.mock('@/lib/client', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock de autenticación y autorización
vi.mock('@/lib/auth', () => ({
  extractUserFromRequest: vi.fn(),
  requireRole: vi.fn(),
}));

describe('POST /api/products/import-stock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRole).mockImplementation(() => {});
  });

  it('debe rechazar la petición si el usuario no es ADMIN', async () => {
    const mockUser = { id: 'user1', role: UserRole.BUYER };
    vi.mocked(extractUserFromRequest).mockReturnValue(mockUser as any);
    vi.mocked(requireRole).mockImplementation(() => {
      throw new ForbiddenError("Rol 'BUYER' no tiene acceso");
    });

    const req = new NextRequest('http://localhost/api/products/import-stock', {
      method: 'POST',
      body: JSON.stringify({ updates: [] }),
    });

    // withApiHandler captura el error de dominio (ForbiddenError) y lo convierte en 403
    const res = await POST(req, {} as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('debe retornar mensaje de error si no se reciben datos', async () => {
    const mockUser = { id: 'admin1', role: UserRole.ADMIN };
    vi.mocked(extractUserFromRequest).mockReturnValue(mockUser as any);

    const req = new NextRequest('http://localhost/api/products/import-stock', {
      method: 'POST',
      body: JSON.stringify({ updates: [] }),
    });

    const res = await POST(req, {} as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toContain('No se recibieron datos');
  });

  it('debe filtrar datos inválidos agregándolos a failuresList', async () => {
    const mockUser = { id: 'admin1', role: UserRole.ADMIN };
    vi.mocked(extractUserFromRequest).mockReturnValue(mockUser as any);

    const req = new NextRequest('http://localhost/api/products/import-stock', {
      method: 'POST',
      body: JSON.stringify({
        updates: [
          { sku: '', stock: -5, price: -100 }, // Inválido
        ],
      }),
    });

    const res = await POST(req, {} as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.failures.length).toBe(1);
    expect(body.data.failures[0].sku).toBe('SKU_DESCONOCIDO');
    expect(body.data.failures[0].reason).toContain('Datos de entrada inválidos');
  });

  it('debe actualizar stock y precio de productos válidos usando acolchado de SKU si es necesario', async () => {
    const mockUser = { id: 'admin1', role: UserRole.ADMIN };
    vi.mocked(extractUserFromRequest).mockReturnValue(mockUser as any);

    // Simulamos que el SKU "0001234" existe en la base de datos, pero el archivo envía "1234"
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { sku: '0001234' } as any,
    ]);

    vi.mocked(prisma.$transaction).mockResolvedValue([
      { sku: '0001234', stockQuantity: 50n, basePrice: 15000 } as any,
    ]);

    const req = new NextRequest('http://localhost/api/products/import-stock', {
      method: 'POST',
      body: JSON.stringify({
        updates: [
          { sku: '1234', stock: 50, price: 15000 },
        ],
      }),
    });

    const res = await POST(req, {} as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.successes.length).toBe(1);
    expect(body.data.successes[0].sku).toBe('0001234'); // SKU final de la BD
    expect(body.data.successes[0].stock).toBe(50);
    expect(body.data.successes[0].price).toBe(15000);
    expect(body.data.failures.length).toBe(0);
  });

  it('debe realizar actualizaciones parciales (solo stock o solo precio)', async () => {
    const mockUser = { id: 'admin1', role: UserRole.ADMIN };
    vi.mocked(extractUserFromRequest).mockReturnValue(mockUser as any);

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { sku: 'PROD01' } as any,
      { sku: 'PROD02' } as any,
    ]);

    vi.mocked(prisma.$transaction).mockResolvedValue([
      { sku: 'PROD01', stockQuantity: 20n, basePrice: 5000 } as any,
      { sku: 'PROD02', stockQuantity: 5n, basePrice: 8000 } as any,
    ]);

    const req = new NextRequest('http://localhost/api/products/import-stock', {
      method: 'POST',
      body: JSON.stringify({
        updates: [
          { sku: 'PROD01', stock: 20 }, // solo stock
          { sku: 'PROD02', price: 8000 }, // solo precio
        ],
      }),
    });

    const res = await POST(req, {} as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.successes.length).toBe(2);
    expect(body.data.successes[0].sku).toBe('PROD01');
    expect(body.data.successes[0].stock).toBe(20);
    expect(body.data.successes[0].price).toBeNull();
    expect(body.data.successes[1].sku).toBe('PROD02');
    expect(body.data.successes[1].stock).toBeNull();
    expect(body.data.successes[1].price).toBe(8000);
  });
});
