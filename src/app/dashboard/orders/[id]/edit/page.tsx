'use client';

import { useParams } from 'next/navigation';
import { useOrder } from '@/modules/orders/presentation/hooks/useOrders';
import { OrderCreateForm } from '@/modules/orders/presentation/components/OrderCreateForm';
import { Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando borrador...</p>
      </div>
    );
  }

  if (!order) {
    return <div className="p-8 text-center text-zinc-500">Borrador no encontrado.</div>;
  }

  return (
    <div className="p-8 max-w-[2000px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4">
        <Link 
          href={`/dashboard/orders/${id}`}
          className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group w-fit"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Volver al expediente
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Editar Borrador #{order.orderNumber.split('-').pop()}
        </h1>
      </div>

      <OrderCreateForm initialData={order} />
    </div>
  );
}
