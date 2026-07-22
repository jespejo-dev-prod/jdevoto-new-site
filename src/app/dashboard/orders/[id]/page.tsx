'use client';

import { useState } from 'react';
import { useOrder } from '@/modules/orders/presentation/hooks/useOrders';
import { OrderItemsTable } from '@/modules/orders/presentation/components/OrderItemsTable';
import { OrderStatusBadge, STATUS_CONFIG } from '@/modules/orders/presentation/components/OrderStatusBadge';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { toast } from 'sonner';
import { OrderMessagesPanel } from '@/modules/orders/presentation/components/OrderMessagesPanel';
import { useParams, useRouter } from 'next/navigation';
import { 
 ChevronLeft, 
 Loader2, 
 Building2, 
 Truck, 
 FileText, 
 CreditCard,
 Calendar,
 User,
 History,
 MessageSquare,
 ArrowRight,
 Printer,
 Trash2,
 Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { OrderStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

export default function OrderDetailPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const { data: order, isLoading, updateStatus, deleteOrder } = useOrder(id);
 const { user } = useAuth();
 const isAdmin = user?.role === 'ADMIN' || user?.role === 'SALES_REP';
 const { fetcher } = useApi();
 const [isSendingEmail, setIsSendingEmail] = useState(false);

 const handleSendEmail = async () => {
 setIsSendingEmail(true);
 const toastId = toast.loading("Enviando correo...");
 try {
 await fetcher(`/api/orders/${id}/send-email`, { method: 'POST' });
 toast.success("Correo enviado correctamente", { id: toastId });
 } catch (err: any) {
 toast.error(err.message ||"Error al enviar correo", { id: toastId });
 } finally {
 setIsSendingEmail(false);
 }
 };

 const formatCurrency = (value: number) => {
 return new Intl.NumberFormat('es-CL', {
 style: 'currency',
 currency: 'CLP',
 }).format(value || 0);
 };

 const handleStatusChange = (newStatus: OrderStatus) => {
 if (confirm(`¿Cambiar el estado del pedido a ${newStatus}?`)) {
 updateStatus.mutate({ status: newStatus });
 }
 };

 const handleDelete = async () => {
 if (confirm("¿Estás seguro de eliminar este borrador? Esta acción lo borrará definitivamente de la base de datos.")) {
 deleteOrder.mutate(undefined, {
 onSuccess: () => {
 router.push('/dashboard/orders');
 }
 });
 }
 };

 if (isLoading) {
 return (
 <div className="flex flex-col items-center justify-center py-24 gap-4">
 <Loader2 className="h-10 w-10 text-primary animate-spin" />
 <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando expediente de la orden...</p>
 </div>
 );
 }

 if (!order) {
 return <div className="p-8 text-center text-zinc-500">Pedido no encontrado.</div>;
 }

 return (
 <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
 {/* Header / Breadcrumbs */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex flex-col gap-4">
 <Link 
 href="/dashboard/orders"
 className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group w-fit"
 >
 <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
 Volver al listado
 </Link>
 
 <div className="flex items-center gap-4">
 <div className="h-16 w-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
 <ShoppingBagIcon className="h-8 w-8 text-primary" />
 </div>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-3xl font-bold text-white tracking-tight">
 Pedido #{order.orderNumber.split('-').pop()}
 </h1>
 <OrderStatusBadge status={order.status} className="h-fit mt-1" />
 </div>
 <div className="flex items-center gap-4 mt-1.5">
 <span className="text-zinc-400 font-mono text-sm">REF: {order.orderNumber}</span>
 <div className="h-1 w-1 rounded-full bg-zinc-800" />
 <span className="text-[11px] sm:text-xs text-zinc-300 font-bold uppercase tracking-widest flex items-center gap-1.5">
 <Calendar className="h-3.5 w-3.5 text-primary" />
 {format(new Date(order.createdAt),"dd 'de' MMMM, yyyy", { locale: es })}
 </span>
 </div>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-3 no-print">
 {order.status === OrderStatus.DRAFT && (
 <Link href={`/dashboard/orders/${id}/edit`}>
 <button className="px-6 py-3 bg-zinc-800 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all shadow-xl flex items-center gap-2 cursor-pointer">
 <Pencil className="h-4 w-4 text-primary" />
 Editar Borrador
 </button>
 </Link>
 )}
 <button 
 onClick={() => window.print()}
 className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-2xl transition-all shadow-lg cursor-pointer"
 title="Imprimir Pedido"
 >
 <Printer className="h-5 w-5" />
 </button>
 <button 
 onClick={() => window.print()}
 className="px-6 py-3 bg-primary text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 cursor-pointer"
 >
 Imprimir Picking List
 <ArrowRight className="h-4 w-4" />
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Main Content */}
 <div className="lg:col-span-9 space-y-8">
 
 {/* Info Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
 <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
 <Building2 className="h-4 w-4 text-primary" />
 Cliente / Facturación
 </div>
 <div className="space-y-1.5 mt-1">
 <p className="text-[17px] font-bold text-white">{order.company.razonSocial}</p>
 {order.company.rut && (
   <div className="inline-flex mt-1.5 px-3 py-0.5 rounded-lg bg-primary/15 border border-primary/30 text-sm font-bold text-primary w-fit shadow-sm tracking-wide">
     {order.company.rut}
   </div>
 )}
 {order.company.billingStreet && (
 <p className="text-sm text-zinc-300 mt-2">{order.company.billingStreet} {order.company.billingNumber}</p>
 )}
 {order.company.billingCommune && (
 <p className="text-sm text-zinc-400 font-medium uppercase tracking-wide">{order.company.billingCommune}, {order.company.billingCity}</p>
 )}
 </div>
 </div>

 <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
 <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
 <Truck className="h-4 w-4 text-primary" />
 Dirección de Envío
 </div>
 <div className="space-y-1.5 mt-1">
 <p className="text-[17px] font-bold text-white">Despacho B2B</p>
 {order.shippingAddress ? (
 <>
 <p className="text-sm text-zinc-300">{(order.shippingAddress as any).street} {(order.shippingAddress as any).number}</p>
 <p className="text-sm text-zinc-400 font-medium uppercase tracking-wide">{(order.shippingAddress as any).comuna}, {(order.shippingAddress as any).region}</p>
 { (order.shippingAddress as any).details && (
 <p className="text-[11px] text-primary font-bold italic mt-2">"{(order.shippingAddress as any).details}"</p>
 )}
 </>
 ) : (
 <p className="text-xs sm:text-[13px] text-zinc-500 italic">No especificada</p>
 )}
 </div>
 </div>

 <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
 <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
 <CreditCard className="h-4 w-4 text-primary" />
 Pago / Usuario
 </div>
 <div className="space-y-1.5 mt-1">
 <p className="text-[17px] font-bold text-white">{order.paymentStatus}</p>
 <div className="flex items-center gap-2 mt-2">
 <div className="h-6 w-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-primary">
 {order.createdBy.firstName[0]}
 </div>
 <p className="text-sm text-zinc-300 font-medium">{order.createdBy.firstName} {order.createdBy.lastName}</p>
 </div>
 <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-0.5 truncate">{order.createdBy.email}</p>
 </div>
 </div>
 </div>

 {/* Items Table */}
 <div className="space-y-4">
 <h3 className="text-lg font-bold text-white flex items-center gap-3">
 <FileText className="h-5 w-5 text-primary" />
 Ítems del Pedido ({order.items.length})
 </h3>
 <OrderItemsTable items={order.items} />
 </div>

 {/* Totals Summary */}
 <div className="flex justify-end">
 <div className="w-full md:w-80 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-4 shadow-2xl">
 <div className="flex justify-between items-center text-base text-zinc-300">
 <span>Subtotal Neto</span>
 <span className="font-bold text-white">{formatCurrency(Number(order.subtotalNet))}</span>
 </div>
 <div className="flex justify-between items-center text-base text-zinc-300">
 <span>IVA (19%)</span>
 <span className="font-bold text-white">{formatCurrency(Number(order.taxAmount))}</span>
 </div>
 {Number(order.discountAmount) > 0 && (
 <div className="flex justify-between items-center text-base text-emerald-400 font-medium">
 <span>Descuentos</span>
 <span className="font-black">-{formatCurrency(Number(order.discountAmount))}</span>
 </div>
 )}
 <div className="h-px bg-zinc-800 my-2" />
 <div className="flex justify-between items-center">
 <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Total Bruto</span>
 <span className="text-2xl sm:text-3xl font-black text-primary">{formatCurrency(Number(order.totalGross))}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Sidebar Panel */}
 <div className="lg:col-span-3 space-y-6">
 <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
 <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-4">
 Acciones del Pedido
 </h4>
 
 {isAdmin ? (
 <div className="space-y-3">
 <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest px-1">Cambiar Estado</p>
 <select 
 value={order.status}
 onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
 className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-primary/50 outline-none appearance-none cursor-pointer"
 >
 {/* Estados principales */}
 <option value={OrderStatus.PENDING}>{STATUS_CONFIG[OrderStatus.PENDING]?.label ||"Pendiente"}</option>
 <option value={OrderStatus.CONFIRMED}>{STATUS_CONFIG[OrderStatus.CONFIRMED]?.label ||"Confirmado"}</option>
 <option value={OrderStatus.SHIPPED}>{STATUS_CONFIG[OrderStatus.SHIPPED]?.label ||"Enviado"}</option>
 <option value={OrderStatus.DELIVERED}>{STATUS_CONFIG[OrderStatus.DELIVERED]?.label ||"Entregado"}</option>

 {/* Separador */}
 <option disabled>────────────────────</option>

 {/* Estados secundarios */}
 <option value={OrderStatus.DRAFT}>{STATUS_CONFIG[OrderStatus.DRAFT]?.label ||"Borrador"}</option>
 <option value={OrderStatus.REJECTED}>{STATUS_CONFIG[OrderStatus.REJECTED]?.label ||"Rechazado"}</option>
 <option value={OrderStatus.CANCELLED}>{STATUS_CONFIG[OrderStatus.CANCELLED]?.label ||"Cancelado"}</option>
 </select>
 </div>
 ) : (
 <div className="space-y-3">
 <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest px-1">Estado del Pedido</p>
 <div className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-center">
 <OrderStatusBadge status={order.status} className="text-sm px-4 py-2" />
 </div>
 </div>
 )}

 <div className="space-y-3 pt-4">
 <button 
 onClick={handleSendEmail}
 disabled={isSendingEmail}
 className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isSendingEmail && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
 Enviar por Email
 </button>
 
 {order.status === OrderStatus.DRAFT ? (
 <button 
 onClick={handleDelete}
 className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
 >
 <Trash2 className="h-3.5 w-3.5" />
 Eliminar Borrador
 </button>
 ) : (
 <button 
 onClick={() => handleStatusChange(OrderStatus.CANCELLED)}
 className="w-full py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500/60 hover:text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
 >
 Cancelar Pedido
 </button>
 )}
 </div>
 </div>

 <OrderMessagesPanel orderId={id} isAdmin={isAdmin} />
 </div>
 </div>
 </div>
 );
}

function ShoppingBagIcon(props: any) {
 return (
 <svg
 {...props}
 xmlns="http://www.w3.org/2000/svg"
 width="24"
 height="24"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 >
 <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
 <path d="M3 6h18" />
 <path d="M16 10a4 4 0 0 1-8 0" />
 </svg>
 );
}
