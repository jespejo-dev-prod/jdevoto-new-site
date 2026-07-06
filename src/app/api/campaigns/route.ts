/**
 * GET  /api/campaigns  — Listar campañas con métricas
 * POST /api/campaigns  — Crear nueva campaña (DRAFT)
 *
 * Acceso: ADMIN, SALES_REP
 */

import { withApiHandler, ok, created } from '@/lib/api-handler';
import { extractUserFromRequest, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/client';
import { UserRole } from '@/generated/client';
import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

const CreateCampaignSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  subject: z.string().min(1, 'El asunto es obligatorio'),
  previewText: z.string().optional().nullable(),
  headerImageUrl: z.string().url('URL de imagen inválida').optional().nullable(),
  ctaText: z.string().optional().nullable(),
  ctaUrl: z.string().url('URL del botón inválida').optional().nullable(),
  recipientTarget: z.enum(['ALL', 'BY_COMPANY', 'MANUAL']).default('ALL'),
});

export const GET = withApiHandler(async (req) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        subject: true,
        status: true,
        recipientTarget: true,
        totalSent: true,
        totalDelivered: true,
        totalOpened: true,
        totalClicked: true,
        totalBounced: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.emailCampaign.count(),
  ]);

  const campaignsWithRates = campaigns.map((c) => ({
    ...c,
    openRate: c.totalSent > 0 ? Math.round((c.totalOpened / c.totalSent) * 100) : 0,
    clickRate: c.totalSent > 0 ? Math.round((c.totalClicked / c.totalSent) * 100) : 0,
    bounceRate: c.totalSent > 0 ? Math.round((c.totalBounced / c.totalSent) * 100) : 0,
  }));

  return ok(campaignsWithRates, 200, {
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const POST = withApiHandler(async (req) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN, UserRole.SALES_REP]);

  const body = await req.json();
  const data = CreateCampaignSchema.parse(body);

  if (data.ctaText && !data.ctaUrl) {
    throw new ValidationError('Si defines texto del botón, también debes indicar una URL destino');
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      title: data.title,
      subject: data.subject,
      previewText: data.previewText ?? null,
      headerImageUrl: data.headerImageUrl ?? null,
      ctaText: data.ctaText ?? null,
      ctaUrl: data.ctaUrl ?? null,
      recipientTarget: data.recipientTarget,
      status: 'DRAFT',
    },
  });

  return created(campaign);
});
