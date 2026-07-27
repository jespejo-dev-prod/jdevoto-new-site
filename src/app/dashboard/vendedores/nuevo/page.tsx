"use client";

import React from "react";
import { UserForm } from "@/modules/users/presentation/components/UserForm";
import { useSalesReps } from "@/modules/users/presentation/hooks/useSalesReps";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";

export default function NuevoVendedorPage() {
  const router = useRouter();
  const { create, isCreating } = useSalesReps();

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="pt-8 pb-40 px-4 sm:px-8 w-full max-w-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/vendedores"
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Añadir Vendedor</h1>
            <p className="text-base text-zinc-500">
              Registra un nuevo vendedor en el sistema.
            </p>
          </div>
        </div>

        <div className="w-full">
          <UserForm 
            onSubmit={create} 
            isSubmitting={isCreating} 
            onSuccess={() => router.push("/dashboard/vendedores")} 
            fixedRole="SALES_REP"
          />
        </div>
      </div>
    </RoleGuard>
  );
}
