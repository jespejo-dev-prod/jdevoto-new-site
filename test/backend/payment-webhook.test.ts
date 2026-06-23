import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/webhooks/mercadopago/route';
import { NextRequest } from 'next/server';
import { paymentService } from '@/modules/billing/domain/payment.service';
import crypto from 'crypto';

// Mock paymentService
vi.mock('@/modules/billing/domain/payment.service', () => ({
  paymentService: {
    processWebhook: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Webhook de Mercado Pago - Procesamiento de Pagos', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('debe procesar el webhook y retornar 200 sin firma si MP_WEBHOOK_SECRET no está configurado', async () => {
    delete process.env.MP_WEBHOOK_SECRET;

    const payload = {
      action: 'payment.created',
      data: { id: '123456789' },
    };

    const req = new NextRequest('http://localhost/api/webhooks/mercadopago', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(paymentService.processWebhook).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ id: '123456789' }),
    }));
  });

  it('debe rechazar con 403 si MP_WEBHOOK_SECRET está configurado y faltan cabeceras de firma', async () => {
    process.env.MP_WEBHOOK_SECRET = 'secret_key';

    const payload = {
      action: 'payment.created',
      data: { id: '123456789' },
    };

    const req = new NextRequest('http://localhost/api/webhooks/mercadopago', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Missing signature headers');
  });

  it('debe rechazar con 403 si las cabeceras están presentes pero la firma HMAC es inválida', async () => {
    process.env.MP_WEBHOOK_SECRET = 'secret_key';

    const payload = {
      action: 'payment.created',
      data: { id: '123456789' },
    };

    const req = new NextRequest('http://localhost/api/webhooks/mercadopago', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'x-signature': 'ts=1742505638683,v1=wrongsignature',
        'x-request-id': 'req-id-123',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Invalid signature');
  });

  it('debe procesar y retornar 200 si la firma HMAC coincide perfectamente con el manifest', async () => {
    const secret = 'secret_key';
    process.env.MP_WEBHOOK_SECRET = secret;

    const dataId = '123456789';
    const requestId = 'req-id-123';
    const ts = '1742505638683';

    // Generar firma válida recreando el flujo del endpoint:
    // manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    const payload = {
      action: 'payment.created',
      data: { id: dataId },
    };

    const req = new NextRequest('http://localhost/api/webhooks/mercadopago', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'x-signature': `ts=${ts},v1=${hmac}`,
        'x-request-id': requestId,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(paymentService.processWebhook).toHaveBeenCalled();
  });
});
