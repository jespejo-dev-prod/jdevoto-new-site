/**
 * GET    /api/campaigns/[id]  — Detalle de campaña + destinatarios
 * PATCH  /api/campaigns/[id]  — Editar campaña en DRAFT
 * DELETE /api/campaigns/[id]  — Eliminar campaña en DRAFT
 */

import { withApiHandler, ok, noContent } from '@/lib/api-handler';
import { extractUserFromRequest, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/client';
import { UserRole } from '@/generated/client';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '@/lib/errors';
import type { RouteContext } from '@/lib/api-handler';

const UpdateCampaignSchema = z.object({
  title: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  previewText: z.string().optional().nullable(),
  headerImageUrl: z.string().url().optional().nullable(),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().url().optional().nullable(),
  recipientTarget: z.enum(['ALL', 'BY_COMPANY', 'MANUAL']).optional(),
}).refine(
  (data) => !(data.ctaText && !data.ctaUrl),
  { message: 'Si defines texto del botón, también debes indicar una URL destino', path: ['ctaUrl'] }
);

export const GET = withApiHandler(async (req, ctx: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { id } = await ctx.params;

  const [campaign, totalRecipients] = await Promise.all([
    prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        recipients: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            email: true,
            status: true,
            openedAt: true,
            clickedAt: true,
            bouncedAt: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                company: { select: { razonSocial: true } },
              },
            },
          },
        },
      },
    }),
    prisma.emailCampaignRecipient.count({ where: { campaignId: id } }),
  ]);

  if (!campaign) throw new NotFoundError('Campaña', id);

  const openRate = campaign.totalSent > 0 ? Math.round((campaign.totalOpened / campaign.totalSent) * 100) : 0;
  const clickRate = campaign.totalSent > 0 ? Math.round((campaign.totalClicked / campaign.totalSent) * 100) : 0;
  const bounceRate = campaign.totalSent > 0 ? Math.round((campaign.totalBounced / campaign.totalSent) * 100) : 0;

  return ok({ ...campaign, openRate, clickRate, bounceRate, totalRecipients, recipientsCapped: totalRecipients > 100 });
});

export const PATCH = withApiHandler(async (req, ctx: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { id } = await ctx.params;

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError('Campaña', id);
  if (campaign.status !== 'DRAFT') {
    throw new ValidationError('Solo se pueden editar campañas en estado DRAFT');
  }

  const body = await req.json();
  const data = UpdateCampaignSchema.parse(body);

  // Validar que el campo ctaUrl no sea eliminado si ya existe ctaText
  const existingCtaText = data.ctaText !== undefined ? data.ctaText : campaign.ctaText;
  const existingCtaUrl = data.ctaUrl !== undefined ? data.ctaUrl : campaign.ctaUrl;
  if (existingCtaText && !existingCtaUrl) {
    throw new ValidationError('Si defines texto del botón, también debes indicar una URL destino');
  }

  const updated = await prisma.emailCampaign.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.previewText !== undefined && { previewText: data.previewText }),
      ...(data.headerImageUrl !== undefined && { headerImageUrl: data.headerImageUrl }),
      ...(data.ctaText !== undefined && { ctaText: data.ctaText }),
      ...(data.ctaUrl !== undefined && { ctaUrl: data.ctaUrl }),
      ...(data.recipientTarget !== undefined && { recipientTarget: data.recipientTarget }),
    },
  });

  return ok(updated);
});

export const DELETE = withApiHandler(async (req, ctx: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { id } = await ctx.params;

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError('Campaña', id);
  if (campaign.status !== 'DRAFT') {
    throw new ValidationError('Solo se pueden eliminar campañas en estado DRAFT');
  }

  await prisma.emailCampaign.delete({ where: { id } });

  return noContent();
});
