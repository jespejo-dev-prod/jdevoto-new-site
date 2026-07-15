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
} from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(100);
 const [searchTerm, setSearchTerm] = useState('');
 const [debouncedSearch, setDebouncedSearch] = useState('');

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
 reactivateCustomer 
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
 <p className="text-sm text-zinc-500 mt-1 font-medium">
 Gestión de empresas, condiciones comerciales y facturación.
 {meta && <span className="ml-2 text-primary/50 text-xs tracking-widest uppercase">Total DB: {meta.total}</span>}
 </p>
 </div>

 <div className="flex items-center gap-3">
 <Link href="/dashboard/customers/new">
 <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity">
 <UserPlus className="w-4 h-4" />
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
 onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
 className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-sm text-white focus:border-primary/50 outline-none transition-all"
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
 />

 {/* Pagination */}
 {meta && (
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
 <div className="flex items-center gap-3">
 <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
 Mostrando página {meta.page} de {meta.totalPages} ({meta.total} clientes)
 </p>
 <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
 <div className="flex items-center gap-1.5">
 <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Por página:</span>
 <select
 value={limit === 99999 ?"all" : limit}
 onChange={(e) => {
 const val = e.target.value;
 setLimit(val ==="all" ? 99999 : Number(val));
 setPage(1);
 }}
 className="bg-zinc-900 border border-zinc-850 rounded-xl text-xs font-bold text-zinc-400 px-3.5 py-1.5 outline-none focus:border-primary/50 cursor-pointer"
 >
 <option value={10}>10</option>
 <option value={100}>100</option>
 <option value="all">Todos</option>
 </select>
 </div>
 </div>

 {meta.totalPages > 1 && (
 <div className="flex gap-2">
 <button 
 disabled={page === 1}
 onClick={() => setPage(p => p - 1)}
 className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 disabled:opacity-50 hover:text-white transition-all"
 >
 Anterior
 </button>
 <button 
 disabled={page === meta.totalPages}
 onClick={() => setPage(p => p + 1)}
 className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 disabled:opacity-50 hover:text-white transition-all"
 >
 Siguiente
 </button>
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>
 );
}
