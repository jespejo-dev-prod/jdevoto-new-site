import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShippingTab } from '@/modules/catalog/presentation/components/ProductForm/Tabs/ShippingTab';
import { InventoryTab } from '@/modules/catalog/presentation/components/ProductForm/Tabs/InventoryTab';
import { FormProvider, useForm } from 'react-hook-form';
import React from 'react';

// Un componente wrapper simple para proveer el contexto de react-hook-form
function FormWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm({
    defaultValues: {
      weight: 1.5,
      length: 10,
      width: 20,
      height: 30,
      stockQuantity: 100,
      stockAlert: 5,
      inner: 12,
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('Product Edit Form Tabs (Frontend)', () => {
  it('debe renderizar correctamente los inputs de medidas físicas en la pestaña de Despacho (ShippingTab)', () => {
    const { container } = render(
      <FormWrapper>
        <ShippingTab />
      </FormWrapper>
    );

    // Verificar que los campos de Peso, Largo, Ancho y Alto estén en la pantalla
    expect(screen.getByText(/Peso \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Dimensiones L x A x H \(cm\)/i)).toBeInTheDocument();
    
    // Verificar que existan los inputs correspondientes en el DOM
    expect(container.querySelector('input[name="weight"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="length"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="width"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="height"]')).toBeInTheDocument();

    // Verificar los placeholders L, A, H
    expect(screen.getByPlaceholderText('L')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('A')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('H')).toBeInTheDocument();
  });

  it('debe renderizar correctamente los inputs de stock y empaque mínimo en la pestaña de Inventario (InventoryTab)', () => {
    const { container } = render(
      <FormWrapper>
        <InventoryTab />
      </FormWrapper>
    );

    // Verificar campo de empaque mínimo (Unidades Inner) y stock
    expect(screen.getByText(/Stock Actual/i)).toBeInTheDocument();
    expect(screen.getByText(/Unidades Inner \(Mínimo de Compra y Múltiplo\)/i)).toBeInTheDocument();

    expect(container.querySelector('input[name="stockQuantity"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="inner"]')).toBeInTheDocument();
  });
});
