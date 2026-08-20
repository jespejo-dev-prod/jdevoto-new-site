const fs = require('fs');

const protectFile = (filePath, roles) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('RoleGuard')) return; // Already protected

  // Add imports
  if (!content.includes('RoleGuard')) {
    content = content.replace(
      "import { useState", 
      "import { RoleGuard } from '@/components/auth/role-guard';\nimport { UserRole } from '@prisma/client';\nimport { useState"
    );
    if (!content.includes('RoleGuard')) {
      content = content.replace(
        "import { useAuth }", 
        "import { RoleGuard } from '@/components/auth/role-guard';\nimport { UserRole } from '@prisma/client';\nimport { useAuth }"
      );
    }
    if (!content.includes('RoleGuard')) {
      content = content.replace(
        "'use client';", 
        "'use client';\nimport { RoleGuard } from '@/components/auth/role-guard';\nimport { UserRole } from '@prisma/client';"
      );
    }
  }

  // Wrap return
  // Find first return (
  content = content.replace(/return\s*\(\s*<div/s, `return (\n    <RoleGuard allowedRoles={[${roles.map(r => `UserRole.${r}`).join(', ')}]}>\n    <div`);

  // Close RoleGuard
  content = content.replace(/<\/div>\s*\);\s*}\s*$/s, `</div>\n    </RoleGuard>\n  );\n}\n`);

  fs.writeFileSync(filePath, content);
  console.log('Protected:', filePath);
};

protectFile('src/app/dashboard/analytics/page.tsx', ['ADMIN', 'SUPER_ADMIN']);
protectFile('src/app/dashboard/descuentos/page.tsx', ['ADMIN', 'SUPER_ADMIN']);
protectFile('src/app/dashboard/emails/page.tsx', ['ADMIN', 'SUPER_ADMIN']);
protectFile('src/app/dashboard/emails/nueva/page.tsx', ['ADMIN', 'SUPER_ADMIN']);
protectFile('src/app/dashboard/emails/[id]/page.tsx', ['ADMIN', 'SUPER_ADMIN']);
protectFile('src/app/dashboard/facturas/page.tsx', ['ADMIN', 'SUPER_ADMIN']);
protectFile('src/app/dashboard/orders/page.tsx', ['ADMIN', 'SUPER_ADMIN', 'SALES_REP', 'COMPANY_ADMIN', 'BUYER']);
