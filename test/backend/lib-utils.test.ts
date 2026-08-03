import { describe, it, expect } from 'vitest'
import { serializeDecimal } from '@/lib/utils'
import { slugify } from '@/lib/slugify'

describe('Utilities', () => {
  describe('serializeDecimal', () => {
    it('convierte un objeto tipo Decimal a number', () => {
      // Simula un Prisma Decimal que tiene constructor.name === 'Decimal'
      // y puede convertirse a number con Number()
      const decimalVal = Object.create(null)
      Object.defineProperty(decimalVal, 'constructor', {
        value: { name: 'Decimal' },
        enumerable: false,
      })
      // Number(decimalVal) needs to return a valid number — use valueOf
      decimalVal.valueOf = () => 10.5
      decimalVal.toString = () => '10.5'

      const result = serializeDecimal(decimalVal)
      expect(result).toBe(10.5)
    })

    it('convierte BigInt a number', () => {
      const result = serializeDecimal(BigInt(42))
      expect(result).toBe(42)
    })

    it('convierte campos numéricos conocidos de Prisma correctamente', () => {
      // serializeDecimal converts known fields like basePrice, stockQuantity etc
      const data = {
        basePrice: '100.50',
        stockQuantity: '20',
        name: 'Producto'
      }
      const result = serializeDecimal(data) as any
      expect(result.basePrice).toBe(100.50)
      expect(result.stockQuantity).toBe(20)
      expect(result.name).toBe('Producto')
    })

    it('retorna null/undefined tal cual', () => {
      expect(serializeDecimal(null)).toBeNull()
      expect(serializeDecimal(undefined)).toBeUndefined()
    })
    
    it('maneja arrays correctamente', () => {
      const arr = [BigInt(1), BigInt(2)]
      const result = serializeDecimal(arr)
      expect(result).toEqual([1, 2])
    })
  })

  describe('slugify', () => {
    it('convierte texto normal a slug', () => {
      expect(slugify('Tornillo M8 Hexagonal')).toBe('tornillo-m8-hexagonal')
    })

    it('recorta y colapsa espacios múltiples', () => {
      expect(slugify('  Perno  M10  ')).toBe('perno-m10')
    })

    it('remueve caracteres especiales y acentos', () => {
      expect(slugify('Ángulo 90°')).toBe('ngulo-90')
    })
  })
})
