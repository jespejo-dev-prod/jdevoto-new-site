'use client';

import Link from 'next/link';
import { memo } from 'react';
import { Pencil, Trash2, Building2, ExternalLink, ShieldCheck, RefreshCcw } from 'lucide-react';
import { Company } from '@prisma/client';
import { cn } from '@/lib/utils';
import { useCustomers } from '../hooks/useCustomers';

interface CustomerTableProps {
  customers: Company[];
  onDelete: (id: string, name: string, isActive: boolean) => void;
  onReactivate: (id: string, name: string) => void;
  isDeleting?: boolean;
  isReactivating?: boolean;
}

const CustomerRow = memo(function CustomerRow({
  customer,
  onDelete,
  onReactivate,
  isDeleting,
  isReactivating,
}: {
  customer: Company;
  onDelete: (id: string, name: string, isActive: boolean) => void;
  onReactivate: (id: string, name: string) => void;
  isDeleting?: boolean;
  isReactivating?: boolean;
}) {
  return (
    <tr className="hover:bg-zinc-900/20 transition-colors group text-sm">
      <td className="p-4 pl-8">
        <Link 
          href={`/dashboard/customers/${customer.id}`}
          className="flex items-center gap-3 group/link cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover/link:text-primary transition-colors">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white group-hover/link:text-primary transition-colors">
              {customer.razonSocial}
            </p>
            <p className="text-xs text-sky-400/90 font-medium mt-0.5">
              {customer.rut}
            </p>
          </div>
        </Link>
      </td>

      <td className="p-4">
        <div className="flex flex-col">
          <span className="text-zinc-350 text-sm">{customer.giro || '—'}</span>
          <span className="text-xs text-zinc-500 mt-0.5">{customer.comuna}, {customer.ciudad}</span>
        </div>
      </td>

      <td className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">-{Number(customer.defaultDiscount) + Number(customer.paymentTermDiscount)}%</span>
          </div>
          <span className="text-xs text-zinc-500 mt-0.5">
            Base: {Number(customer.defaultDiscount)}% + Pago: {Number(customer.paymentTermDiscount)}%
          </span>
        </div>
      </td>

      <td className="p-4">
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border whitespace-nowrap",
          customer.isActive 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          {customer.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      <td className="p-4 pr-8 text-right">
        <div className="flex justify-end items-center gap-2">
          {!customer.isActive && (
            <button
              type="button"
              onClick={() => onReactivate(customer.id, customer.razonSocial)}
              disabled={isReactivating}
              className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all opacity-50 group-hover:opacity-100"
              title="Reactivar Cliente"
            >
              <RefreshCcw className={cn("h-4 w-4", isReactivating && "animate-spin")} />
            </button>
          )}
          <Link href={`/dashboard/customers/${customer.id}`}>
            <button
              type="button"
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/40 transition-all opacity-50 group-hover:opacity-100"
              title="Ver detalle / Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </Link>
          <button
            type="button"
            onClick={() => onDelete(customer.id, customer.razonSocial, customer.isActive)}
            disabled={isDeleting}
            className={cn(
              "p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 transition-all disabled:opacity-50 opacity-50 group-hover:opacity-100",
              customer.isActive ? "hover:text-red-400 hover:border-red-500/40" : "hover:bg-red-500 hover:text-white border-red-500/20"
            )}
            title={customer.isActive ? "Desactivar" : "Eliminar Definitivamente"}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export function CustomerTable({ customers, onDelete, onReactivate, isDeleting, isReactivating }: CustomerTableProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead className="bg-zinc-950/50 border-b border-zinc-800">
          <tr>
            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest pl-8">Cliente / Empresa</th>
            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Giro / Ubicación</th>
            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Dcto.</th>
            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Estado</th>
            <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right pr-8">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {customers.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-12 text-center text-zinc-500 italic text-xs uppercase tracking-widest">
                No se encontraron clientes registrados.
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                onDelete={onDelete}
                onReactivate={onReactivate}
                isDeleting={isDeleting}
                isReactivating={isReactivating}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
