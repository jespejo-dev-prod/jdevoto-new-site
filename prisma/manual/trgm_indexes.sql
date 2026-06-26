-- prisma/manual/trgm_indexes.sql
--
-- Índices GIN con pg_trgm para búsqueda ILIKE '%texto%' en products.
-- Prisma no soporta gin_trgm_ops nativamente, por eso se crean aquí.
--
-- Ejecutar una vez en DB nueva o después de un prisma migrate reset:
--   node -e "
--     const {PrismaClient}=require('@prisma/client');
--     const p=new PrismaClient();
--     p.\$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm')
--       .then(()=>p.\$executeRawUnsafe('CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops)'))
--       .then(()=>p.\$executeRawUnsafe('CREATE INDEX IF NOT EXISTS products_sku_trgm_idx ON products USING gin (sku gin_trgm_ops)'))
--       .then(()=>{console.log('✔ GIN indexes creados');return p.\$disconnect();});
--   "

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON products
  USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS products_sku_trgm_idx
  ON products
  USING gin (sku gin_trgm_ops);
