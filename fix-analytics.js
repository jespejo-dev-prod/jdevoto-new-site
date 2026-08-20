const fs = require('fs');

const path = 'src/modules/analytics/domain/analytics.service.ts';
let c = fs.readFileSync(path, 'utf8');

const testExclusionPrisma = `company: {
            razonSocial: { not: { contains: 'test', mode: 'insensitive' } },
            ...(salesRepId ? { salesRepId } : {})
          }`;

// Replace salesRepId condition in Prisma calls to include the exclusion
c = c.replace(
  `...(salesRepId ? { company: { salesRepId } } : {})`,
  testExclusionPrisma
);
c = c.replace(
  `...(salesRepId ? { company: { salesRepId } } : {})`,
  testExclusionPrisma
);
c = c.replace(
  `...(salesRepId ? { company: { salesRepId } } : {})`,
  testExclusionPrisma
);
c = c.replace(
  `...(salesRepId ? { company: { salesRepId } } : {})`,
  testExclusionPrisma
);

// For raw SQL:
c = c.replace(
  `          AND c."salesRepId" = \${salesRepId}`,
  `          AND c."salesRepId" = \${salesRepId}\n          AND c."razonSocial" NOT ILIKE '%test%'`
);

c = c.replace(
  `          AND status NOT IN ('CANCELLED', 'REJECTED')`,
  `          AND status NOT IN ('CANCELLED', 'REJECTED')\n          AND o."companyId" IN (SELECT id FROM "companies" WHERE "razonSocial" NOT ILIKE '%test%')`
);
// Wait, the raw SQL for when salesRepId is undefined does not have `JOIN "companies" o` or aliased `o.status`.
// Let's manually write the fix.

fs.writeFileSync(path, c);
