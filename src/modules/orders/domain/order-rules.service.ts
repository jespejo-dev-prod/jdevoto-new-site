import { prisma } from "@/lib/client";

/**
 * Servicio para obtener reglas de negocio dinámicas.
 * Reemplaza las lógicas "hardcodeadas" y permite administrarlas desde la base de datos (StoreSettings).
 */
export class OrderRulesService {
  /**
   * Obtiene el monto mínimo para envío gratis según la región y comuna.
   */
  async getFreeShippingMinAmount(region: string, comuna: string): Promise<number> {
    // 1. Obtener reglas desde StoreSettings
    const setting = await prisma.storeSettings.findUnique({
      where: { key: "SHIPPING_RULES" }
    });

    const r = region.toUpperCase();
    const c = comuna.toUpperCase();

    // Reglas por defecto si no están en base de datos
    let defaultRules = {
      exceptions: ["JUAN FERNANDEZ", "ISLA DE PASCUA"], // Sin envío gratis
      zones: [
        {
          min: 1000000,
          regions: ["AYSEN", "MAGALLANES"],
          comunas: ["PUNTA ARENAS", "NATALES", "AYSEN", "CISNES", "PUERTO AYSEN", "COIHAIQUE", "COCHRANE", "PORVENIR"]
        },
        {
          min: 500000,
          regions: ["TARAPACA", "ARICA"],
          comunas: ["ARICA", "IQUIQUE", "CALAMA"]
        },
        {
          min: 100000,
          regions: ["METROPOLITANA", "VALPARAISO"],
          comunas: []
        }
      ],
      defaultMin: 250000 // Resto de Chile
    };

    const rules = setting ? (setting.value as any) : defaultRules;

    // Verificar excepciones insulares
    if (rules.exceptions.some((ex: string) => c.includes(ex.toUpperCase()))) {
      throw new Error("El despacho gratuito (Flete Incluido) no está disponible para territorio insular. Debe seleccionar Flete por Pagar.");
    }

    // Buscar zona correspondiente
    for (const zone of rules.zones) {
      const matchRegion = zone.regions.some((reg: string) => r.includes(reg.toUpperCase()));
      const matchComuna = zone.comunas.some((com: string) => c.includes(com.toUpperCase()));
      if (matchRegion || matchComuna) {
        return zone.min;
      }
    }

    return rules.defaultMin;
  }

  /**
   * Obtiene el porcentaje de descuento por método de pago y plazos.
   */
  async getPaymentDiscountPercent(paymentMethod: string, paymentTermsDays: number): Promise<number> {
    const setting = await prisma.storeSettings.findUnique({
      where: { key: "PAYMENT_DISCOUNT_RULES" }
    });

    const defaultRules = {
      onlinePaymentDiscount: 10,
      creditTerms: {
        "0": 10, // CreateOrder tenía 10, updateOrder tenía 0. Usaremos 10 que fomenta pronto pago.
        "30": 7,
        "31": 10,
        "32": 0,
        "60": 4,
        "61": 0,
        "90": 0
      }
    };

    const rules = setting ? (setting.value as any) : defaultRules;

    if (['webpay', 'transfer', 'mercadopago'].includes(paymentMethod)) {
      return rules.onlinePaymentDiscount;
    }

    if (paymentMethod === 'credit_b2b') {
      const discount = rules.creditTerms[paymentTermsDays.toString()];
      return discount !== undefined ? discount : 0;
    }

    return 0;
  }
}

export const orderRulesService = new OrderRulesService();
