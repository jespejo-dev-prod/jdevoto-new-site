import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/client';
import { withApiHandler } from '@/lib/api-handler';
import { extractUserFromRequest } from '@/lib/auth';
import { logAuditAction } from '@/lib/audit';

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const setting = await prisma.storeSettings.findUnique({
    where: { key },
  });

  if (!setting) {
    return NextResponse.json({ value: null }, { status: 200 });
  }

  return NextResponse.json({ value: setting.value }, { status: 200 });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  
  // Only allow ADMIN to save settings
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key, value } = await req.json();

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
  }

  const setting = await prisma.storeSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  logAuditAction({
    userId: user.id,
    action: "SETTINGS_UPDATED",
    entity: "StoreSettings",
    entityId: key,
    details: { key, value },
    req,
  });

  return NextResponse.json({ success: true, setting }, { status: 200 });
});
