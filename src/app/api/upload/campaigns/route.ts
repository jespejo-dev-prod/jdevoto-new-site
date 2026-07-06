/**
 * POST /api/upload/campaigns
 *
 * Sube imagen para campañas de email. Usa LocalStorageService + sharp
 * igual que el resto de uploads del proyecto. Ancho máximo: 600px (email-optimized).
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractUserFromRequest, requireRole } from '@/lib/auth';
import { UserRole } from '@/generated/client';
import { LocalStorageService } from '@/modules/catalog/application/services/StorageService';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const user = extractUserFromRequest(req);
    requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten imágenes JPEG, PNG o WEBP' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'La imagen no puede superar los 10MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimizar para email: 600px de ancho máximo (estándar email)
    const optimizedBuffer = await sharp(buffer)
      .resize({ width: 600, withoutEnlargement: true })
      .jpeg({ quality: 88, progressive: true })
      .toBuffer();

    const uniqueFilename = `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const optimizedFile = new File([new Uint8Array(optimizedBuffer)], uniqueFilename, { type: 'image/jpeg' });

    const storageService = new LocalStorageService();
    const url = await storageService.upload(optimizedFile, { isTemp: false });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error: any) {
    console.error('[UPLOAD_CAMPAIGN_ERROR]', error);
    if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
      return NextResponse.json(
        { error: error.message },
        { status: error.name === 'UnauthorizedError' ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
