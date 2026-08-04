-- Migration: add_super_admin_role
-- Date: 2026-08-04

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
