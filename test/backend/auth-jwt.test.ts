import { describe, it, expect, beforeEach } from 'vitest'
import { signAccessToken, verifyToken, requireRole } from '@/lib/auth'
import { UnauthorizedError, ForbiddenError } from '@/lib/errors'

describe('JWT Utilities', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'testsecret123456789012345678901234567890'
  })

  it('signAccessToken genera un JWT válido que puede ser decodificado', () => {
    const payload = { id: 'user-1', role: 'ADMIN' }
    const token = signAccessToken(payload)

    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3)
  })

  it('verifyToken valida correctamente un token generado por signAccessToken', () => {
    const payload = { id: 'user-1', role: 'ADMIN' }
    const token = signAccessToken(payload)
    const decoded = verifyToken(token)

    expect(decoded).toMatchObject(payload)
  })

  it('verifyToken lanza UnauthorizedError con un token con firma inválida', () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid_signature_here'

    expect(() => verifyToken(invalidToken)).toThrow(UnauthorizedError)
  })

  it('requireRole permite acceso cuando el rol del usuario está en la lista', () => {
    const user = { id: 'user-1', role: 'ADMIN' }
    
    expect(() => requireRole(user, ['ADMIN', 'MANAGER'])).not.toThrow()
  })

  it('requireRole lanza ForbiddenError cuando el rol no está en la lista permitida', () => {
    const user = { id: 'user-1', role: 'CUSTOMER' }
    
    expect(() => requireRole(user, ['ADMIN', 'MANAGER'])).toThrow(ForbiddenError)
  })
})
