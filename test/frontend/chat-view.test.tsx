import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderMessagesPanel } from '@/modules/orders/presentation/components/OrderMessagesPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '@/shared/infrastructure/api/use-api';
import React from 'react';

// Mock useApi
const mockFetcher = vi.fn();
vi.mock('@/shared/infrastructure/api/use-api', () => ({
  useApi: () => ({
    fetcher: mockFetcher,
  }),
}));

describe('Order Chat Panel (Frontend)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('debe renderizar la lista de mensajes cargada desde la API', async () => {
    // Simular los mensajes retornados por la API
    const mockMessages = [
      {
        id: 'msg-1',
        message: 'Hola comprador, aquí adjunto la factura',
        attachmentUrl: '/uploads/invoices/factura123.pdf',
        attachmentName: 'factura.pdf',
        createdAt: new Date().toISOString(),
        sender: { firstName: 'Soporte', lastName: 'Tienda', role: 'ADMIN' },
      },
    ];

    // Configurar comportamiento condicional: GET retorna lista de mensajes, POST retorna el mensaje creado
    mockFetcher.mockImplementation((url: string, options?: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ id: 'new-msg-999', message: 'Factura oficial adjunta' });
      }
      return Promise.resolve(mockMessages);
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OrderMessagesPanel orderId="order-123" isAdmin={false} />
      </QueryClientProvider>
    );

    // Esperar a que se renderice el mensaje cargado
    await waitFor(() => {
      expect(screen.getByText('Hola comprador, aquí adjunto la factura')).toBeInTheDocument();
      expect(screen.getByText('factura.pdf')).toBeInTheDocument();
    });
  });

  it('debe permitir escribir un mensaje y adjuntar un archivo para enviar', async () => {
    // Configurar comportamiento condicional
    mockFetcher.mockImplementation((url: string, options?: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ id: 'new-msg-999', message: 'Factura oficial adjunta' });
      }
      return Promise.resolve([]);
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OrderMessagesPanel orderId="order-123" isAdmin={true} />
      </QueryClientProvider>
    );

    // Escribir mensaje
    const textarea = screen.getByPlaceholderText(/Escribe un mensaje/i);
    fireEvent.change(textarea, { target: { value: 'Factura oficial adjunta' } });

    // Adjuntar archivo ficticio
    const fileInput = screen.getByTestId('chat-file-input') as HTMLInputElement;
    const file = new File(['facturapdfcontents'], 'factura_compra.pdf', { type: 'application/pdf' });
    
    // Forzar el trigger de cambio de archivo
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Verificar que el nombre del archivo se muestre en pantalla
    await waitFor(() => {
      expect(screen.getByText('factura_compra.pdf')).toBeInTheDocument();
    });

    // Enviar formulario
    const submitButton = screen.getByRole('button', { name: /Enviar Mensaje/i });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    // Verificar que se llame a la API con los datos correctos
    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledWith('/api/orders/order-123/messages', expect.objectContaining({
        method: 'POST',
      }));
    });
  });
});
