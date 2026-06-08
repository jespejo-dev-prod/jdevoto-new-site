/**
 * validations/order.schemas.ts
 *
 * Esquemas Zod para validación de datos de Pedidos (Orders).
 */

import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const CreateOrderItemSchema = z.object({
  productId: z.string().cuid("productId debe ser un CUID válido"),
  quantity: z.number().int().min(1, "La cantidad mínima es 1"),
  discount: z.number().min(0).max(100).optional(),
  unitNetPrice: z.number().min(0).optional(),
});

export const CreateOrderSchema = z.object({
  companyId: z.string().cuid("companyId debe ser un CUID válido"),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentMethod: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  items: z
    .array(CreateOrderItemSchema)
    .min(1, "El pedido debe tener al menos un ítem"),
  notes: z.string().max(1000).optional(),
  shippingAddress: z.object({
    street: z.string().optional().or(z.literal("")),
    number: z.string().optional().or(z.literal("")),
    apartment: z.string().optional().or(z.literal("")),
    comuna: z.string().optional().or(z.literal("")),
    region: z.string().optional().or(z.literal("")),
  }).optional(),
  billingAddress: z.object({
    street: z.string().optional().or(z.literal("")),
    number: z.string().optional().or(z.literal("")),
    comuna: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    email: z.string().optional().or(z.literal("")),
  }).optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  internalNotes: z.string().max(1000).optional(),
});

export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;

export const GetOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  companyId: z.string().cuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().optional(),
});

export type GetOrdersQuery = z.infer<typeof GetOrdersQuerySchema>;
