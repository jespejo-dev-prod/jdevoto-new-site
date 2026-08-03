import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleGuard } from '@/components/auth/role-guard';
import { useAuth } from '@/context/auth-context';

vi.mock('@/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  UserRole: { ADMIN: 'ADMIN', BUYER: 'BUYER', SALES_REP: 'SALES_REP', COMPANY_ADMIN: 'COMPANY_ADMIN' }
}));

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renderiza children cuando el rol del usuario está en allowedRoles', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { role: 'ADMIN' },
      loading: false,
    } as any);

    render(
      <RoleGuard allowedRoles={['ADMIN', 'BUYER']}>
        <div data-testid="protected-content">Contenido Protegido</div>
      </RoleGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('Muestra "Acceso No Autorizado" cuando el rol no está permitido', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { role: 'BUYER' },
      loading: false,
    } as any);

    render(
      <RoleGuard allowedRoles={['ADMIN']}>
        <div data-testid="protected-content">Contenido Protegido</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Acceso No Autorizado')).toBeInTheDocument();
  });

  it('Muestra spinner de carga mientras loading es true', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
    } as any);

    const { container } = render(
      <RoleGuard allowedRoles={['ADMIN']}>
        <div data-testid="protected-content">Contenido Protegido</div>
      </RoleGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Acceso No Autorizado')).not.toBeInTheDocument();
    
    // El spinner por lo general es un SVG
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
