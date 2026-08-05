import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/client';
import bcrypt from 'bcryptjs';
import { extractUserFromRequest } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  extractUserFromRequest: vi.fn(),
}));

vi.mock('@/lib/client', () => ({
  prisma: {
    $transaction: vi.fn(async (cb) => {
      // Simulamos que el tx es el mismo prisma
      return cb(prisma);
    }),
    company: {
      create: vi.fn(),
    },
    user: {
      create: vi.fn(),
    },
  }
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  }
}));

describe('Mass Assignment en Register API (Security Regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/auth/register ignora el campo defaultDiscount enviado por el cliente', async () => {
    // Simulamos un atacante intentando inyectar defaultDiscount
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        razonSocial: "Hacker Corp",
        rut: "1-9",
        telefono: "+56912345678",
        giro: "Hacking",
        calleNumero: "Calle Falsa 123",
        region: "RM",
        comuna: "Santiago",
        ciudad: "Santiago",
        email: "hacker@test.com",
        password: "Password123!",
        defaultDiscount: 100 // INTENTO DE INYECCIÓN
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(201); // El registro debe ser exitoso

    // Pero la creación de la empresa en la bd no debe contener defaultDiscount (por lo tanto usará el default del ORM)
    expect(prisma.company.create).toHaveBeenCalledWith({
      data: expect.not.objectContaining({
        defaultDiscount: 100
      })
    });
  });
});
