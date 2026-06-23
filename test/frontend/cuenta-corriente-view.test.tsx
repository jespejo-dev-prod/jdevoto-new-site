import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CuentaCorrientePage from '@/app/dashboard/cuenta-corriente/page';
import { useCustomer, useCustomers } from '@/modules/customers/presentation/hooks/useCustomers';
import { useOrders } from '@/modules/orders/presentation/hooks/useOrders';
import React from 'react';

// Mock Auth
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user1', role: 'BUYER', companyId: 'comp-1' },
    accessToken: 'token123',
  }),
}));

// Mock Query Client
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

// Mock Customers Hooks
vi.mock('@/modules/customers/presentation/hooks/useCustomers', () => ({
  useCustomer: vi.fn(),
  useCustomers: vi.fn(),
}));

// Mock Orders Hooks
vi.mock('@/modules/orders/presentation/hooks/useOrders', () => ({
  useOrders: vi.fn(),
}));

describe('Cuenta Corriente View (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el cupo de crédito y órdenes pendientes de pago de la empresa', () => {
    // Simular que el usuario es de tipo BUYER y tiene una empresa asociada con crédito
    const mockCompanyData = {
      id: 'comp-1',
      razonSocial: 'Mi Empresa B2B',
      creditLimit: 500000,
      creditUsed: 150000,
      paymentTerms: 30,
      isActive: true,
    };

    vi.mocked(useCustomer).mockReturnValue({
      data: mockCompanyData,
      isLoading: false,
    } as any);

    vi.mocked(useCustomers).mockReturnValue({
      data: [mockCompanyData],
      meta: { total: 1 },
      isLoading: false,
    } as any);

    const mockOrders = [
      {
        id: 'ord-1',
        orderNumber: 'ORD-2024-001',
        companyName: 'Mi Empresa B2B',
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: 'credit_b2b',
        totalGross: 100000,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(useOrders).mockReturnValue({
      data: { data: mockOrders, meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
    } as any);

    render(<CuentaCorrientePage />);

    // Verificar que se renderiza el título principal
    expect(screen.getByText(/Cuenta Corriente B2B/i)).toBeInTheDocument();

    // Verificar que se muestran los montos de crédito (ocupado, límite)
    expect(screen.getByText(/Cupo Autorizado/i)).toBeInTheDocument();
    
    // Verificar que se renderiza el listado de facturas/pedidos pendientes
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.getByText('$100.000')).toBeInTheDocument();
  });
});
