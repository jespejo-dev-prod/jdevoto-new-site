"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";
import { useUsers } from "@/modules/users/presentation/hooks/useUsers";
import { UserForm } from "@/modules/users/presentation/components/UserForm";

export default function NewUserPage() {
  const router = useRouter();
  const { create, isCreating } = useUsers();

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.COMPANY_ADMIN]}>
      <div className="pt-8 pb-40 px-4 sm:px-8 w-full max-w-none space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard/users')}
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
          onSubmit={create} 
          isSubmitting={isCreating} 
          onSuccess={() => router.push('/dashboard/users')} 
        />
      </div>
    </RoleGuard>
  );
}
