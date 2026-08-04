-- Migration: admin_nullable_companyid_login_ratelimit
-- Date: 2026-08-04
--
-- Changes:
--   1. users: make companyId nullable (ADMIN and SALES_REP can exist without a company)
--   2. users: add failedLoginAttempts column (default 0)
--   3. users: add lockedUntil column (nullable DateTime for account lockout)

-- 1. Make companyId nullable
ALTER TABLE "users" ALTER COLUMN "companyId" DROP NOT NULL;

-- 2. Add failedLoginAttempts
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;

-- 3. Add lockedUntil
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
