import { OrderItem } from "@prisma/client";
import Image from "next/image";
import { Package } from "lucide-react";

interface OrderItemsTableProps {
  items: any[];
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  return (
    <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-zinc-950/40 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <th className="px-6 py-4">Artículo / Producto</th>
            <th className="px-6 py-4 text-right">Precio Neto</th>
            <th className="px-6 py-4 text-center">Cantidad</th>
            <th className="px-6 py-4 text-right">Total Neto</th>
            <th className="px-6 py-4 text-right pr-8">IVA (19%)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {items.map((item) => (
            <tr key={item.id} className="text-xs group hover:bg-zinc-800/10 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-lg group-hover:border-primary/30 transition-all">
                    {item.product?.images?.[0]?.url ? (
                      <Image 
                        src={item.product.images[0].url} 
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-zinc-700" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate max-w-[300px] text-sm">{item.productName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">SKU: {item.productSku}</p>
                    {Number(item.discount) > 0 && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-tighter">
                        -{Number(item.discount)}% Dcto.
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right font-medium text-zinc-400">
                {formatCurrency(Number(item.unitNetPrice))}
              </td>
              <td className="px-6 py-4 text-center">
                <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg font-bold text-white">
                  {item.quantity}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-bold text-white">
                {formatCurrency(Number(item.lineNetTotal))}
              </td>
              <td className="px-6 py-4 text-right text-zinc-500 font-medium pr-8">
                {formatCurrency(Number(item.lineTax))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
