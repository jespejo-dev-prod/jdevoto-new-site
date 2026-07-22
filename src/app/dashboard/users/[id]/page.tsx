'use client';

import { useUser } from '@/modules/users/presentation/hooks/useUsers';
import { UserForm } from '@/modules/users/presentation/components/UserForm';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, User, Key, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/shared/infrastructure/api/use-api';
import Link from 'next/link';

export default function UserDetailPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const { fetcher } = useApi();
 const { 
 data: user, 
 isLoading, 
 updateUser, 
 deleteUser 
 } = useUser(id);

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

 if (isLoading) {
 return (
 <div className="flex flex-col items-center justify-center py-24 gap-4">
 <Loader2 className="h-10 w-10 text-primary animate-spin" />
 <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando perfil del usuario...</p>
 </div>
 );
 }

 if (!user) {
 return (
 <div className="p-8 text-center text-zinc-500">
 Usuario no encontrado.
 </div>
 );
 }

 return (
 <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
 {/* Header / Breadcrumbs */}
 <div className="flex flex-col gap-4">
 <Link 
 href="/dashboard/users"
 className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest group"
 >
 <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
 Volver al listado
 </Link>
 
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="h-16 w-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-bold text-primary shadow-2xl">
 {user.firstName?.[0]}{user.lastName?.[0]}
 </div>
 <div>
 <h1 className="text-3xl font-bold text-white tracking-tight">
 {user.firstName} {user.lastName}
 </h1>
 <div className="flex items-center gap-4 mt-1">
 <span className="text-zinc-500 font-mono text-base">{user.email}</span>
 <div className="h-1 w-1 rounded-full bg-zinc-800" />
 <span className="text-xs text-primary font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
 {user.role}
 </span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button 
 onClick={() => handleResetPassword(user.id, user.email)}
 className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-350 hover:text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-all border border-zinc-800"
 >
 <Key className="h-4 w-4 text-yellow-500/80" />
 Reset Pass
 </button>
 <button 
 onClick={() => handleForceLogout(user.id, user.firstName)}
 className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-400 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border border-red-500/10"
 >
 <LogOut className="h-4 w-4" />
 Cerrar Sesión
 </button>
 </div>
 </div>
 </div>

 <UserForm 
 initialData={user}
 onSubmit={(data) => updateUser.mutateAsync(data)}
 isSubmitting={updateUser.isPending}
 onSuccess={() => {
 router.push('/dashboard/users');
 }}
 />
 </div>
 );
}
