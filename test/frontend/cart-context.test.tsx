import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '@/context/CartContext';
import { useAuth } from '@/context/auth-context';

vi.mock('@/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

global.fetch = vi.fn();
Storage.prototype.getItem = vi.fn(() => null);
Storage.prototype.setItem = vi.fn();

function TestConsumer() {
  const { items, addItem, removeItem, itemCount, subtotal } = useCart();
  return (
    <div>
      <span data-testid="count">{itemCount}</span>
      <span data-testid="subtotal">{subtotal}</span>
      <button onClick={() => addItem({ id: 'p1', sku: 'SKU-1', slug: 'prod-1', name: 'Test', price: 10000, inner: 1, minOrderQty: 1, stockQuantity: 100, images: [{ url: 'test.jpg' }] }, 5)}>Add</button>
      <button onClick={() => removeItem('p1')}>Remove</button>
    </div>
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ accessToken: 'test-token' } as any);
  });

  it('Inicia con carrito vacío (itemCount=0, subtotal=0)', () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('0');
  });

  it('Agrega un item al carrito correctamente', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('5');
    });
    // 5 * 10000 = 50000
    expect(screen.getByTestId('subtotal')).toHaveTextContent('50000');
  });

  it('Elimina un item del carrito', async () => {
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('5');
    });

    fireEvent.click(screen.getByText('Remove'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });
    expect(screen.getByTestId('subtotal')).toHaveTextContent('0');
  });
});
