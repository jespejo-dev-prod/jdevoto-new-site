import { describe, it, expect, vi, beforeEach } from 'vitest'
import { orderService } from '@/modules/orders/domain/order.service'
import { prisma } from '@/lib/client'
import { BusinessRuleError } from '@/lib/errors'
import { OrderStatus } from '@prisma/client'

vi.mock('@/lib/client', () => ({
  prisma: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    product: { update: vi.fn() },
    company: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/email', () => ({
  sendOrderShippedEmail: vi.fn(),
  sendOrderStatusUpdateEmail: vi.fn(),
}))

vi.mock('@/modules/pricing/domain/price.service', () => ({
  priceService: {
    calculateOrderTotal: vi.fn(),
  },
}))

describe('Order Status Transitions', () => {
  const mockTx = {
    order: { findUnique: vi.fn(), update: vi.fn() },
    product: { update: vi.fn() },
    company: { findUnique: vi.fn(), update: vi.fn() },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(mockTx as any))
  })

  it('CONFIRMED → SHIPPED es una transición válida', async () => {
    const mockOrder = { id: 'order-1', status: OrderStatus.CONFIRMED, items: [] }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)
    mockTx.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.SHIPPED, company: {}, createdBy: {}, items: [] } as any)

    const result = await orderService.updateOrderStatus('order-1', OrderStatus.SHIPPED)

    expect(result.status).toBe(OrderStatus.SHIPPED)
    expect(mockTx.order.update).toHaveBeenCalled()
  })

  it('SHIPPED → DELIVERED es válida y commitea stock físico', async () => {
    const mockOrder = { 
      id: 'order-1', 
      status: OrderStatus.SHIPPED, 
      items: [{ productId: 'prod-1', quantity: 5 }] 
    }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)
    mockTx.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.DELIVERED, company: {}, createdBy: {}, items: [{ productId: 'prod-1', quantity: 5 }] } as any)
    // commitStockOnDelivery calls tx.order.findUnique inside $transaction
    mockTx.order.findUnique.mockResolvedValue(mockOrder as any)

    const result = await orderService.updateOrderStatus('order-1', OrderStatus.DELIVERED)

    expect(result.status).toBe(OrderStatus.DELIVERED)
    expect(mockTx.product.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'prod-1' },
      data: {
        stockQuantity: { decrement: 5 },
        stockReserved: { decrement: 5 }
      }
    }))
  })

  it('CONFIRMED → CANCELLED es válida y libera stock reservado', async () => {
    const mockOrder = { 
      id: 'order-1', 
      status: OrderStatus.CONFIRMED, 
      companyId: 'comp-1',
      paymentMethod: 'credit_b2b',
      totalGross: 1000,
      items: [{ productId: 'prod-1', quantity: 5 }] 
    }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)
    mockTx.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.CANCELLED, company: {}, createdBy: {}, items: [{ productId: 'prod-1', quantity: 5 }] } as any)
    // reverseOrderEffects calls tx.order.findUnique inside $transaction
    mockTx.order.findUnique.mockResolvedValue(mockOrder as any)

    const result = await orderService.updateOrderStatus('order-1', OrderStatus.CANCELLED)

    expect(result.status).toBe(OrderStatus.CANCELLED)
    expect(mockTx.product.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'prod-1' },
      data: { stockReserved: { decrement: 5 } }
    }))
    expect(mockTx.company.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'comp-1' },
      data: { creditUsed: { decrement: 1000 } }
    }))
  })

  it('DELIVERED → CONFIRMED lanza BusinessRuleError', async () => {
    const mockOrder = { id: 'order-1', status: OrderStatus.DELIVERED }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)

    await expect(
      orderService.updateOrderStatus('order-1', OrderStatus.CONFIRMED)
    ).rejects.toThrowError(BusinessRuleError)
  })

  it('CANCELLED → SHIPPED lanza BusinessRuleError', async () => {
    const mockOrder = { id: 'order-1', status: OrderStatus.CANCELLED }
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any)

    await expect(
      orderService.updateOrderStatus('order-1', OrderStatus.SHIPPED)
    ).rejects.toThrowError(BusinessRuleError)
  })
})
