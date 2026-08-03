import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getList, POST as createUser } from '@/app/api/users/route';
import { GET as getUser, PATCH as updateUser, DELETE as deleteUser } from '@/app/api/users/[id]/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/client';
import { extractUserFromRequest } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock Prisma
vi.mock('@/lib/client', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password_123'),
  },
}));

describe('Gestión de Equipo Interno de Clientes - Rol COMPANY_ADMIN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users (Listar Usuarios)', () => {
    it('debe filtrar por companyId si el usuario solicitante es COMPANY_ADMIN', async () => {
      const mockAdmin = { id: 'admin-1', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
      vi.mocked(extractUserFromRequest).mockReturnValue(mockAdmin as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      const req = new NextRequest('http://localhost/api/users?page=1&limit=10');
      const res = await getList(req);
      
      expect(res.status).toBe(200);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'comp-1',
          }),
        })
      );
    });

    it('no debe filtrar por companyId si el usuario solicitante es ADMIN', async () => {
      const mockAdmin = { id: 'superadmin-1', role: UserRole.ADMIN };
      vi.mocked(extractUserFromRequest).mockReturnValue(mockAdmin as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      const req = new NextRequest('http://localhost/api/users?page=1&limit=10');
      const res = await getList(req);

      expect(res.status).toBe(200);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            companyId: expect.any(String),
          }),
        })
      );
    });
  });

  describe('POST /api/users (Crear Usuario)', () => {
    it('debe rechazar si un COMPANY_ADMIN intenta crear un usuario con rol ADMIN o COMPANY_ADMIN', async () => {
      const mockAdmin = { id: 'admin-1', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
      vi.mocked(extractUserFromRequest).mockReturnValue(mockAdmin as any);

      const payload = {
        email: 'new@comp.com',
        password: 'securePassword123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.COMPANY_ADMIN,
        companyId: 'comp-1',
      };

      const req = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await createUser(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('No tienes permisos');
    });

    it('debe forzar el companyId del COMPANY_ADMIN creador al crear un BUYER', async () => {
      const mockAdmin = { id: 'admin-1', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
      vi.mocked(extractUserFromRequest).mockReturnValue(mockAdmin as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-user',
        email: 'buyer@comp.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.BUYER,
        companyId: 'comp-1',
      } as any);

      const payload = {
        email: 'buyer@comp.com',
        password: 'securePassword123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.BUYER,
        companyId: 'comp-different', // Intenta asignar otra empresa
      };

      const req = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const res = await createUser(req);
      expect(res.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: 'comp-1', // Se sobreescribe con comp-1
        }),
      });
    });
  });

  describe('GET /api/users/[id] (Obtener Usuario)', () => {
    it('debe rechazar si un COMPANY_ADMIN intenta obtener un usuario de otra empresa', async () => {
      const mockAdmin = { id: 'admin-1', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
      vi.mocked(extractUserFromRequest).mockReturnValue(mockAdmin as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-2',
        companyId: 'comp-2', // Empresa diferente
      } as any);

      const req = new NextRequest('http://localhost/api/users/user-2');
      const res = await getUser(req, { params: Promise.resolve({ id: 'user-2' }) });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('No tienes permisos');
    });
  });

  describe('PATCH /api/users/[id] (Editar Usuario)', () => {
    it('debe rechazar si un COMPANY_ADMIN intenta editar un usuario de otra empresa', async () => {
      const mockAdmin = { id: 'admin-1', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
      vi.mocked(extractUserFromRequest).mockReturnValue(mockAdmin as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-2',
        companyId: 'comp-2',
      } as any);

      const req = new NextRequest('http://localhost/api/users/user-2', {
        method: 'PATCH',
        body: JSON.stringify({ firstName: 'Jane' }),
      });
      const res = await updateUser(req, { params: Promise.resolve({ id: 'user-2' }) });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('No tienes permisos');
    });

    it('debe rechazar si un COMPANY_ADMIN intenta promover a un usuario a ADMIN o COMPANY_ADMIN', async () => {
      const mockAdmin = { id: 'admin-1', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
      vi.mocked(extractUserFromRequest).mockReturnValue(mockAdmin as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-2',
        companyId: 'comp-1',
        role: UserRole.BUYER,
      } as any);

      const req = new NextRequest('http://localhost/api/users/user-2', {
        method: 'PATCH',
        body: JSON.stringify({ role: UserRole.ADMIN }),
      });
      const res = await updateUser(req, { params: Promise.resolve({ id: 'user-2' }) });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('No tienes permisos para asignar este rol');
    });
  });

  describe('DELETE /api/users/[id] (Eliminar Usuario)', () => {
    it('debe rechazar si un COMPANY_ADMIN intenta eliminar un usuario de otra empresa', async () => {
      const mockAdmin = { id: 'admin-1', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
      vi.mocked(extractUserFromRequest).mockReturnValue(mockAdmin as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-2',
        companyId: 'comp-2',
      } as any);

      const req = new NextRequest('http://localhost/api/users/user-2', { method: 'DELETE' });
      const res = await deleteUser(req, { params: Promise.resolve({ id: 'user-2' }) });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('No tienes permisos para eliminar este usuario');
    });

    it('debe eliminar correctamente si pertenece a la misma empresa', async () => {
      const mockAdmin = { id: 'admin-1', role: UserRole.COMPANY_ADMIN, companyId: 'comp-1' };
      vi.mocked(extractUserFromRequest).mockReturnValue(mockAdmin as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-2',
        companyId: 'comp-1',
      } as any);
      vi.mocked(prisma.user.delete).mockResolvedValue({ id: 'user-2' } as any);

      const req = new NextRequest('http://localhost/api/users/user-2', { method: 'DELETE' });
      const res = await deleteUser(req, { params: Promise.resolve({ id: 'user-2' }) });

      expect(res.status).toBe(200);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-2' } });
    });
  });
});
