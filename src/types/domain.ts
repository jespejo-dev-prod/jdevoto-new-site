/**
 * types/domain.ts
 *
 * Domain Types — Tipos centrales del dominio de negocio B2B.
 * Independientes de Prisma; usados en Services y Route Handlers.
 */

import { OrderStatus, PaymentStatus, PriceListType, UserRole } from "@prisma/client";

// ============================================================
// IVA CHILE
// ============================================================
export const TAX_RATE = 0.19; // 19% IVA Chile

// ============================================================
// PAGINATION
// ============================================================
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================
// PRICE
// ============================================================
export interface PriceBreakdown {
  productId: string;
  sku: string;
  name: string;
  unit: string;              // Unidad de medida (UN, KG, etc.)
  inner: number;             // Unidades por empaque
  unitNetPrice: number;      // Precio neto sin IVA
  discountPercent: number;   // % descuento aplicado
  discountedNetPrice: number; // unitNetPrice * (1 - discount/100)
  taxAmount: number;          // discountedNetPrice * 0.19
  unitGrossPrice: number;     // discountedNetPrice + taxAmount
  priceSource: "COMPANY_LIST" | "GENERAL_LIST" | "BASE_PRICE" | "OUTLET" | "PROMOTION";
}

// ============================================================
// PRODUCT
// ============================================================
export interface ProductImage {
  url: string;
  isPrimary: boolean;
  altText?: string | null;
  position?: number;
}

/** Relaciones enriquecidas que vienen del use case (getProductBySlugUseCase, etc.) */
export interface ProductBrand {
  id: string;
  name: string;
  slug?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug?: string;
  isOutlet?: boolean;
}

export interface ProductWithPrice {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  /** Puede ser un objeto enriquecido (desde los use cases) o string legacy */
  brand: ProductBrand | string | null;
  brandId?: string | null;
  /** Puede ser un objeto enriquecido o null */
  category?: ProductCategory | null;
  categoryId?: string | null;
  unit: string;
  inner?: number | null;
  basePrice?: number;
  stockQuantity: number;
  stockAlert?: number;
  minOrderQty: number;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  specifications?: any[];
  isActive?: boolean;
  createdAt?: Date | string;
  images: ProductImage[] | string[];
  price: PriceBreakdown;
}

// ============================================================
// ORDER
// ============================================================
export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  companyId: string;
  createdById: string;
  items: CreateOrderItemInput[];
  notes?: string;
  status?: OrderStatus;
  paymentMethod?: string;
  createdAt?: Date;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  companyId: string;
  companyName: string;
  companyRut?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  subtotalNet: number;
  taxAmount: number;
  totalGross: number;
  itemCount: number;
  createdAt: Date;
}

// ============================================================
// AUTH
// ============================================================
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  // Siempre string — todo usuario está obligatoriamente vinculado a una empresa
  companyId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  company?: {
    id: string;
    razonSocial: string;
    rut?: string;
    telefono?: string;
    email?: string | null;
    giro?: string | null;
    creditLimit?: any; // Prisma Decimal is usually sent as string or number in JSON
    creditUsed?: any;
    defaultDiscount?: any;
    paymentTerms?: number;
    paymentTermDiscount?: any;
    shippingStreet?: string | null;
    shippingNumber?: string | null;
    shippingApartment?: string | null;
    shippingCommune?: string | null;
    shippingCity?: string | null;
    shippingRegion?: string | null;
  };
}

export interface TokenPayload {
  sub: string;        // userId
  email: string;
  role: UserRole;
  companyId: string;  // Siempre string, no nulo
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// API RESPONSES
// ============================================================
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
