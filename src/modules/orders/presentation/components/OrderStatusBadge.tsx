import { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  [OrderStatus.DRAFT]: { 
    label: "Borrador", 
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" 
  },
  [OrderStatus.PENDING]: { 
    label: "En espera", 
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20" 
  },
  [OrderStatus.CONFIRMED]: { 
    label: "Confirmado", 
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20" 
  },
  [OrderStatus.PROCESSING]: { 
    label: "Procesando", 
    className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
  },
  [OrderStatus.SHIPPED]: { 
    label: "Enviado", 
    className: "bg-purple-500/10 text-purple-400 border-purple-500/20" 
  },
  [OrderStatus.DELIVERED]: { 
    label: "Entregado", 
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
  },
  [OrderStatus.CANCELLED]: { 
    label: "Cancelado", 
    className: "bg-red-500/10 text-red-400 border-red-500/20" 
  },
  [OrderStatus.REJECTED]: { 
    label: "Rechazado", 
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20" 
  },
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: "" };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
