/**
 * POST /api/webhooks/resend
 *
 * Recibe eventos de tracking de Resend:
 *  - email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
 *
 * Valida la firma HMAC-SHA256 del header svix-signature.
 * Actualiza EmailCampaignRecipient y los contadores en EmailCampaign.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/client';
import crypto from 'crypto';

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  if (!RESEND_WEBHOOK_SECRET) {
    // Bug 2 fix: en producción, rechazar sin secret. Solo permitir en desarrollo explícito.
    if (process.env.NODE_ENV === 'development') {
      console.warn('[RESEND_WEBHOOK] RESEND_WEBHOOK_SECRET no configurado — aceptando en modo dev. NO usar en producción.');
      return true;
    }
    console.error('[RESEND_WEBHOOK] RESEND_WEBHOOK_SECRET no configurado. Rechazando request.');
    return false;
  }

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Construcción del mensaje firmado según spec de Resend/Svix
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const secretBytes = Buffer.from(RESEND_WEBHOOK_SECRET.replace('whsec_', ''), 'base64');
  const signature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  const expectedSigs = svixSignature.split(' ');
  return expectedSigs.some((sig) => sig.startsWith(`v1,${signature}`));
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const isValid = await verifySignature(req, rawBody);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { type, data } = event;

    const resendEmailId: string | undefined = data?.email_id;
    if (!resendEmailId) {
      return NextResponse.json({ ok: true }); // Ignorar si no hay ID
    }

    // Buscar el recipient por resendEmailId
    const recipient = await prisma.emailCampaignRecipient.findFirst({
      where: { resendEmailId },
      select: { id: true, campaignId: true, status: true },
    });

    if (!recipient) {
      return NextResponse.json({ ok: true }); // No encontrado, ignorar
    }

    const now = new Date();

    switch (type) {
      case 'email.delivered':
        await prisma.$transaction([
          prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'DELIVERED' },
          }),
          prisma.emailCampaign.update({
            where: { id: recipient.campaignId },
            data: { totalDelivered: { increment: 1 } },
          }),
        ]);
        break;

      case 'email.opened':
        // Solo contar la primera apertura (evitar duplicados)
        if (recipient.status === 'DELIVERED' || recipient.status === 'SENT') {
          await prisma.$transaction([
            prisma.emailCampaignRecipient.update({
              where: { id: recipient.id },
              data: { status: 'OPENED', openedAt: now },
            }),
            prisma.emailCampaign.update({
              where: { id: recipient.campaignId },
              data: { totalOpened: { increment: 1 } },
            }),
          ]);
        }
        break;

      case 'email.clicked':
        await prisma.$transaction([
          prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'CLICKED', clickedAt: now },
          }),
          prisma.emailCampaign.update({
            where: { id: recipient.campaignId },
            data: { totalClicked: { increment: 1 } },
          }),
        ]);
        break;

      case 'email.bounced':
        await prisma.$transaction([
          prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'BOUNCED', bouncedAt: now },
          }),
          prisma.emailCampaign.update({
            where: { id: recipient.campaignId },
            data: { totalBounced: { increment: 1 } },
          }),
        ]);
        break;

      case 'email.complained':
        // Incrementar contador de quejas y desuscribir automáticamente
        await prisma.$transaction([
          prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'COMPLAINED' },
          }),
          prisma.emailCampaign.update({
            where: { id: recipient.campaignId },
            data: { totalComplained: { increment: 1 } },
          }),
        ]);
        // Desuscribir al usuario automáticamente (fuera de la transacción — no crítico)
        if (data?.to?.[0]) {
          await prisma.user.updateMany({
            where: { email: data.to[0] },
            data: { emailUnsubscribed: true },
          });
        }
        break;

      case 'email.sent':
        // Confirmación de que Resend comenzó el pipeline de entrega — ya está en SENT desde el send route
        break;

      default:
        // Otros eventos — ignorar silenciosamente
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[RESEND_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
