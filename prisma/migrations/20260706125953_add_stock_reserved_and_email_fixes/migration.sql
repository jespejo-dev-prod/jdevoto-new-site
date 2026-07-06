-- Migration: add_stock_reserved_and_email_fixes
-- Fecha: 2026-07-06
--
-- Cambios:
--   1. products: agregar columna stockReserved (BigInt default 0)
--      Stock reservado por órdenes activas (DRAFT, PENDING, CONFIRMED, SHIPPED).
--      El descuento real del stockQuantity ocurre al pasar a DELIVERED.
--
--   2. email_campaigns: agregar columna totalComplained (Int default 0)
--      Contador de quejas (spam) recibidas para la campaña.
--
--   3. email_campaign_recipients: agregar UNIQUE constraint (campaignId, email)
--      Requerido para que prisma createMany({ skipDuplicates: true }) funcione correctamente.

-- 1. Stock reservado en productos
ALTER TABLE "products" ADD COLUMN "stockReserved" BIGINT NOT NULL DEFAULT 0;

-- 2. Contador de quejas en campañas de email
ALTER TABLE "email_campaigns" ADD COLUMN "totalComplained" INTEGER NOT NULL DEFAULT 0;

-- 3. Constraint única para prevenir duplicados en destinatarios
ALTER TABLE "email_campaign_recipients" ADD CONSTRAINT "email_campaign_recipients_campaignId_email_key" UNIQUE ("campaignId", "email");

-- Script de migración de datos existentes:
-- Reconstruir stockReserved a partir de órdenes activas ya existentes
-- (ejecutar manualmente si hay datos en producción)
--
-- UPDATE products p
-- SET "stockReserved" = COALESCE((
--   SELECT SUM(oi.quantity)
--   FROM order_items oi
--   JOIN orders o ON oi."orderId" = o.id
--   WHERE oi."productId" = p.id
--     AND o.status NOT IN ('DELIVERED', 'CANCELLED', 'REJECTED')
-- ), 0);
--
-- -- Restaurar stockQuantity: devolver lo que pedidos no-DELIVERED ya descontaron
-- UPDATE products p
-- SET "stockQuantity" = p."stockQuantity" + COALESCE((
--   SELECT SUM(oi.quantity)
--   FROM order_items oi
--   JOIN orders o ON oi."orderId" = o.id
--   WHERE oi."productId" = p.id
--     AND o.status NOT IN ('DELIVERED', 'CANCELLED', 'REJECTED')
-- ), 0);
