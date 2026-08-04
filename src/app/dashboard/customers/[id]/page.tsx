'use client';

import { useCustomer } from '@/modules/customers/presentation/hooks/useCustomers';
import { CustomerForm } from '@/modules/customers/presentation/components/CustomerForm';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, User, Building2, Key, LogOut, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export default function CustomerDetailPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const { fetcher } = useApi();
 const { user } = useAuth();
 const isAdmin = user?.role === 'ADMIN';
 const { 
 data: customer, 
 isLoading, 
 updateCustomer, 
 deleteCustomer,
 reactivateCustomer 
 } = useCustomer(id);

 const handleResetPassword = async (userId: string, email: string) => {
 if (!confirm(`¿Enviar instrucciones de restablecimiento a ${email}?`)) return;
 try {
 await fetcher(`/api/users/${userId}/reset-password`, { method: 'POST' });
 toast.success("Instrucciones enviadas correctamente.");
 } catch (err: any) {
 toast.error(err.message ||"Error al solicitar reset");
 }
 };

 const handleForceLogout = async (userId: string, name: string) => {
 if (!confirm(`¿Cerrar todas las sesiones activas de ${name}?`)) return;
 try {
 await fetcher(`/api/users/${userId}/sessions`, { method: 'DELETE' });
 toast.info("Sesiones cerradas con éxito.");
 } catch (err: any) {
 toast.error(err.message ||"Error al cerrar sesiones");
 }
 };

 const handleUnlinkUser = async (userId: string, name: string) => {
 if (!confirm(`¿Estás seguro de que quieres desvincular al usuario ${name} de esta empresa?`)) return;
 try {
 await fetcher(`/api/users/${userId}`, { 
   method: 'PATCH', 
   body: JSON.stringify({ companyId: null }) 
 });
 toast.success("Usuario desvinculado con éxito.");
 // Recargar la página para que desaparezca de la lista
 window.location.reload();
 } catch (err: any) {
 toast.error(err.message ||"Error al desvincular usuario");
 }
 };

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
 {isAdmin && customer.users && customer.users.length > 0 && (
 <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8 space-y-6 mt-12">
 <h3 className="text-xl font-bold text-white flex items-center gap-3">
 <User className="h-5 w-5 text-primary" />
 Usuarios vinculados ({customer.users.length})
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {customer.users.map((u) => (
 <div key={u.id} className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col gap-4 shadow-xl hover:border-zinc-700 transition-all">
 <div className="flex items-center gap-4">
 <div className="h-14 w-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-base font-bold text-primary border border-zinc-800 shrink-0">
 {u.firstName?.[0]}{u.lastName?.[0]}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-lg font-bold text-white truncate">{u.firstName} {u.lastName}</p>
 <p className="text-sm text-zinc-400 truncate mt-0.5">{u.email}</p>
 <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
 {u.role}
 </span>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-zinc-900">
 <button 
 onClick={() => handleResetPassword(u.id, u.email)}
 className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-zinc-800"
 >
 <Key className="h-3 w-3" />
 Reset Pass
 </button>
 <button 
 onClick={() => handleForceLogout(u.id, u.firstName)}
 className="flex items-center justify-center gap-2 py-2.5 px-3 bg-red-500/5 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-red-500/10"
 >
 <LogOut className="h-3 w-3" />
 Cerrar
 </button>
 {(u.role === 'ADMIN' || u.role === 'SALES_REP') ? (
   <button 
     onClick={() => handleUnlinkUser(u.id, u.firstName)}
     className="flex items-center justify-center gap-2 py-2.5 px-3 bg-orange-500/5 hover:bg-orange-500/10 text-orange-500/60 hover:text-orange-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-orange-500/10"
   >
     <Unlink className="h-3 w-3" />
     Desvincular
   </button>
 ) : (
   <div />
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
