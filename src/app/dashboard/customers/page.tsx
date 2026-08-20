"use client";

import { useState, useEffect } from 'react';
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
 Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { AssignCustomerModal } from '@/modules/customers/presentation/components/AssignCustomerModal';
import { useAuth } from '@/context/auth-context';

export default function CustomersPage() {
 const { user } = useAuth();
 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(100);
 const [searchTerm, setSearchTerm] = useState('');
 const [debouncedSearch, setDebouncedSearch] = useState('');
 const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

 // Debounce search
 useEffect(() => {
 const timer = setTimeout(() => {
 setDebouncedSearch(searchTerm);
 setPage(1);
 }, 400);
 return () => clearTimeout(timer);
 }, [searchTerm]);

 const { 
 data: customers = [], 
 meta,
 isLoading, 
 deleteCustomer, 
 reactivateCustomer,
 unassignCustomer 
 } = useCustomers({
 page,
 limit,
 search: debouncedSearch
 });

 return (
 <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
 <Users className="h-8 w-8 text-primary" />
 Clientes B2B
 </h1>
 <p className="text-base text-zinc-500 mt-1 font-medium">
 Gestión de empresas, condiciones comerciales y facturación.
 {meta && <span className="ml-2 text-primary/50 text-sm tracking-widest uppercase">Total DB: {meta.total}</span>}
 </p>
 </div>

  <div className="flex items-center gap-3">
    <Link href="/dashboard/customers/new">
      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity">
        <UserPlus className="w-4 h-4" />
        Nuevo Cliente
      </button>
    </Link>
  </div>
 </div>

 {/* Barra de Filtros / Búsqueda */}
 <div className="relative w-full">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
 <input
 type="text"
 placeholder="Buscar por Razón Social, RUT o Nombre de Fantasía..."
 value={searchTerm}
 onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
 className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-base text-white focus:border-primary/50 outline-none transition-all"
 />
 </div>

 {/* Listado */}
 {isLoading ? (
 <div className="flex flex-col items-center justify-center py-24 gap-4">
 <Loader2 className="h-10 w-10 text-primary animate-spin" />
 <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando cartera de clientes...</p>
 </div>
 ) : (
 <div className="space-y-6">
 <CustomerTable 
 customers={customers} 
 onDelete={(id, name, isActive) => {
 const action = isActive ?"desactivar" :"ELIMINAR DEFINITIVAMENTE";
 const warning = isActive ?"\n\n(Se mantendrá en la base de datos para análisis histórico)" :"\n\nADVERTENCIA: Esta acción intentará borrar el registro físico. Solo funcionará si no hay pedidos asociados.";
 if (confirm(`¿Estás seguro de ${action} al cliente"${name}"?${warning}`)) {
 deleteCustomer.mutate(id);
 }
 }}
 onReactivate={(id, name) => {
 if (confirm(`¿Reactivar al cliente"${name}"?`)) {
 reactivateCustomer.mutate(id);
 }
 }}
 isDeleting={deleteCustomer.isPending}
 isReactivating={reactivateCustomer.isPending}
 isUnassigning={unassignCustomer.isPending}
 onUnassign={(id, name) => {
   if (confirm(`¿Estás seguro de desvincular a "${name}" de tu cartera?`)) {
     unassignCustomer.mutate(id);
   }
 }}
 />

 {/* Pagination */}
 {meta && (
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
 <div className="flex items-center gap-3">
 <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">
 Mostrando página {meta.page} de {meta.totalPages} ({meta.total} clientes)
 </p>
 <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
 <div className="flex items-center gap-1.5">
 <span className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Por página:</span>
 <select
 value={limit === 99999 ?"all" : limit}
 onChange={(e) => {
 const val = e.target.value;
 setLimit(val ==="all" ? 99999 : Number(val));
 setPage(1);
 }}
 className="bg-zinc-900 border border-zinc-850 rounded-xl text-sm font-bold text-zinc-400 px-3.5 py-1.5 outline-none focus:border-primary/50 cursor-pointer"
 >
 <option value={10}>10</option>
 <option value={100}>100</option>
 <option value="all">Todos</option>
 </select>
 </div>
 </div>

 {meta.totalPages > 1 && (
 <div className="flex justify-center mt-6">
  <div className="flex gap-2">
    <button
      onClick={() => setPage(p => Math.max(1, p - 1))}
      disabled={page === 1 || isLoading}
      className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 font-medium text-sm transition-colors"
    >
      Anterior
    </button>
    <span className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold text-sm">
      Página {page} de {meta.totalPages}
    </span>
    <button
      onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
      disabled={page === meta.totalPages || isLoading}
      className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50 font-medium text-sm transition-colors"
    >
      Siguiente
    </button>
  </div>
 </div>
 )}
 </div>
 )}
 </div>
 )}
 <AssignCustomerModal 
   isOpen={isAssignModalOpen} 
   onClose={() => setIsAssignModalOpen(false)} 
 />
 </div>
 );
}
