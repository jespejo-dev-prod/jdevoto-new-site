'use client';

import { useCustomers } from '@/modules/customers/presentation/hooks/useCustomers';
import { CustomerForm } from '@/modules/customers/presentation/components/CustomerForm';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function NewCustomerPage() {
 const router = useRouter();
 const { createCustomer } = useCustomers();

 return (
 <div className="p-8 max-w-[1500px] mx-auto space-y-8">
 {/* Header / Breadcrumbs */}
 <div className="flex flex-col gap-4">
 <Link 
 href="/dashboard/customers"
 className="flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest group"
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
 Registrar Nuevo Cliente
 </h1>
 <p className="text-zinc-500 text-sm mt-1">
 Completa los datos legales y comerciales para habilitar la cuenta B2B.
 </p>
 </div>
 </div>
 </div>

 <CustomerForm 
 onSubmit={(data) => {
 createCustomer.mutate(data, {
 onSuccess: () => router.push('/dashboard/customers')
 });
 }}
 isSubmitting={createCustomer.isPending}
 />
 </div>
 );
}
