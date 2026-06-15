import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/modules/billing/domain/payment.service";

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

    console.log("[Webhook MercadoPago Recibido]", JSON.stringify(payload));
    
    await paymentService.processWebhook(payload);
    
    // Retornamos 200/OK a Mercado Pago siempre para evitar reintentos infinitos ante errores de negocio
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook MercadoPago Handler Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
