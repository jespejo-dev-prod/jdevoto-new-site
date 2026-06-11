"use client";

import { OrderSummary } from "@/types/domain";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Eye, Hash, Building2, RotateCcw, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useApi } from "@/shared/infrastructure/api/use-api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface OrderTableProps {
  orders: OrderSummary[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const { addItem, clearCart, items } = useCart();
  const { fetcher } = useApi();
  const router = useRouter();
  const [repeatingId, setRepeatingId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const handleRepeatOrder = async (orderId: string, orderNumber: string) => {
    if (repeatingId) return;

    if (items.length > 0) {
      if (!confirm(`¿Estás seguro de que deseas repetir el pedido ${orderNumber}? Esto vaciará los productos que tienes en tu carrito actualmente.`)) {
        return;
      }
    }

    setRepeatingId(orderId);
    try {
      const response = await fetcher(`/api/orders/${orderId}/repeat`, { method: "POST" });
      
      if (response && Array.isArray(response)) {
        clearCart(); // Vaciar carrito actual
        
        // Agregar los ítems del pedido anterior con precios B2B actuales al carrito
        response.forEach((item: any) => {
          addItem(item.product, item.quantity);
        });

        toast.success(`¡Pedido ${orderNumber} repetido con éxito! Redirigiéndote al carrito...`);
        router.push("/cart");
      }
    } catch (err: any) {
      console.error("Error repeating B2B order from dashboard:", err);
      toast.error(err.message || "Error al intentar repetir el pedido. Inténtalo de nuevo.");
    } finally {
      setRepeatingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-bold text-zinc-400 uppercase tracking-wider bg-zinc-950/60">
            <th className="px-6 py-4 pl-8">Pedido</th>
            <th className="px-6 py-4">Fecha</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4">Total Bruto</th>
            <th className="px-6 py-4 text-right pr-8">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic text-sm uppercase tracking-widest">
                No se encontraron pedidos.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="group hover:bg-zinc-800/20 transition-colors text-sm">
                <td className="px-6 py-4 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-primary shadow-inner">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-primary transition-colors text-[15px]">
                        #{order.orderNumber.split('-').pop()}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-sky-400/90 font-medium mt-0.5">
                        <Building2 className="h-3 w-3 text-sky-400/70" />
                        <span className="truncate max-w-[150px]">{order.companyName}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-zinc-300 capitalize font-medium">
                      {format(new Date(order.createdAt), "dd MMM, yyyy", { locale: es })}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                      {format(new Date(order.createdAt), "HH:mm 'hrs'")}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <OrderStatusBadge status={order.status} />
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-[15px]">
                      {formatCurrency(order.totalGross)}
                    </span>
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                      {order.itemCount} ítems
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-right pr-8">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRepeatOrder(order.id, order.orderNumber)}
                      disabled={repeatingId !== null}
                      className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/40 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      title="Repetir este pedido"
                    >
                      {repeatingId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </button>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <button
                        type="button"
                        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/40 transition-all shadow-sm"
                        title="Ver detalle del pedido"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
