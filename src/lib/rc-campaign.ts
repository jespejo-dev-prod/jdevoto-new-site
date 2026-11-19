/**
 * lib/rc-campaign.ts
 *
 * Lógica y configuración de la Campaña de Autos a Control Remoto (RC).
 * - Meta de compra mínima en autos RC: $200.000 netos
 * - Descuento adicional: 20% sobre los autos RC
 * - Acumulable con cualquier otro descuento que tenga el cliente.
 */

export const RC_CAMPAIGN_MINIMUM = 200000;
export const RC_CAMPAIGN_DISCOUNT_PERCENT = 20;
export const RC_CATEGORY_SLUG = 'regalos-radiocontrolados';
export const RC_CAMPAIGN_URL = '/categorias/regalos?subcategories=regalos-radiocontrolados';

/**
 * Determina si un producto o ítem del carrito califica como Auto a Control Remoto (RC).
 * Todos los autos RC de Ninco tienen SKU que inicia con '93010' y categoría 'regalos-radiocontrolados'.
 */
export function isRcCarProduct(item: {
  sku?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  name?: string | null;
  category?: { slug?: string | null; name?: string | null } | null;
}): boolean {
  if (!item) return false;

  const sku = (item.sku || '').trim().toUpperCase();
  if (sku.startsWith('93010')) return true;

  const catSlug = (item.categorySlug || item.category?.slug || '').trim().toLowerCase();
  if (catSlug === RC_CATEGORY_SLUG || catSlug === 'radiocontrolados') return true;

  const catName = (item.categoryName || item.category?.name || '').toUpperCase();
  if (catName.includes('RADIOCONTROL')) return true;

  const name = (item.name || '').toUpperCase();
  if (name.includes('AUTO RC') || name.includes('RADIOCONTROL')) return true;

  return false;
}

export interface RcCampaignProgress {
  rcItems: any[];
  rcItemCount: number;
  rcBaseNet: number;
  rcNetAfterCompany: number;
  rcPercent: number;
  isRcCampaignMet: boolean;
  rcMissingAmount: number;
  rcDiscountAmount: number;
  formattedRcBaseNet: string;
  formattedRcMissing: string;
  formattedRcDiscount: string;
}

/**
 * Calcula el progreso de la campaña de autos RC en base a los ítems del carrito
 * y el descuento de empresa del cliente.
 */
export function calculateRcCampaignProgress(
  items: any[],
  companyDiscountPercent: number = 0
): RcCampaignProgress {
  const rcItems = (items || []).filter(isRcCarProduct);
  const rcItemCount = rcItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  // Subtotal base neto de los autos RC en el carrito
  const rcBaseNet = rcItems.reduce(
    (acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 0)),
    0
  );

  // Si el cliente tiene descuento corporativo base, los ítems RC (no excluidos) se calculan con él:
  const rcNetAfterCompany = rcItems.reduce((acc, item) => {
    const isExcluded = item.priceSource === 'PROMOTION' || item.priceSource === 'OUTLET' || item.sku === 'TEST-001';
    const discount = isExcluded ? 0 : companyDiscountPercent;
    const itemNet = (Number(item.price || 0) * Number(item.quantity || 0)) * (1 - discount / 100);
    return acc + itemNet;
  }, 0);

  const roundedRcBase = Math.round(rcBaseNet);
  const roundedRcNetAfterCompany = Math.round(rcNetAfterCompany);

  // La meta de $200.000 se evalúa sobre el Subtotal Neto del cliente (con su descuento corporativo)
  const isRcCampaignMet = roundedRcNetAfterCompany >= RC_CAMPAIGN_MINIMUM;
  const rcPercent = Math.min(100, (roundedRcNetAfterCompany / RC_CAMPAIGN_MINIMUM) * 100);
  const rcMissingAmount = Math.max(0, RC_CAMPAIGN_MINIMUM - roundedRcNetAfterCompany);

  // Descuento adicional del 20% sobre los autos RC al cumplir la meta de $200.000 netos
  const rcDiscountAmount = isRcCampaignMet
    ? Math.round(roundedRcNetAfterCompany * (RC_CAMPAIGN_DISCOUNT_PERCENT / 100))
    : 0;

  return {
    rcItems,
    rcItemCount,
    rcBaseNet: roundedRcBase,
    rcNetAfterCompany: roundedRcNetAfterCompany,
    rcPercent,
    isRcCampaignMet,
    rcMissingAmount,
    rcDiscountAmount,
    formattedRcBaseNet: roundedRcNetAfterCompany.toLocaleString('es-CL'),
    formattedRcMissing: rcMissingAmount.toLocaleString('es-CL'),
    formattedRcDiscount: rcDiscountAmount.toLocaleString('es-CL'),
  };
}
