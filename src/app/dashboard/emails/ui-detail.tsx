'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, Eye,
  MousePointerClick, Calendar, Loader2, RefreshCw, BarChart2,
  Trash2, FileText, Ban
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

interface Recipient {
  id: string;
  email: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'COMPLAINED';
  openedAt: string | null;
  clickedAt: string | null;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    company: { razonSocial: string };
  } | null;
}

interface CampaignDetail {
  id: string;
  title: string;
  subject: string;
  previewText: string | null;
  headerImageUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  status: 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
  recipientTarget: 'ALL' | 'BY_COMPANY' | 'MANUAL';
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  sentAt: string | null;
  createdAt: string;
  recipients: Recipient[];
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Borrador', icon: FileText, color: 'text-zinc-400 bg-zinc-800/60' },
  SENDING: { label: 'Enviando...', icon: Loader2, color: 'text-blue-400 bg-blue-900/40' },
  SENT: { label: 'Enviada', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-900/40' },
  FAILED: { label: 'Fallida', icon: AlertCircle, color: 'text-red-400 bg-red-900/40' },
};

const RECIPIENT_STATUS_LABELS: Record<string, string> = {
  QUEUED: 'En cola',
  SENT: 'Enviado',
  DELIVERED: 'Entregado',
  OPENED: 'Abierto',
  CLICKED: 'Clickeado',
  BOUNCED: 'Rebotado',
  COMPLAINED: 'Reportó Spam',
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user: authUser } = useAuth();
  const router = useRouter();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCampaign(json.data);
    } catch {
      toast.error('No se pudo cargar la campaña');
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  async function handleSend() {
    if (!confirm('¿Confirmas el envío inmediato de esta campaña?')) return;
    setSending(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al enviar');

      toast.success('Campaña enviada con éxito');
      fetchCampaign();
    } catch (err: any) {
      toast.error(err.message ?? 'Fallo al enviar la campaña');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando campaña...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Campaña no encontrada.
      </div>
    );
  }

  // Gráfico de embudo
  const chartData = [
    { name: 'Enviados', valor: campaign.totalSent },
    { name: 'Entregados', valor: campaign.totalDelivered },
    { name: 'Abiertos', valor: campaign.totalOpened },
    { name: 'Clics', valor: campaign.totalClicked },
  ];

  const statusConfig = STATUS_CONFIG[campaign.status];
  const StatusIcon = statusConfig.icon;

  const filteredRecipients = campaign.recipients.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const isAdmin = authUser?.role === 'ADMIN';

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/emails')}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              {campaign.title}
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">Asunto: {campaign.subject}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
            <StatusIcon className={`h-3.5 w-3.5 ${campaign.status === 'SENDING' ? 'animate-spin' : ''}`} />
            {statusConfig.label}
          </span>
          <button
            onClick={fetchCampaign}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {campaign.status !== 'DRAFT' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Enviados', value: campaign.totalSent.toLocaleString('es-CL'), color: 'text-zinc-300' },
            { label: 'Entregados', value: campaign.totalDelivered.toLocaleString('es-CL'), color: 'text-blue-400' },
            {
              label: 'Abiertos',
              value: `${campaign.totalOpened.toLocaleString('es-CL')}`,
              rate: `${campaign.openRate}%`,
              color: 'text-emerald-400'
            },
            {
              label: 'Clics',
              value: `${campaign.totalClicked.toLocaleString('es-CL')}`,
              rate: `${campaign.clickRate}%`,
              color: 'text-amber-400'
            },
            {
              label: 'Rebotes',
              value: `${campaign.totalBounced.toLocaleString('es-CL')}`,
              rate: `${campaign.bounceRate}%`,
              color: 'text-red-400'
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs text-zinc-500 font-medium">{stat.label}</span>
              <div className="flex items-baseline justify-between mt-2">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.rate && (
                  <span className="text-xs font-semibold text-zinc-500">{stat.rate}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Preview or Send action */}
        <div className="lg:col-span-2 space-y-6">
          {campaign.status === 'DRAFT' ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 py-16">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-md font-bold text-zinc-200">Campaña lista para enviar</h3>
                <p className="text-xs text-zinc-500 max-w-sm mt-1 mx-auto">
                  Esta campaña está en borrador. Al hacer clic en enviar, se disparará a todos los destinatarios activos de forma inmediata.
                </p>
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !isAdmin}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg mt-2"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="h-4 w-4" /> Enviar campaña ahora</>
                )}
              </button>
              {!isAdmin && (
                <p className="text-[10px] text-red-400 font-medium">Solo los administradores pueden disparar el envío definitivo.</p>
              )}
            </div>
          ) : (
            /* Funnel Chart */
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" /> Embudo de Conversión
              </h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f22" vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300">
                              <p className="font-semibold text-zinc-100">{payload[0].name}</p>
                              <p className="text-primary font-bold mt-1">Valor: {payload[0].value?.toLocaleString('es-CL')}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#52525b' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Details metadata */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200">Ficha Técnica</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Público objetivo</p>
                <p className="font-semibold text-zinc-200">Todos los clientes activos</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Fecha de creación</p>
                <p className="font-semibold text-zinc-200">
                  {format(new Date(campaign.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
              {campaign.sentAt && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Fecha de envío</p>
                  <p className="font-semibold text-zinc-200">
                    {format(new Date(campaign.sentAt), "dd MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
              )}
              {campaign.ctaUrl && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Botón CTA</p>
                  <a
                    href={campaign.ctaUrl}
                    target="_blank"
                    className="text-primary hover:underline text-xs font-semibold"
                  >
                    {campaign.ctaText || 'Ver enlace'} ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Image / preview */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200">Diseño enviado</h3>
            {campaign.headerImageUrl ? (
              <div className="rounded-2xl overflow-hidden border border-zinc-800">
                <img
                  src={campaign.headerImageUrl}
                  alt="Imagen de campaña"
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              <div className="h-40 rounded-2xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600 gap-1 text-center">
                <Ban className="h-6 w-6" />
                <span className="text-xs">Sin imagen principal</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recipient Tracking list */}
      {campaign.status !== 'DRAFT' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-zinc-200">Tracking de destinatarios</h3>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">Todos ({campaign.recipients.length})</option>
              <option value="DELIVERED">Entregado</option>
              <option value="OPENED">Abierto</option>
              <option value="CLICKED">Clickeado</option>
              <option value="BOUNCED">Rebotado</option>
              <option value="COMPLAINED">Reportó Spam</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="text-center px-4 py-3">Apertura</th>
                  <th className="text-center px-4 py-3">Clic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredRecipients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-zinc-600">
                      No hay registros que coincidan con este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredRecipients.map((r) => {
                    const companyName = r.user?.company?.razonSocial;
                    const fullName = r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Usuario';
                    return (
                      <tr key={r.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-zinc-200">{fullName}</p>
                          {companyName && (
                            <p className="text-[10px] text-zinc-500 mt-0.5">{companyName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-400 font-medium">{r.email}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-medium ${
                            r.status === 'OPENED' || r.status === 'CLICKED'
                              ? 'text-emerald-400 bg-emerald-900/20'
                              : r.status === 'BOUNCED' || r.status === 'COMPLAINED'
                              ? 'text-red-400 bg-red-900/20'
                              : 'text-zinc-400 bg-zinc-800/60'
                          }`}>
                            {RECIPIENT_STATUS_LABELS[r.status] || r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-zinc-500">
                          {r.openedAt
                            ? format(new Date(r.openedAt), "dd MMM HH:mm", { locale: es })
                            : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-center text-zinc-500">
                          {r.clickedAt
                            ? format(new Date(r.clickedAt), "dd MMM HH:mm", { locale: es })
                            : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
