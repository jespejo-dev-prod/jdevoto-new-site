import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/orders/[id]/messages/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/client';
import { extractUserFromRequest } from '@/lib/auth';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { File } from 'buffer'; // Node 20+ has global File, but let's make sure it is resolved correctly

// Mock Prisma
vi.mock('@/lib/client', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
    orderMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

// Mock Auth
vi.mock('@/lib/auth', () => ({
  extractUserFromRequest: vi.fn(),
}));

// Mock de auditoría
vi.mock('@/lib/audit', () => ({
  logAuditAction: vi.fn(),
}));

// Mock File System para evitar escrituras reales
vi.mock('fs/promises', () => {
  const mockFs = {
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  };
  return {
    ...mockFs,
    default: mockFs,
  };
});

// Mock Email Service
vi.mock('@/lib/email', () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue(undefined),
  sendOrderMessageEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('Chat de Pedidos - Backend API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/orders/[id]/messages', () => {
    it('debe lanzar NotFoundError si el pedido no existe', async () => {
      vi.mocked(extractUserFromRequest).mockReturnValue({ id: 'user1', role: UserRole.BUYER, companyId: 'comp1' } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('message', 'Hola');

      const req = new NextRequest('http://localhost/api/orders/order-not-found/messages', {
        method: 'POST',
        body: formData,
      });

      const res = await POST(req, { params: Promise.resolve({ id: 'order-not-found' }) });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('debe rechazar si el comprador intenta escribir en un pedido de otra empresa', async () => {
      vi.mocked(extractUserFromRequest).mockReturnValue({ id: 'user1', role: UserRole.BUYER, companyId: 'comp1' } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order123',
        companyId: 'comp-diferente',
      } as any);

      const formData = new FormData();
      formData.append('message', 'Hola');

      const req = new NextRequest('http://localhost/api/orders/order123/messages', {
        method: 'POST',
        body: formData,
      });

      const res = await POST(req, { params: Promise.resolve({ id: 'order123' }) });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('debe permitir a un ADMIN escribir en cualquier pedido', async () => {
      vi.mocked(extractUserFromRequest).mockReturnValue({ id: 'admin1', role: UserRole.ADMIN } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order123',
        companyId: 'comp-cualquiera',
        orderNumber: 'ORD-100',
        createdById: 'user-comprador',
      } as any);

      vi.mocked(prisma.orderMessage.create).mockResolvedValue({
        id: 'msg1',
        message: 'Hola desde Admin',
      } as any);

      const formData = new FormData();
      formData.append('message', 'Hola desde Admin');

      const req = new NextRequest('http://localhost/api/orders/order123/messages', {
        method: 'POST',
        body: formData,
      });

      const res = await POST(req, { params: Promise.resolve({ id: 'order123' }) });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.message).toBe('Hola desde Admin');
    });

    it('debe validar que solo se permitan adjuntos PDF, JPG, PNG', async () => {
      vi.mocked(extractUserFromRequest).mockReturnValue({ id: 'admin1', role: UserRole.ADMIN } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order123',
        companyId: 'comp-cualquiera',
      } as any);

      const formData = new FormData();
      // Mock de un archivo de tipo ejecutable inválido
      const invalidFile = {
        size: 100,
        type: 'application/x-msdownload',
        name: 'virus.exe',
        arrayBuffer: async () => new ArrayBuffer(8),
      };
      formData.append('file', invalidFile as any);

      const req = new NextRequest('http://localhost/api/orders/order123/messages', {
        method: 'POST',
      });
      req.formData = async () => {
        const fd = new FormData();
        fd.get = (key: string) => {
          if (key === 'file') return invalidFile as any;
          if (key === 'message') return '';
          return null;
        };
        return fd;
      };

      const res = await POST(req, { params: Promise.resolve({ id: 'order123' }) });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error.code).toBe('INVALID_FILE_TYPE');
      expect(body.error.message).toContain('PDF, JPG y PNG');
    });
  });

  describe('GET /api/orders/[id]/messages', () => {
    it('debe rechazar la obtención de mensajes si el comprador no pertenece a la empresa del pedido', async () => {
      vi.mocked(extractUserFromRequest).mockReturnValue({ id: 'user1', role: UserRole.BUYER, companyId: 'comp1' } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order123',
        companyId: 'comp-diferente',
      } as any);

      const req = new NextRequest('http://localhost/api/orders/order123/messages', {
        method: 'GET',
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'order123' }) });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('debe retornar la lista de mensajes si el usuario tiene permisos', async () => {
      vi.mocked(extractUserFromRequest).mockReturnValue({ id: 'user1', role: UserRole.BUYER, companyId: 'comp1' } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order123',
        companyId: 'comp1',
      } as any);

      const mockMessages = [
        { id: 'm1', message: 'Hola', sender: { firstName: 'Juan', lastName: 'Perez', role: UserRole.BUYER } },
      ];
      vi.mocked(prisma.orderMessage.findMany).mockResolvedValue(mockMessages as any);

      const req = new NextRequest('http://localhost/api/orders/order123/messages', {
        method: 'GET',
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'order123' }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].message).toBe('Hola');
    });
  });
});
