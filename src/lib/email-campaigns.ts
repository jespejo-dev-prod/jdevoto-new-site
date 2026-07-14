/**
 * lib/email-campaigns.ts
 *
 * Template HTML responsivo para campañas de email masivo.
 * Compatible con Gmail, Outlook y clientes de email móviles.
 */

import 'server-only';

interface CampaignEmailOptions {
  subject: string;
  previewText?: string;
  headerImageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
  recipientEmail: string;
}

/** Escapa caracteres HTML para prevenir XSS en el template de email. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Valida que una URL no use esquemas peligrosos (javascript:, data:, etc.). Convierte rutas relativas a absolutas. */
function safeUrl(url: string, fallback: string, baseUrl?: string): string {
  try {
    const finalUrl = url.startsWith('/') && baseUrl ? `${baseUrl}${url}` : url;
    const parsed = new URL(finalUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return fallback;
    return finalUrl;
  } catch {
    return fallback;
  }
}

export function buildCampaignHtml(options: CampaignEmailOptions): string {
  const {
    headerImageUrl,
    ctaText,
    ctaUrl,
    unsubscribeUrl,
    previewText,
    subject,
  } = options;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jdevoto.cl';
  const logoUrl = `${siteUrl}/logo-svg.png`;
  const year = new Date().getFullYear();

  // Escapar todos los valores controlados por el usuario
  const safeSubject = esc(subject);
  const safePreviewText = previewText ? esc(previewText) : null;
  const safeCtaText = ctaText ? esc(ctaText) : null;
  const safeCtaUrl = ctaUrl ? safeUrl(ctaUrl, siteUrl, siteUrl) : null;
  const safeHeaderImageUrl = headerImageUrl ? safeUrl(headerImageUrl, '', siteUrl) : null;
  const safeUnsubscribeUrl = safeUrl(unsubscribeUrl, siteUrl, siteUrl);

  return `<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <title>${safeSubject}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .hero-img { width: 100% !important; height: auto !important; }
    }
  </style>
</head>
<body>
  ${safePreviewText ? `<div style="display:none;font-size:1px;color:#fefefe;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${safePreviewText}</div>` : ''}

  <table role="presentation" class="wrapper" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER: Logo -->
          <tr>
            <td align="center" style="background-color: #ffffff; padding: 24px 32px; border: 1px solid #e4e4e7; border-bottom: none;">
              <a href="${siteUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
                <img src="${logoUrl}" alt="JDevoto" width="180" style="display: block; margin: 0 auto; height: auto; max-height: 60px; object-fit: contain; border: 0;" onerror="this.style.display='none'" />
              </a>
            </td>
          </tr>

          <!-- HERO IMAGE -->
          ${safeHeaderImageUrl ? `
          <tr>
            <td align="center" style="padding: 0; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;">
              <a href="${safeCtaUrl ?? siteUrl}" target="_blank" style="display: block;">
                <img src="${safeHeaderImageUrl}" alt="Campaña JDevoto" class="hero-img" width="600" style="display: block; width: 100%; height: auto; max-width: 600px; border: 0;" />
              </a>
            </td>
          </tr>` : ''}

          <!-- CTA BUTTON -->
          ${safeCtaText && safeCtaUrl ? `
          <tr>
            <td align="center" style="padding: 40px 32px 32px; background-color: #ffffff; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #000000; padding: 16px 48px;">
                    <a href="${safeCtaUrl}" target="_blank" style="display: inline-block; font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; font-weight: bold; color: #ffffff; text-decoration: none; letter-spacing: 0.5px;">${safeCtaText}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : `<tr><td style="height: 24px; background-color: #ffffff; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;"></td></tr>`}

          <!-- FOOTER -->
          <tr>
            <td align="center" style="background-color: #f9f9f9; border-top: 1px solid #e4e4e7; padding: 20px 32px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #71717a; line-height: 1.5;">
                © ${year} JDevoto — Distribuidora B2B
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                Estás recibiendo este email porque eres cliente de JDevoto.<br />
                <a href="${safeUnsubscribeUrl}" target="_blank" style="color: #71717a; text-decoration: underline;">Cancelar suscripción</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
