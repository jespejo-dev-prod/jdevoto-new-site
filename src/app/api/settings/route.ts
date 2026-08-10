import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/client';
import { withApiHandler } from '@/lib/api-handler';
import { extractUserFromRequest } from '@/lib/auth';
import { logAuditAction } from '@/lib/audit';
import { encryptData } from '@/lib/crypto';

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

  let valueToReturn = setting.value;

  // Mask accessToken for mercadopago_config
  if (key === 'mercadopago_config' && valueToReturn && typeof valueToReturn === 'object') {
    const mpValue = valueToReturn as any;
    if (mpValue.accessToken) {
      mpValue.accessToken = '••••••••••••••••';
      mpValue.configured = true;
    }
  }

  return NextResponse.json({ value: valueToReturn }, { status: 200 });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const user = extractUserFromRequest(req);
  
  // Only allow ADMIN to save settings
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key, value } = await req.json();

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
  }

  let valueToSave = value;

  if (key === 'mercadopago_config' && valueToSave && typeof valueToSave === 'object') {
    const mpValue = valueToSave as any;
    
    // If the frontend sends the mask, it means it wasn't changed.
    if (mpValue.accessToken && mpValue.accessToken.includes('••••')) {
      const existingSetting = await prisma.storeSettings.findUnique({ where: { key } });
      if (existingSetting && existingSetting.value && typeof existingSetting.value === 'object') {
        const existingMpValue = existingSetting.value as any;
        mpValue.accessToken = existingMpValue.accessToken;
      } else {
        mpValue.accessToken = '';
      }
    } else if (mpValue.accessToken) {
      // It's a new token, encrypt it
      mpValue.accessToken = encryptData(mpValue.accessToken);
    }
  }

  const setting = await prisma.storeSettings.upsert({
    where: { key },
    update: { value: valueToSave },
    create: { key, value: valueToSave },
  });

  await logAuditAction({
    userId: user.id,
    action: "SETTINGS_UPDATED",
    entity: "StoreSettings",
    entityId: key,
    details: { key, value: key === 'mercadopago_config' ? { ...valueToSave, accessToken: '[HIDDEN]' } : valueToSave },
    req,
  });

  return NextResponse.json({ success: true, setting }, { status: 200 });
});
