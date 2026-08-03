import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderStatusBadge } from '@/modules/orders/presentation/components/OrderStatusBadge';

vi.mock('@prisma/client', () => ({
  OrderStatus: {
    DRAFT: 'DRAFT', CONFIRMED: 'CONFIRMED', SHIPPED: 'SHIPPED',
    CANCELLED: 'CANCELLED', REJECTED: 'REJECTED', DELIVERED: 'DELIVERED', PENDING: 'PENDING'
  }
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

describe('OrderStatusBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Muestra "Confirmado" para estado CONFIRMED', () => {
    render(<OrderStatusBadge status="CONFIRMED" />);
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it('Muestra "Enviado" para estado SHIPPED', () => {
    render(<OrderStatusBadge status="SHIPPED" />);
    expect(screen.getByText('Enviado')).toBeInTheDocument();
  });

  it('Muestra "Entregado" para estado DELIVERED', () => {
    render(<OrderStatusBadge status="DELIVERED" />);
    expect(screen.getByText('Entregado')).toBeInTheDocument();
  });

  it('Muestra "Cancelado" para estado CANCELLED', () => {
    render(<OrderStatusBadge status="CANCELLED" />);
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
  });

  it('Muestra "Pendiente" para estado PENDING', () => {
    render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });
});
