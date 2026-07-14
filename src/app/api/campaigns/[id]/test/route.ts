import { withApiHandler, ok } from '@/lib/api-handler';
import { extractUserFromRequest, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/client';
import { UserRole } from '@/generated/client';
import { NotFoundError, BusinessRuleError } from '@/lib/errors';
import { buildCampaignHtml } from '@/lib/email-campaigns';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import type { RouteContext } from '@/lib/api-handler';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_for_build');
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

export const POST = withApiHandler(async (req, ctx: RouteContext<{ id: string }>) => {
  const user = extractUserFromRequest(req);
  requireRole(user, [UserRole.ADMIN]);

  const { id } = await ctx.params;
  const body = await req.json();
  const testEmail = body.testEmail;

  if (!testEmail) {
    throw new BusinessRuleError('Se requiere un correo de prueba');
  }

  if (!process.env.RESEND_API_KEY) {
    throw new BusinessRuleError('RESEND_API_KEY no está configurado en las variables de entorno');
  }

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError('Campaña', id);

  try {
    const unsubscribeUrl = buildUnsubscribeUrl(testEmail);
    const html = buildCampaignHtml({
      subject: campaign.subject,
      previewText: campaign.previewText ?? undefined,
      headerImageUrl: campaign.headerImageUrl ?? undefined,
      ctaText: campaign.ctaText ?? undefined,
      ctaUrl: campaign.ctaUrl ?? undefined,
      unsubscribeUrl,
      recipientEmail: testEmail,
    });

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [testEmail],
      subject: `[PRUEBA] ${campaign.subject}`,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return ok({ success: true, messageId: result.data?.id });
  } catch (err: any) {
    console.error('[CAMPAIGN_TEST_ERROR]', err);
    throw new BusinessRuleError(`Error enviando correo de prueba: ${err.message}`);
  }
});
