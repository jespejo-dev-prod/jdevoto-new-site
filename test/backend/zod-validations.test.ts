import { describe, it, expect } from 'vitest'
import { CreateOrderSchema } from '@/validations/order.schemas'
import { CreateProductSchema } from '@/validations/product.schemas'
import { RutSchema } from '@/validations/company.schemas'
import { LoginSchema } from '@/validations/auth.schemas'
import { CategorySchema } from '@/validations/taxonomy.schemas'

describe('Zod Validations', () => {
  describe('CreateOrderSchema', () => {
    it('order con items válidos pasa la validación', () => {
      const data = {
        companyId: 'cm1234567890123456789abcdef',
        items: [{ productId: 'cm1234567890123456789abcdef', quantity: 2 }]
      }
      const result = CreateOrderSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('order sin items falla la validación', () => {
      const data = { companyId: 'cm1234567890123456789abcdef', items: [] }
      const result = CreateOrderSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('CreateProductSchema', () => {
    it('product válido pasa la validación', () => {
      const data = {
        name: 'Tornillo Hexagonal M8',
        slug: 'tornillo-hexagonal-m8',
        sku: 'T-100',
        basePrice: 100,
        categoryId: 'cat-1',
        brandId: 'brand-1',
        images: [{ url: 'https://example.com/img.jpg', position: 0 }],
      }
      const result = CreateProductSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('product sin slug falla la validación', () => {
      const data = {
        name: 'Tornillo',
        sku: 'T-100',
        basePrice: 100,
        categoryId: 'cat-1',
        brandId: 'brand-1',
      }
      const result = CreateProductSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('RutSchema', () => {
    it('RUT válido pasa y se normaliza', () => {
      const result = RutSchema.safeParse('16106617-6')
      expect(result.success).toBe(true)
    })

    it('RUT con dígito verificador inválido falla', () => {
      const result = RutSchema.safeParse('16106617-0')
      expect(result.success).toBe(false)
    })
  })

  describe('LoginSchema', () => {
    it('email y contraseña válidos pasan', () => {
      const data = { email: 'test@example.com', password: 'password123' }
      const result = LoginSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('email inválido falla', () => {
      const data = { email: 'not-an-email', password: 'password123' }
      const result = LoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('contraseña corta falla', () => {
      const data = { email: 'test@example.com', password: '12' }
      const result = LoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('CategorySchema', () => {
    it('categoría válida pasa la validación', () => {
      const data = { name: 'Herramientas', slug: 'herramientas' }
      const result = CategorySchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('slug inválido (con espacios) falla la validación', () => {
      const data = { name: 'Herramientas Manuales', slug: 'herramientas manuales' }
      const result = CategorySchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
