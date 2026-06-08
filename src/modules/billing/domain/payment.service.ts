/**
 * services/payment.service.ts
 *
 * ============================================================
 * PLACEHOLDER — INTEGRACIÓN MERCADO PAGO (PENDIENTE)
 * ============================================================
 *
 * Este archivo es el punto de entrada para la integración con
 * la pasarela de pagos Mercado Pago.
 *
 * CUANDO IMPLEMENTAR:
 *  - Al agregar pagos en línea al flujo de pedidos B2B.
 *  - Al necesitar links de pago, QR o débito automático.
 *
 * DEPENDENCIAS A INSTALAR:
 *  npm install mercadopago
 *
 * VARIABLES DE ENTORNO REQUERIDAS (agregar a .env):
 *  MP_ACCESS_TOKEN="APP_USR-xxxxxxxxxxxxxxxxxxxx"
 *  MP_PUBLIC_KEY="APP_USR-xxxxxxxxxxxxxxxxxxxx"
 *  MP_WEBHOOK_SECRET="tu-secreto-de-webhook"
 *
 * DOCUMENTACIÓN OFICIAL:
 *  https://www.mercadopago.cl/developers/es/docs
 *  https://github.com/mercadopago/sdk-nodejs
 *
 * ============================================================
 * ESTRUCTURA PREVISTA
 * ============================================================
 *
 * Métodos que se implementarán en esta clase:
 *
 *  createPreference(order)
 *    → Crea una Preferencia de Pago en MP para un pedido.
 *    → Retorna: init_point (URL de checkout) y preference_id.
 *    → Documentación: https://www.mercadopago.cl/developers/es/reference/preferences/_checkout_preferences/post
 *
 *  createPaymentLink(order)
 *    → Genera un link de pago simple (Payment Link) para cobro B2B.
 *    → Útil para enviar por email o WhatsApp.
 *
 *  getPaymentStatus(paymentId)
 *    → Consulta el estado de un pago (approved, pending, rejected).
 *    → Documentación: https://www.mercadopago.cl/developers/es/reference/payments/_payments_id/get
 *
 *  processWebhook(payload, signature)
 *    → Procesa las notificaciones IPN/Webhook de Mercado Pago.
 *    → Valida la firma HMAC-SHA256 del header x-signature.
 *    → Actualiza el PaymentStatus del pedido en la DB.
 *    → Endpoint a registrar en MP: POST /api/webhooks/mercadopago
 *
 *  refundPayment(paymentId, amount?)
 *    → Realiza un reembolso total o parcial.
 *    → Documentación: https://www.mercadopago.cl/developers/es/reference/chargebacks/_payments_id_refunds/post
 *
 * ============================================================
 * FLUJO DE PAGO B2B PREVISTO
 * ============================================================
 *
 *  1. Cliente confirma pedido → POST /api/orders
 *  2. Backend llama a createPreference(order)
 *  3. Se retorna init_point al cliente (frontend abre el checkout)
 *  4. Mercado Pago notifica el resultado via Webhook
 *  5. processWebhook() valida y actualiza Order.paymentStatus en DB
 *  6. Si es rechazado: se notifica al comprador y se revierte el stock
 *
 * ============================================================
 */

// TODO: Descomentar cuando se instale el SDK de Mercado Pago
// import MercadoPago, { Preference, Payment } from "mercadopago";
// import { prisma } from "@/lib/client";
// import { BusinessRuleError } from "@/lib/errors";

export class PaymentService {
  // TODO: Inicializar el cliente de Mercado Pago con el Access Token
  // private readonly mp: MercadoPago;
  //
  // constructor() {
  //   this.mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! });
  // }

  /**
   * TODO: Crear preferencia de pago para un pedido B2B.
   *
   * @param orderId - ID del pedido en la DB
   * @returns { preferenceId, initPoint, sandboxInitPoint }
   */
  async createPreference(_orderId: string): Promise<never> {
    throw new Error(
      "[PaymentService] createPreference() no implementado. " +
        "Instala el SDK: npm install mercadopago"
    );
  }

  /**
   * TODO: Consultar el estado de un pago en Mercado Pago.
   *
   * @param paymentId - ID del pago retornado por MP
   */
  async getPaymentStatus(_paymentId: string): Promise<never> {
    throw new Error(
      "[PaymentService] getPaymentStatus() no implementado."
    );
  }

  /**
   * TODO: Procesar webhook de Mercado Pago.
   * Registrar este endpoint en el panel de MP:
   *  https://www.mercadopago.cl/developers/panel/notifications/webhooks
   *
   * @param payload  - Body de la notificación
   * @param signature - Header x-signature de Mercado Pago (para validar HMAC)
   */
  async processWebhook(
    _payload: unknown,
    _signature: string
  ): Promise<never> {
    throw new Error(
      "[PaymentService] processWebhook() no implementado."
    );
  }

  /**
   * TODO: Emitir reembolso total o parcial.
   *
   * @param paymentId - ID del pago en MP
   * @param amount    - Monto a reembolsar (opcional, si es undefined = reembolso total)
   */
  async refundPayment(
    _paymentId: string,
    _amount?: number
  ): Promise<never> {
    throw new Error(
      "[PaymentService] refundPayment() no implementado."
    );
  }
}

// Singleton exportado — listo para inyectar cuando se implemente
export const paymentService = new PaymentService();
