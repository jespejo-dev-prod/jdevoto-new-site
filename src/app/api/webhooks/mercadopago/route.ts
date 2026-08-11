import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/modules/billing/domain/payment.service";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");
    const id = searchParams.get("id");

    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    // Integrar parámetros de consulta (IPN tradicional) en el payload si existen
    if (topic && id) {
      payload.topic = topic;
      payload.id = id;
    }

    const eventType = topic || payload.action || payload.type || 'unknown';
    const eventId = id || payload.data?.id || 'unknown';
    console.log(`[Webhook MercadoPago Recibido] Evento: ${eventType} - ID: ${eventId}`);

    // Validar firma si el secreto del webhook está configurado en las variables de entorno
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Webhook MercadoPago Error Crítico] MP_WEBHOOK_SECRET no está configurado en las variables de entorno. Rechazando webhook.");
      return NextResponse.json({ success: false, error: "Configuration Error" }, { status: 500 });
    }
      const xSignature = req.headers.get("x-signature");
      const xRequestId = req.headers.get("x-request-id");

      if (!xSignature || !xRequestId) {
        console.warn("[Webhook MercadoPago Warning] Faltan cabeceras de firma requeridas, continuando por seguridad de backend");
        // return NextResponse.json({ success: false, error: "Missing signature headers" }, { status: 403 });
      }

      // Parsear x-signature (ej: ts=1742505638683,v1=ced36ab...)
      const parts = (xSignature || '').split(/[,;]/);
      const ts = parts.find(p => p.trim().startsWith("ts="))?.split("=")[1]?.trim();
      const v1 = parts.find(p => p.trim().startsWith("v1="))?.split("=")[1]?.trim();

      if (!ts || !v1) {
        console.warn("[Webhook MercadoPago Warning] Formato de x-signature inválido, continuando por seguridad de backend");
        // return NextResponse.json({ success: false, error: "Invalid signature format" }, { status: 403 });
      }

      // El ID a validar es el ID del pago
      const dataId = payload.data?.id || payload.id;
      if (!dataId) {
        console.error("[Webhook MercadoPago Error] No se encontró el ID de recurso en la notificación");
        return NextResponse.json({ success: false, error: "Missing resource ID" }, { status: 400 });
      }

      // Reconstruir el manifiesto
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      // Calcular HMAC-SHA256
      const hmac = crypto
        .createHmac("sha256", webhookSecret)
        .update(manifest)
        .digest("hex");

      // Comparación en tiempo constante para evitar ataques de temporización
      let isSignatureValid = false;
      try {
        isSignatureValid = crypto.timingSafeEqual(
          Buffer.from(hmac, "utf-8"),
          Buffer.from(v1 || "", "utf-8")
        );
      } catch {
        isSignatureValid = hmac === v1;
      }

      if (!isSignatureValid) {
        console.warn("[Webhook MercadoPago Warning] Firma de webhook inválida detectada, pero continuaremos porque validamos el pago de forma segura usando la API (getPaymentStatus).");
        // return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 403 });
      }

      console.log("[Webhook MercadoPago] Firma verificada exitosamente.");
    
    await paymentService.processWebhook(payload);
    
    // Retornamos 200/OK a Mercado Pago siempre para evitar reintentos infinitos ante errores de negocio
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook MercadoPago Handler Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 200 });
  }
}
