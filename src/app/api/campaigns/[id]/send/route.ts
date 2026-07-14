/**
 * POST /api/campaigns/[id]/send
 *
 * Envía la campaña a todos los destinatarios resueltos según recipientTarget.
 * Usa Resend en lotes de 50 emails por llamada.
 * Solo ADMIN puede disparar el envío.
 */

import { withApiHandler, ok } from '@/lib/api-handler';
import { extractUserFromRequest, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/client';
import { UserRole } from '@/generated/client';
import { NotFoundError, ValidationError, BusinessRuleError } from '@/lib/errors';
import { buildCampaignHtml } from '@/lib/email-campaigns';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import type { RouteContext } from '@/lib/api-handler';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_for_build');
const BATCH_SIZE = 50;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'JDevoto <no-reply@jdevoto.cl>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jdevoto.cl';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new BusinessRuleError('JWT_SECRET no está configurado en las variables de entorno');
  return secret;
}

function buildUnsubscribeUrl(email: string): string {
  const token = jwt.sign({ email, type: 'unsubscribe' }, getJwtSecret(), { expiresIn: '30d' });
  return `${APP_URL}/api/unsubscribe?token=${token}`;
}

interface Recipient {
  id: string;
  email: string;
  firstName: string;
}

async function resolveRecipients(campaign: {
  id: string;
  recipientTarget: string;
}): Promise<Recipient[]> {
  const baseWhere = {
    isActive: true,
    emailUnsubscribed: false,
    email: { not: '' },
  };

  if (campaign.recipientTarget === 'ALL') {
    return prisma.user.findMany({
      where: {
        ...baseWhere,
        role: { in: [UserRole.BUYER, UserRole.COMPANY_ADMIN] },
      },
      select: { id: true, email: true, firstName: true },
    });
  }

  if (campaign.recipientTarget === 'MANUAL') {
    // Para MANUAL: usar destinatarios pre-cargados en EmailCampaignRecipient
    // (cargados antes de disparar el envío, por ejemplo via una importación CSV)
    const preloaded = await prisma.emailCampaignRecipient.findMany({
      where: { campaignId: campaign.id, status: 'QUEUED' },
      select: { email: true, userId: true },
    });
    if (preloaded.length === 0) {
      throw new BusinessRuleError(
        'No hay destinatarios cargados para esta campaña MANUAL. Importa la lista antes de enviar.',
        'NO_MANUAL_RECIPIENTS'
      );
    }
    // Filtrar usuarios que estén activos y no desuscritos (si tienen userId)
    const userIds = preloaded.map(r => r.userId).filter(Boolean) as string[];
    const unsubscribed = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds }, emailUnsubscribed: true },
          select: { id: true },
        })
      : [];
    const unsubscribedIds = new Set(unsubscribed.map(u => u.id));
    return preloaded
      .filter(r => !r.userId || !unsubscribedIds.has(r.userId))
      .map(r => ({ id: r.userId ?? '', email: r.email, firstName: '' }));
  }

  // BY_COMPANY: no implementado aún en la UI — fallback a ALL con aviso
  // Cuando se agregue la selección de empresas, filtrar aquí por companyId
  return prisma.user.findMany({
    where: {
      ...baseWhere,
      role: { in: [UserRole.BUYER, UserRole.COMPANY_ADMIN] },
    },
    select: { id: true, email: true, firstName: true },
  });
}

export const POST = withApiHandler(async (req, ctx: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { id } = await ctx.params;

  if (!process.env.RESEND_API_KEY) {
    throw new BusinessRuleError('RESEND_API_KEY no está configurado en las variables de entorno');
  }

  // 1. Marcar como SENDING de forma atómica — previene doble envío por race condition
  const updated = await prisma.emailCampaign.updateMany({
    where: { id, status: 'DRAFT' },
    data: { status: 'SENDING' },
  });

  if (updated.count === 0) {
    // La campaña no existe o ya fue enviada/está en envío
    const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundError('Campaña', id);
    throw new ValidationError(`La campaña ya está en estado '${campaign.status}'. Solo se pueden enviar campañas en estado DRAFT.`);
  }

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError('Campaña', id);

  let totalSent = 0;
  let totalFailed = 0;

  try {
    // 2. Resolver destinatarios
    const recipients = await resolveRecipients(campaign);
    if (recipients.length === 0) {
      throw new BusinessRuleError('No hay destinatarios activos disponibles para esta campaña');
    }

    // 3. Crear registros en EmailCampaignRecipient (estado QUEUED) — skipDuplicates requiere @@unique([campaignId, email])
    await prisma.emailCampaignRecipient.createMany({
      data: recipients.map((r) => ({
        campaignId: id,
        userId: r.id || null,
        email: r.email,
        status: 'QUEUED' as const,
      })),
      skipDuplicates: true,
    });

    // 4. Enviar en lotes de 50
    const batches: typeof recipients[] = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      // Calcular URL de unsubscribe una sola vez por recipient
      const batchWithUrls = batch.map((r) => ({
        ...r,
        unsubscribeUrl: buildUnsubscribeUrl(r.email),
      }));

      const emails = batchWithUrls.map((r) => ({
        from: FROM_EMAIL,
        to: [r.email],
        subject: campaign.subject,
        html: buildCampaignHtml({
          subject: campaign.subject,
          previewText: campaign.previewText ?? undefined,
          headerImageUrl: campaign.headerImageUrl ?? undefined,
          ctaText: campaign.ctaText ?? undefined,
          ctaUrl: campaign.ctaUrl ?? undefined,
          unsubscribeUrl: r.unsubscribeUrl,
          recipientEmail: r.email,
        }),
        headers: {
          'List-Unsubscribe': `<${r.unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }));

      try {
        const result = await resend.batch.send(emails);

        // Resend batch API devuelve los resultados dentro de result.data.data en su SDK Node
        const batchData = Array.isArray(result.data) 
          ? result.data 
          : (result.data as any)?.data;

        if (batchData && Array.isArray(batchData)) {
          const updatePromises = batchData.map((sent: { id?: string } | null, idx: number) => {
            const recipientEmail = batchWithUrls[idx]?.email;
            if (!recipientEmail || !sent?.id) return Promise.resolve();
            return prisma.emailCampaignRecipient.updateMany({
              where: { campaignId: id, email: recipientEmail },
              data: { status: 'SENT', resendEmailId: sent.id },
            });
          });
          await Promise.all(updatePromises);
          totalSent += batchData.length;
        }
      } catch (err) {
        console.error('[CAMPAIGN_SEND_BATCH_ERROR]', err);
        totalFailed += batch.length;
      }
    }
  } catch (err) {
    // Si falla antes o durante el envío, marcar la campaña como FAILED
    await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'FAILED', sentAt: new Date() },
    });
    throw err;
  }

  // 5. Marcar campaña como SENT o FAILED y guardar contadores
  const finalStatus = totalSent > 0 ? 'SENT' : 'FAILED';
  await prisma.emailCampaign.update({
    where: { id },
    data: {
      status: finalStatus,
      totalSent,
      sentAt: new Date(),
    },
  });

  return ok({
    campaignId: id,
    status: finalStatus,
    totalSent,
    totalFailed,
    totalRecipients: totalSent + totalFailed,
  });
});
