/**
 * src/modules/catalog/domain/product.constants.ts
 */

export enum ProductTab {
  PRICING = 'pricing',
  INVENTORY = 'inventory',
  SHIPPING = 'shipping',
  SPECS = 'specs',
  SEO = 'seo',
}

export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1588423770674-f2855ee82639?w=500&auto=format&fit=crop&q=60';

export const PRODUCT_UNITS = [
  { value: 'UN', label: 'Unidad' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'LT', label: 'Litro' },
  { value: 'MT', label: 'Metro' },
  { value: 'M2', label: 'Metro Cuadrado' },
  { value: 'M3', label: 'Metro Cúbico' },
  { value: 'PAR', label: 'Par' },
  { value: 'CJA', label: 'Caja' },
  { value: 'BOL', label: 'Bolsa' },
];
