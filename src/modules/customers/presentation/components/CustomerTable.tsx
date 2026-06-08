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
    <tr className="group hover:bg-zinc-800/20 transition-colors text-xs">
      <td className="px-6 py-4">
        <Link 
          href={`/dashboard/customers/${customer.id}`}
          className="flex items-center gap-3 group/link cursor-pointer"
        >
          <div className="h-10 w-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover/link:text-primary transition-colors">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-white group-hover/link:text-primary transition-colors">
              {customer.razonSocial}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">
              {customer.rut}
            </p>
          </div>
        </Link>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-zinc-400">{customer.giro || '—'}</span>
          <span className="text-[10px] text-zinc-600">{customer.comuna}, {customer.ciudad}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">-{Number(customer.defaultDiscount) + Number(customer.paymentTermDiscount)}%</span>
          </div>
          <span className="text-[9px] text-zinc-500 uppercase tracking-tighter">
            Base: {Number(customer.defaultDiscount)}% + Pago: {Number(customer.paymentTermDiscount)}%
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border",
          customer.isActive 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-red-500/10 text-red-400 border-red-500/20"
        )}>
          {customer.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex justify-end items-center gap-2">
          {!customer.isActive && (
            <button
              type="button"
              onClick={() => onReactivate(customer.id, customer.razonSocial)}
              disabled={isReactivating}
              className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
              title="Reactivar Cliente"
            >
              <RefreshCcw className={cn("h-3.5 w-3.5", isReactivating && "animate-spin")} />
            </button>
          )}
          <Link href={`/dashboard/customers/${customer.id}`}>
            <button
              type="button"
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-primary hover:border-primary/40 transition-all"
              title="Ver detalle / Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </Link>
          <button
            type="button"
            onClick={() => onDelete(customer.id, customer.razonSocial, customer.isActive)}
            disabled={isDeleting}
            className={cn(
              "p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 transition-all disabled:opacity-50",
              customer.isActive ? "hover:text-red-400 hover:border-red-500/40" : "hover:bg-red-500 hover:text-white border-red-500/20"
            )}
            title={customer.isActive ? "Desactivar" : "Eliminar Definitivamente"}
          >
            <Trash2 className="h-3.5 w-3.5" />
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
        <thead>
          <tr className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-950/60">
            <th className="px-6 py-4 pl-8">Cliente / Empresa</th>
            <th className="px-6 py-4">Giro / Ubicación</th>
            <th className="px-6 py-4">Total Dcto.</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-right pr-8">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {customers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic text-xs uppercase tracking-widest">
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
