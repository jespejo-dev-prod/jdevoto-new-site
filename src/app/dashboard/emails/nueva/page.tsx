'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Mail, ArrowLeft, Upload, Image as ImageIcon, X, Loader2,
  CheckCircle2, Link as LinkIcon, Eye, Send
} from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  title: string;
  subject: string;
  previewText: string;
  headerImageUrl: string;
  ctaText: string;
  ctaUrl: string;
  recipientTarget: 'ALL' | 'BY_COMPANY' | 'MANUAL';
  manualEmailsText: string;
}

const STEPS = [
  { id: 1, label: 'Contenido' },
  { id: 2, label: 'Destinatarios' },
  { id: 3, label: 'Revisar y enviar' },
];

export default function NuevaCampañaPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    title: '',
    subject: '',
    previewText: '',
    headerImageUrl: '',
    ctaText: '',
    ctaUrl: '',
    recipientTarget: 'ALL',
    manualEmailsText: '',
  });

  function updateForm(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/campaigns', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Error al subir imagen');
      }
      const { url } = await res.json();
      updateForm('headerImageUrl', url);
      toast.success('Imagen cargada correctamente');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al subir imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function saveDraft(): Promise<string | null> {
    setSaving(true);
    try {
      const body: Record<string, any> = {
        title: form.title,
        subject: form.subject,
        previewText: form.previewText || null,
        headerImageUrl: form.headerImageUrl || null,
        ctaText: form.ctaText || null,
        ctaUrl: form.ctaUrl || null,
        recipientTarget: form.recipientTarget,
      };

      if (form.recipientTarget === 'MANUAL') {
        body.manualEmails = form.manualEmailsText
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e.includes('@')); // basic validation before sending to API
      }

      if (savedCampaignId) {
        // Ya existe un borrador — actualizar con PATCH
        const res = await fetch(`/api/campaigns/${savedCampaignId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message ?? 'Error al actualizar borrador');
        }
        return savedCampaignId;
      }

      // Primera vez — crear nuevo borrador
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Error al guardar');
      }
      const json = await res.json();
      const id = json.data.id;
      setSavedCampaignId(id);
      return id;
    } catch (err: any) {
      toast.error(err.message ?? 'Error al guardar borrador');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    const id = await saveDraft();
    if (id) {
      toast.success('Borrador guardado');
      router.push('/dashboard/emails');
    }
  }

  async function handleSend() {
    const id = await saveDraft();
    if (!id) return;

    setSending(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al enviar');

      toast.success(`Campaña enviada a ${json.data.totalSent} destinatarios`);
      router.push(`/dashboard/emails/${id}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Error al enviar campaña');
    } finally {
      setSending(false);
    }
  }

  async function handleTestSend() {
    const testEmail = prompt("Ingresa el correo al que quieres enviar la prueba:");
    if (!testEmail) return;

    const id = await saveDraft();
    if (!id) return;

    setSending(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al enviar prueba');

      toast.success(`Prueba enviada correctamente a ${testEmail}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Error al enviar correo de prueba');
    } finally {
      setSending(false);
    }
  }

  const canGoNext = () => {
    if (step === 1) return form.title.trim() && form.subject.trim();
    if (step === 2) return true;
    return true;
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Nueva Campaña de Email
          </h1>
          <p className="text-sm text-zinc-500">Crea y envía una campaña de email a tus clientes</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={`h-px flex-1 transition-colors ${step > i ? 'bg-primary' : 'bg-zinc-800'}`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ${
                  step === s.id ? 'bg-primary text-primary-foreground' :
                  step > s.id ? 'bg-primary/20 text-primary' :
                  'bg-zinc-800 text-zinc-600'
                }`}>
                  {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 transition-colors ${step > s.id ? 'bg-primary' : 'bg-zinc-800'}`} />
                )}
              </div>
              <span className={`text-xs font-medium ${step === s.id ? 'text-zinc-200' : 'text-zinc-600'}`}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">

        {/* STEP 1: Contenido */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                Nombre de la campaña <span className="text-red-400">*</span>
              </label>
              <input
                id="campaign-title"
                type="text"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="Ej: Lanzamiento Sitio Web Julio 2026"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
              <p className="text-xs text-zinc-600 mt-1">Solo visible en el dashboard, no lo ven los clientes</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                Asunto del email <span className="text-red-400">*</span>
              </label>
              <input
                id="campaign-subject"
                type="text"
                value={form.subject}
                onChange={(e) => updateForm('subject', e.target.value)}
                placeholder="Ej: ¡Conoce el nuevo sitio de JDevoto!"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
              <p className="text-xs text-zinc-600 mt-1">Lo que aparece en el inbox de tus clientes</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                Texto de preview
              </label>
              <input
                id="campaign-preview"
                type="text"
                value={form.previewText}
                onChange={(e) => updateForm('previewText', e.target.value)}
                placeholder="Ej: Descubre las novedades y nuevas funciones..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
              <p className="text-xs text-zinc-600 mt-1">Texto breve que aparece bajo el asunto en Gmail/Outlook</p>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                Imagen principal
              </label>
              {form.headerImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-700">
                  <img
                    src={form.headerImageUrl}
                    alt="Preview campaña"
                    className="w-full max-h-64 object-cover"
                  />
                  <button
                    onClick={() => updateForm('headerImageUrl', '')}
                    className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 backdrop-blur rounded-lg text-zinc-300 hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="campaign-image-upload"
                  className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-700 rounded-xl py-10 cursor-pointer hover:border-primary/50 hover:bg-zinc-800/30 transition-colors ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                  ) : (
                    <Upload className="h-8 w-8 text-zinc-600" />
                  )}
                  <div className="text-center">
                    <p className="text-sm text-zinc-400 font-medium">
                      {uploading ? 'Subiendo imagen...' : 'Haz clic para subir imagen'}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">JPG, PNG o WEBP — máx. 10MB</p>
                  </div>
                  <input
                    id="campaign-image-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
              <p className="text-xs text-zinc-600 mt-1.5">
                Recomendado: diseña tu imagen en Canva con toda la info (600×800px) — igual a PC Factory
              </p>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                  <LinkIcon className="h-3 w-3 inline mr-1" />
                  Texto del botón
                </label>
                <input
                  id="campaign-cta-text"
                  type="text"
                  value={form.ctaText}
                  onChange={(e) => updateForm('ctaText', e.target.value)}
                  placeholder="Ej: Ver catálogo"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                  URL del botón
                </label>
                <input
                  id="campaign-cta-url"
                  type="url"
                  value={form.ctaUrl}
                  onChange={(e) => updateForm('ctaUrl', e.target.value)}
                  placeholder="https://jdevoto.cl/..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
            </div>
          </>
        )}

        {/* STEP 2: Destinatarios */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-zinc-200 mb-3">¿A quién enviar?</p>
              {[
                { value: 'ALL', label: 'Todos los clientes activos', desc: 'Envía a todos los compradores con cuenta activa (~500 destinatarios)' },
                { value: 'MANUAL', label: 'Lista manual de correos', desc: 'Ingresa los correos separados por coma (ej: correo1@gmail.com, correo2@hotmail.com)' },
              ].map((opt) => (
                <div key={opt.value}>
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      form.recipientTarget === opt.value
                        ? 'border-primary/60 bg-primary/5'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recipient-target"
                      value={opt.value}
                      checked={form.recipientTarget === opt.value}
                      onChange={() => updateForm('recipientTarget', opt.value as any)}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="w-full">
                      <p className="text-sm font-medium text-zinc-200">{opt.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                  
                  {opt.value === 'MANUAL' && form.recipientTarget === 'MANUAL' && (
                    <div className="mt-3 pl-8 pr-4">
                      <textarea
                        value={form.manualEmailsText}
                        onChange={(e) => updateForm('manualEmailsText', e.target.value)}
                        placeholder="ventas@empresa.cl, gerente@empresa.cl, cliente@gmail.com"
                        className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                      />
                      <p className="text-xs text-zinc-500 mt-1.5">
                        Separa cada correo con una coma (,).
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
              <p className="text-xs text-zinc-400">
                <strong className="text-zinc-300">ℹ️ Nota:</strong> Se excluirán automáticamente los usuarios
                que se hayan desuscrito de emails de campaña. Los emails transaccionales
                (confirmación de pedido, contraseña) no se ven afectados.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Revisar y enviar */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-zinc-200">Resumen de la campaña</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nombre', value: form.title },
                { label: 'Asunto', value: form.subject },
                { label: 'Destinatarios', value: 'Todos los clientes activos' },
                { label: 'Botón CTA', value: form.ctaText || 'Sin botón' },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                  <p className="text-sm text-zinc-200 font-medium truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {form.headerImageUrl && (
              <div>
                <p className="text-xs text-zinc-500 mb-2">Imagen principal</p>
                <img src={form.headerImageUrl} alt="Preview" className="w-full max-h-48 object-cover rounded-xl" />
              </div>
            )}

            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
              <p className="text-xs text-amber-300">
                <strong>⚠️ Acción irreversible:</strong> Una vez enviada, no se puede cancelar la campaña.
                Los emails se enviarán inmediatamente a todos los destinatarios seleccionados.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Atrás
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={saving || !form.title.trim() || !form.subject.trim()}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Guardar borrador
          </button>
          <button
            onClick={handleTestSend}
            disabled={sending || saving || !form.title.trim() || !form.subject.trim()}
            className="px-4 py-2.5 rounded-xl border border-blue-700/50 text-sm text-blue-400 hover:bg-blue-900/20 hover:border-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-4 w-4" />}
            Enviar Prueba
          </button>
        </div>

        <div className="flex gap-2">
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending || saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="h-4 w-4" /> Enviar campaña</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
