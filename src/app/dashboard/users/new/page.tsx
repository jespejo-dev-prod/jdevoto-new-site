"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";
import { useUsers } from "@/modules/users/presentation/hooks/useUsers";
import { UserForm } from "@/modules/users/presentation/components/UserForm";

function NewUserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { create, isCreating } = useUsers();

  const companyId = searchParams.get('companyId');
  const companyName = searchParams.get('companyName');
  const companyRut = searchParams.get('companyRut');

  const fixedCompany = companyId ? {
    id: companyId,
    razonSocial: companyName || '',
    rut: companyRut || ''
  } : undefined;

  return (
    <div className="pt-8 pb-40 px-4 sm:px-8 w-full max-w-none space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push(companyId ? `/dashboard/customers/${companyId}` : '/dashboard/users')}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:text-primary hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Añadir Miembro</h1>
          <p className="text-base text-zinc-500">
            Crea un nuevo usuario y asígnale un rol.
          </p>
        </div>
      </div>

      <UserForm 
        fixedCompany={fixedCompany}
        onSubmit={create} 
        isSubmitting={isCreating} 
        onSuccess={() => router.push(companyId ? `/dashboard/customers/${companyId}` : '/dashboard/users')} 
      />
    </div>
  );
}

export default function NewUserPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.COMPANY_ADMIN]}>
      <Suspense fallback={<div className="p-8 text-white">Cargando...</div>}>
        <NewUserForm />
      </Suspense>
    </RoleGuard>
  );
}
