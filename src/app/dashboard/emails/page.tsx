'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
 Mail, Plus, Send, FileText, CheckCircle2, AlertCircle,
 BarChart3, Eye, MousePointerClick, TrendingUp, Clock, Trash2, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Campaign {
 id: string;
 title: string;
 subject: string;
 status: 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
 totalSent: number;
 totalOpened: number;
 totalClicked: number;
 totalBounced: number;
 openRate: number;
 clickRate: number;
 sentAt: string | null;
 createdAt: string;
}

const STATUS_CONFIG = {
 DRAFT: { label: 'Borrador', icon: FileText, color: 'text-zinc-400 bg-zinc-800/60' },
 SENDING: { label: 'Enviando...', icon: Loader2, color: 'text-blue-400 bg-blue-900/40' },
 SENT: { label: 'Enviada', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-900/40' },
 FAILED: { label: 'Fallida', icon: AlertCircle, color: 'text-red-400 bg-red-900/40' },
};

export default function EmailCampaignsPage() {
 const { accessToken } = useAuth();
 const router = useRouter();
 const [campaigns, setCampaigns] = useState<Campaign[]>([]);
 const [loading, setLoading] = useState(true);
 const [deletingId, setDeletingId] = useState<string | null>(null);

 const fetchCampaigns = useCallback(async () => {
 try {
 const res = await fetch('/api/campaigns', {
 headers: { Authorization: `Bearer ${accessToken}` },
 });
 if (!res.ok) throw new Error('Error al cargar campañas');
 const json = await res.json();
 setCampaigns(json.data ?? []);
 } catch {
 toast.error('No se pudieron cargar las campañas');
 } finally {
 setLoading(false);
 }
 }, [accessToken]);

 useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

 async function deleteCampaign(id: string, title: string) {
 if (!confirm(`¿Eliminar la campaña"${title}"? Esta acción no se puede deshacer.`)) return;
 setDeletingId(id);
 try {
 const res = await fetch(`/api/campaigns/${id}`, {
 method: 'DELETE',
 headers: { Authorization: `Bearer ${accessToken}` },
 });
 if (!res.ok) throw new Error('Error al eliminar');
 toast.success('Campaña eliminada');
 setCampaigns((prev) => prev.filter((c) => c.id !== id));
 } catch {
 toast.error('No se pudo eliminar la campaña');
 } finally {
 setDeletingId(null);
 }
 }

 // Totales para el header
 const totalSent = campaigns.reduce((a, c) => a + c.totalSent, 0);
 const totalOpened = campaigns.reduce((a, c) => a + c.totalOpened, 0);
 const totalClicked = campaigns.reduce((a, c) => a + c.totalClicked, 0);
 const sentCampaigns = campaigns.filter((c) => c.status === 'SENT').length;

 return (
 <div className="flex flex-col gap-6 p-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
 <Mail className="h-6 w-6 text-primary" />
 Emails Masivos
 </h1>
 <p className="text-base text-zinc-500 mt-1">
 Crea y envía campañas de email a tus clientes
 </p>
 </div>
 <Link
 href="/dashboard/emails/nueva"
 className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-base font-bold hover:bg-primary/90 transition-colors"
 >
 <Plus className="h-4 w-4" />
 Nueva Campaña
 </Link>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: 'Campañas enviadas', value: sentCampaigns, icon: Send, color: 'text-primary' },
 { label: 'Emails enviados', value: totalSent.toLocaleString('es-CL'), icon: Mail, color: 'text-blue-400' },
 { label: 'Aperturas', value: totalOpened.toLocaleString('es-CL'), icon: Eye, color: 'text-emerald-400' },
 { label: 'Clics', value: totalClicked.toLocaleString('es-CL'), icon: MousePointerClick, color: 'text-amber-400' },
 ].map((stat) => (
 <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
 <div className="flex items-center gap-2 mb-2">
 <stat.icon className={`h-4 w-4 ${stat.color}`} />
 <span className="text-sm font-bold text-zinc-500">{stat.label}</span>
 </div>
 <p className="text-3xl font-bold text-zinc-100">{stat.value}</p>
 </div>
 ))}
 </div>

 {/* Table */}
 <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
 <div className="px-6 py-4 border-b border-zinc-800">
 <h2 className="text-base font-bold text-zinc-200">Historial de campañas</h2>
 </div>

 {loading ? (
 <div className="flex items-center justify-center py-20">
 <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
 </div>
 ) : campaigns.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 gap-3">
 <Mail className="h-10 w-10 text-zinc-700" />
 <p className="text-zinc-500 text-sm">Aún no has creado ninguna campaña</p>
 <Link
 href="/dashboard/emails/nueva"
 className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
 >
 <Plus className="h-3.5 w-3.5" /> Crear primera campaña
 </Link>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-base">
 <thead>
 <tr className="border-b border-zinc-800 text-sm text-zinc-500 uppercase tracking-wide font-bold">
 <th className="text-left px-6 py-3 font-medium">Campaña</th>
 <th className="text-center px-4 py-3 font-medium">Estado</th>
 <th className="text-center px-4 py-3 font-medium">Enviados</th>
 <th className="text-center px-4 py-3 font-medium">
 <span className="flex items-center justify-center gap-1"><Eye className="h-3 w-3" /> Abiertos</span>
 </th>
 <th className="text-center px-4 py-3 font-medium">
 <span className="flex items-center justify-center gap-1"><MousePointerClick className="h-3 w-3" /> Clics</span>
 </th>
 <th className="text-center px-4 py-3 font-medium">
 <span className="flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Fecha</span>
 </th>
 <th className="px-4 py-3" />
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-800/60">
 {campaigns.map((c) => {
 const status = STATUS_CONFIG[c.status];
 const StatusIcon = status.icon;
 return (
 <tr
 key={c.id}
 className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
 onClick={() => router.push(`/dashboard/emails/${c.id}`)}
 >
 <td className="px-6 py-4">
 <p className="font-bold text-lg text-zinc-200 truncate max-w-[220px]">{c.title}</p>
 <p className="text-sm text-zinc-500 truncate max-w-[220px]">{c.subject}</p>
 </td>
 <td className="px-4 py-4 text-center">
 <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${status.color}`}>
 <StatusIcon className={`h-4 w-4 ${c.status === 'SENDING' ? 'animate-spin' : ''}`} />
 {status.label}
 </span>
 </td>
 <td className="px-4 py-4 text-center text-zinc-300 font-medium">
 {c.totalSent.toLocaleString('es-CL')}
 </td>
 <td className="px-4 py-4 text-center">
 <span className="text-emerald-400 font-bold text-lg">{c.totalOpened.toLocaleString('es-CL')}</span>
 {c.totalSent > 0 && (
 <span className="text-sm font-medium text-zinc-500 ml-1">({c.openRate}%)</span>
 )}
 </td>
 <td className="px-4 py-4 text-center">
 <span className="text-amber-400 font-bold text-lg">{c.totalClicked.toLocaleString('es-CL')}</span>
 {c.totalSent > 0 && (
 <span className="text-sm font-medium text-zinc-500 ml-1">({c.clickRate}%)</span>
 )}
 </td>
 <td className="px-4 py-4 text-center text-zinc-500 text-sm font-medium">
 {c.sentAt
 ? format(new Date(c.sentAt),"dd MMM yyyy HH:mm", { locale: es })
 : format(new Date(c.createdAt),"dd MMM yyyy", { locale: es })}
 </td>
 <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
 <button
 onClick={() => deleteCampaign(c.id, c.title)}
 disabled={deletingId === c.id}
 className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
 title="Eliminar campaña"
 >
 {deletingId === c.id ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Trash2 className="h-4 w-4" />
 )}
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
}
