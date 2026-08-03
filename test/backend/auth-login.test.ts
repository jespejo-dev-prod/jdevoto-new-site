import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUseCase } from '@/modules/auth/application/login.use-case'
import { prisma } from '@/lib/client'
import * as bcrypt from 'bcryptjs'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { UnauthorizedError } from '@/lib/errors'

vi.mock('@/lib/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
  },
}))

const { mockCompare } = vi.hoisted(() => {
  return { mockCompare: vi.fn() }
})
vi.mock('bcryptjs', () => {
  const mod = { compare: mockCompare }
  return { default: mod, compare: mockCompare }
})

vi.mock('@/lib/auth', () => ({
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
}))

describe('loginUseCase', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    isActive: true,
    twoFactorSecret: null,
    company: { id: 'company-1' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(signAccessToken).mockReturnValue('mock-access-token')
    vi.mocked(signRefreshToken).mockReturnValue('mock-refresh-token')
  })

  it('Login exitoso retorna accessToken, refreshToken y datos del usuario', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({ id: 'rt-1' } as any)

    const result = await loginUseCase({ email: 'test@example.com', password: 'password123' })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com', isActive: true },
      include: { company: expect.any(Object) },
    })
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword')
    expect(signAccessToken).toHaveBeenCalledWith(expect.any(Object))
    expect(signRefreshToken).toHaveBeenCalledWith('user-1')
    expect(prisma.refreshToken.create).toHaveBeenCalled()

    expect(result).toEqual({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: expect.any(Object),
    })
  })

  it('Rechaza con UnauthorizedError si el email no existe', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(
      loginUseCase({ email: 'noexiste@example.com', password: 'password123' })
    ).rejects.toThrowError(new UnauthorizedError('Credenciales inválidas'))
  })

  it('Rechaza con UnauthorizedError si la contraseña es incorrecta', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    await expect(
      loginUseCase({ email: 'test@example.com', password: 'wrongpassword' })
    ).rejects.toThrowError(new UnauthorizedError('Credenciales inválidas'))
  })

  it('Rechaza si el usuario está desactivado (findUnique returns null because isActive:true is in where)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await expect(
      loginUseCase({ email: 'inactive@example.com', password: 'password123' })
    ).rejects.toThrowError(UnauthorizedError)
  })

  it('Retorna requires2fa si el usuario tiene twoFactorSecret', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      twoFactorSecret: 'secret-123',
    } as any)

    const result = await loginUseCase({ email: 'test@example.com', password: 'password123' })

    expect(result).toEqual({
      requires2fa: true,
      userId: 'user-1',
      email: 'test@example.com',
    })
    expect(signAccessToken).not.toHaveBeenCalled()
  })
})
