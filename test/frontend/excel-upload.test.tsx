import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportStockPage from '@/app/dashboard/products/import-stock/page';
import React from 'react';

// Mock del hook useApi
const mockPost = vi.fn();
vi.mock('@/shared/infrastructure/api/use-api', () => ({
  useApi: () => ({
    post: mockPost,
  }),
}));

// Mock del router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock del AuthContext para el RoleGuard
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'admin1', role: 'ADMIN', companyId: 'comp1' },
    accessToken: 'admin-token',
  }),
}));

describe('Excel Upload Component (Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el área de drag-and-drop inicial para subir archivo', () => {
    render(<ImportStockPage />);
    
    expect(screen.getByText(/Actualizar Inventario y Precios/i)).toBeInTheDocument();
    expect(screen.getByText(/Selecciona o arrastra tu planilla de productos/i)).toBeInTheDocument();
  });

  it('debe alertar o bloquear si el archivo tiene formato inválido', async () => {
    render(<ImportStockPage />);
    
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    
    // Crear un archivo ficticio pdf (inválido para esta herramienta)
    const file = new File(['hello'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(input, { target: { files: [file] } });
    
    // Debería mostrar un error de formato no válido
    await waitFor(() => {
      expect(screen.getByText(/Formato de archivo no válido/i)).toBeInTheDocument();
    });
  });

  it('debe permitir seleccionar un archivo CSV válido y avanzar a la configuración de delimitadores al hacer click en Continuar', async () => {
    render(<ImportStockPage />);
    
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    
    // Crear un archivo CSV ficticio válido
    const file = new File(['sku,stock,price\n1234,10,15000'], 'productos.csv', { type: 'text/csv' });
    
    fireEvent.change(input, { target: { files: [file] } });

    // Esperar a que el archivo se asocie
    await waitFor(() => {
      expect(screen.getByText('productos.csv')).toBeInTheDocument();
    });

    // Encontrar y hacer click en el botón "Continuar" para avanzar
    const continueButton = screen.getByRole('button', { name: /Continuar/i });
    fireEvent.click(continueButton);

    // Avanza al Paso 2: Asignación de columnas
    await waitFor(() => {
      expect(screen.getByText(/Asignar campos a los productos/i)).toBeInTheDocument();
    });
  });
});
