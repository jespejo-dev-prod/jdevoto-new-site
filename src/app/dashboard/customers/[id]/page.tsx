'use client';

import { useCustomer } from '@/modules/customers/presentation/hooks/useCustomers';
import { CustomerForm } from '@/modules/customers/presentation/components/CustomerForm';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, User, Building2, Key, LogOut, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { useAuth } from '@/context/auth-context';
import { CustomerUserList } from '@/modules/customers/presentation/components/CustomerUserList';
import Link from 'next/link';

export default function CustomerDetailPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const { fetcher } = useApi();
 const { user } = useAuth();
 const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
 const { 
 data: customer, 
 isLoading, 
 updateCustomer, 
 deleteCustomer,
 reactivateCustomer 
 } = useCustomer(id);



 if (isLoading) {
 return (
 <div className="flex flex-col items-center justify-center py-24 gap-4">
 <Loader2 className="h-10 w-10 text-primary animate-spin" />
 <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando expediente del cliente...</p>
 </div>
 );
 }

 if (!customer) {
 return (
 <div className="p-8 text-center text-zinc-500">
 Cliente no encontrado.
 </div>
 );
 }

 return (
 <div className="p-8 max-w-[1500px] mx-auto space-y-8">
 {/* Header / Breadcrumbs */}
 <div className="flex flex-col gap-4">
 <Link 
 href="/dashboard/customers"
 className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest group"
 >
 <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
 Volver al listado
 </Link>
 
 <div className="flex items-center gap-4">
 <div className="h-16 w-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
 <Building2 className="h-8 w-8 text-primary" />
 </div>
 <div>
 <h1 className="text-3xl font-bold text-white tracking-tight">
 {customer.razonSocial}
 </h1>
 <div className="flex items-center gap-4 mt-1">
 <span className="text-zinc-500 font-mono text-base">{customer.rut}</span>
 <div className="h-1 w-1 rounded-full bg-zinc-800" />
 <span className="text-xs text-primary font-bold uppercase tracking-widest">
 Cliente B2B Verificado
 </span>
 </div>
 </div>
 </div>
 </div>

 <CustomerForm 
 initialData={customer}
 onSubmit={(data) => updateCustomer.mutate(data)}
 isSubmitting={updateCustomer.isPending}
 onDelete={() => {
 const action = customer.isActive ?"desactivar" :"ELIMINAR DEFINITIVAMENTE";
 const warning = customer.isActive ?"\n\n(Se mantendrá en la base de datos para análisis histórico)" :"\n\nADVERTENCIA: Esta acción intentará borrar el registro físico. Solo funcionará si no hay pedidos asociados.";
 if (confirm(`¿Estás seguro de ${action} este cliente?${warning}`)) {
 deleteCustomer.mutate(undefined, {
 onSuccess: () => {
 if (!customer.isActive) router.push('/dashboard/customers');
 }
 });
 }
 }}
 onActivate={() => {
 if (confirm("¿Reactivar este cliente?")) {
 reactivateCustomer.mutate();
 }
 }}
 isActivating={reactivateCustomer.isPending}
 />
 
 {/* Listado de usuarios asociados (Opcional, pero útil para completar la vista) */}
 {isAdmin && customer.users && (
    <CustomerUserList 
      users={customer.users} 
      companyId={customer.id}
      companyName={customer.razonSocial}
      companyRut={customer.rut}
      showAddButton={isAdmin}
    />
  )}
 </div>
 );
}
