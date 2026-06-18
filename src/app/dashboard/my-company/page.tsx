"use client";

import React, { useEffect, useState } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";
import { useAuth } from "@/context/auth-context";
import { CustomerForm } from "@/modules/customers/presentation/components/CustomerForm";
import { useCustomer } from "@/modules/customers/presentation/hooks/useCustomers";
import { Building2, Loader2 } from "lucide-react";

export default function MyCompanyPage() {
  const { user, refresh } = useAuth();
  const companyId = user?.company?.id || user?.companyId;

  const {
    data: customer,
    isLoading,
    updateCustomer,
  } = useCustomer(companyId || "");

  return (
    <RoleGuard allowedRoles={[UserRole.COMPANY_ADMIN]}>
      <div className="p-8 max-w-[1500px] mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Mi Empresa</h1>
            <p className="text-sm text-zinc-500">
              Visualiza y actualiza la información legal y de facturación de tu compañía.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3 text-sm text-zinc-400">
          <span className="text-base leading-none">🏢</span>
          <div>
            <span className="font-bold text-zinc-200 block mb-0.5">Información de la Organización</span>
            <p>
              Estás visualizando los datos comerciales y de facturación oficiales de tu empresa. Estos datos son compartidos por todos los administradores de tu organización y son independientes de los datos de tu cuenta personal en el <a href="/profile" className="text-primary hover:underline">Perfil de Usuario</a>.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cargando datos de empresa...</p>
          </div>
        ) : customer ? (
          <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6">
            <CustomerForm
              initialData={customer}
              onSubmit={(data) => {
                updateCustomer.mutate(data, {
                  onSuccess: () => {
                    refresh();
                  }
                });
              }}
              isSubmitting={updateCustomer.isPending}
            />
          </div>
        ) : (
          <div className="text-center py-24 text-zinc-500">
            No se pudo cargar la información de tu empresa.
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
