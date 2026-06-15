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

import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from "mercadopago";
import { prisma } from "@/lib/client";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export class PaymentService {
  /**
   * Helper para manejar los errores arrojados por el SDK de Mercado Pago
   * y convertirlos en excepciones estándar con mensajes descriptivos.
   */
  private handleMpError(error: any, context: string): never {
    console.error(`[MercadoPago Error in ${context}]`, error);
    
    let errMsg = "Error en la pasarela de pagos Mercado Pago";
    if (error && typeof error === 'object') {
      const code = error.code || error.message;
      const details = error.message;
      const status = error.status;

      if (code === 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES' || status === 403) {
        errMsg = `Error de autenticación/política en Mercado Pago: La API retornó 403 (${code}). Asegúrate de usar credenciales válidas. Si usas credenciales de producción (APP_USR-), debes completar la homologación de la cuenta en el panel de Mercado Pago. Si estás probando, usa credenciales de Sandbox (TEST-).`;
      } else if (details) {
        errMsg = `Mercado Pago API Error: ${details} (${code || 'Unknown Code'})`;
      } else {
        errMsg = `Mercado Pago Error: ${JSON.stringify(error)}`;
      }
    } else if (error) {
      errMsg = String(error);
    }
    
    throw new Error(errMsg);
  }

  /**
   * Crear preferencia de pago para un pedido B2B.
   * Si Mercado Pago no está configurado o está deshabilitado en panel, retorna el enlace al simulador local.
   *
   * @param orderId - ID del pedido en la DB
   * @returns { preferenceId: string, initPoint: string }
   */
  async createPreference(orderId: string, context: 'checkout' | 'invoice' = 'checkout'): Promise<{ preferenceId: string; initPoint: string }> {
    const config = await prisma.storeSettings.findUnique({
      where: { key: 'mercadopago_config' }
    });
    const mpConfig = config?.value as any;

    // Si no está habilitado o no tiene Access Token, fallback al simulador local
    if (!mpConfig || !mpConfig.enabled || !mpConfig.accessToken) {
      const simulationParams = context === 'invoice' ? '&payInvoice=true' : '';
      return {
        preferenceId: "SIMULATION",
        initPoint: `/checkout/mercadopago-simulation?orderId=${orderId}${simulationParams}`
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { company: true }
    });

    if (!order) {
      throw new Error(`Pedido con ID ${orderId} no encontrado`);
    }

    const client = new MercadoPagoConfig({ accessToken: mpConfig.accessToken });
    const preference = new Preference(client);

    let baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Para entornos locales de prueba, forzar el uso del túnel HTTPS (MP_WEBHOOK_URL) para evitar que Mercado Pago
    // descarte los back_urls basados en http://localhost
    if ((baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) && process.env.MP_WEBHOOK_URL) {
      baseUrl = process.env.MP_WEBHOOK_URL;
    }
    const webhookUrl = process.env.MP_WEBHOOK_URL || baseUrl;

    const redirectPath = context === 'invoice' ? '/dashboard/cuenta-corriente' : '/dashboard/orders';

    try {
      const response = await preference.create({
        body: {
          items: [
            {
              id: order.orderNumber,
              title: `Pago Pedido ${order.orderNumber}`,
              quantity: 1,
              unit_price: Math.round(Number(order.totalGross)),
              currency_id: 'CLP'
            }
          ],
          external_reference: order.id,
          back_urls: {
            success: `${baseUrl}${redirectPath}?payStatus=success&orderId=${order.id}`,
            failure: `${baseUrl}${redirectPath}?payStatus=failure`,
            pending: `${baseUrl}${redirectPath}?payStatus=pending`
          },
          auto_return: 'approved',
          notification_url: `${webhookUrl}/api/webhooks/mercadopago`
        }
      });

      return {
        preferenceId: response.id || '',
        initPoint: response.init_point || response.sandbox_init_point || ''
      };
    } catch (error) {
      this.handleMpError(error, "createPreference");
    }
  }

  /**
   * Consultar el estado de un pago en Mercado Pago.
   *
   * @param paymentId - ID del pago retornado por MP
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    const config = await prisma.storeSettings.findUnique({
      where: { key: 'mercadopago_config' }
    });
    const mpConfig = config?.value as any;

    if (!mpConfig || !mpConfig.accessToken) {
      throw new Error("Mercado Pago no está configurado.");
    }

    const client = new MercadoPagoConfig({ accessToken: mpConfig.accessToken });
    const payment = new Payment(client);
    try {
      return await payment.get({ id: paymentId });
    } catch (error) {
      this.handleMpError(error, "getPaymentStatus");
    }
  }

  /**
   * Procesar webhook de Mercado Pago.
   *
   * @param payload - Body de la notificación
   */
  async processWebhook(payload: any): Promise<boolean> {
    // Mercado Pago envía notificaciones con la estructura { action: "payment.created", data: { id: "123" } }
    // o de IPN tradicional { type: "payment", data: { id: "123" } }
    const type = payload.type || payload.topic;
    const paymentId = payload.data?.id || payload.id;

    if (type !== "payment" || !paymentId) {
      return false;
    }

    try {
      const paymentData = await this.getPaymentStatus(String(paymentId));
      const status = paymentData.status;
      const orderId = paymentData.external_reference;

      if (status === "approved" && orderId) {
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: orderId }
          });

          if (!order) {
            throw new Error(`Pedido ${orderId} no encontrado en webhook.`);
          }

          if (order.paymentStatus === PaymentStatus.PAID) {
            return;
          }

          // Marcar el pedido como pagado y confirmado
          await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: PaymentStatus.PAID,
              status: OrderStatus.CONFIRMED
            }
          });

          // Si el método de pago original era crédito B2B, liberar cupo decrementando el crédito utilizado
          if (order.paymentMethod === 'credit_b2b') {
            await tx.company.update({
              where: { id: order.companyId },
              data: {
                creditUsed: {
                  decrement: Number(order.totalGross)
                }
              }
            });
          }
        });

        // Enviar correo de confirmación de pago
        try {
          const populatedOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      sku: true,
                      name: true,
                      images: { where: { isPrimary: true }, take: 1 }
                    }
                  }
                }
              },
              company: true,
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          });

          if (populatedOrder) {
            const { sendOrderEmail } = await import('@/lib/email');
            let customerEmail = (populatedOrder.billingAddress as any)?.email;
            if (!customerEmail) {
              customerEmail = populatedOrder.createdBy?.email || "ventas@tutiendab2b.cl";
            }
            await sendOrderEmail(populatedOrder, customerEmail);
          }
        } catch (emailErr) {
          console.error("Error al enviar correo tras pago webhook:", emailErr);
        }

        console.log(`[Webhook MercadoPago] Pago ${paymentId} procesado con éxito para Pedido ${orderId}`);
        return true;
      }
    } catch (error) {
      console.error("[Webhook MercadoPago Error]", error);
      throw error;
    }

    return false;
  }

  /**
   * Emitir reembolso total o parcial.
   *
   * @param paymentId - ID del pago en MP
   * @param amount    - Monto a reembolsar (opcional)
   */
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    const config = await prisma.storeSettings.findUnique({
      where: { key: 'mercadopago_config' }
    });
    const mpConfig = config?.value as any;

    if (!mpConfig || !mpConfig.accessToken) {
      throw new Error("Mercado Pago no está configurado.");
    }

    const client = new MercadoPagoConfig({ accessToken: mpConfig.accessToken });
    const refund = new PaymentRefund(client);
    
    try {
      if (amount) {
        return await refund.create({
          payment_id: paymentId,
          body: { amount }
        });
      } else {
        return await refund.total({
          payment_id: paymentId
        });
      }
    } catch (error) {
      this.handleMpError(error, "refundPayment");
    }
  }
}

// Singleton exportado
export const paymentService = new PaymentService();
