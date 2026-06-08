'use client';

import { useState } from 'react';
import { useCustomers } from '@/modules/customers/presentation/hooks/useCustomers';
import { CustomerTable } from '@/modules/customers/presentation/components/CustomerTable';
import { 
  Users, 
  Search, 
  UserPlus, 
  Loader2, 
  LayoutGrid, 
  List,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    data: customers = [], 
    isLoading, 
    deleteCustomer, 
    reactivateCustomer 
  } = useCustomers(searchTerm);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Clientes B2B
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">
            Gestión de empresas, condiciones comerciales y facturación.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/customers/new">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              <UserPlus className="h-4 w-4" />
              Nuevo Cliente
            </button>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros / Búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por Razón Social, RUT o Nombre de Fantasía..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-sm text-white focus:border-primary/50 outline-none transition-all"
          />
        </div>
        <div className="md:col-span-4 flex gap-2">
          <button className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all text-xs font-bold uppercase">
            <Filter className="h-4 w-4" />
            Filtros
          </button>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-1 flex gap-1">
            <button className="p-2 bg-zinc-800 text-primary rounded-xl shadow-inner">
              <List className="h-4 w-4" />
            </button>
            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Listado */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando cartera de clientes...</p>
        </div>
      ) : (
        <CustomerTable 
          customers={customers} 
          onDelete={(id, name, isActive) => {
            const action = isActive ? "desactivar" : "ELIMINAR DEFINITIVAMENTE";
            const warning = isActive ? "\n\n(Se mantendrá en la base de datos para análisis histórico)" : "\n\nADVERTENCIA: Esta acción intentará borrar el registro físico. Solo funcionará si no hay pedidos asociados.";
            if (confirm(`¿Estás seguro de ${action} al cliente "${name}"?${warning}`)) {
              deleteCustomer.mutate(id);
            }
          }}
          onReactivate={(id, name) => {
             if (confirm(`¿Reactivar al cliente "${name}"?`)) {
               reactivateCustomer.mutate(id);
             }
          }}
          isDeleting={deleteCustomer.isPending}
          isReactivating={reactivateCustomer.isPending}
        />
      )}
    </div>
  );
}
