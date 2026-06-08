'use client';

import { OrderCreateForm } from '@/modules/orders/presentation/components/OrderCreateForm';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewOrderPage() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/dashboard/orders"
          className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group w-fit"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Pedidos
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
             <ShoppingBagIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Nueva Orden de Venta
            </h1>
            <p className="text-zinc-500 mt-1 font-medium">
              Configura un nuevo pedido B2B seleccionando cliente y productos.
            </p>
          </div>
        </div>
      </div>

      <OrderCreateForm />
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
