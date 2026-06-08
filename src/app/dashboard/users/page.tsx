"use client";

import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";
import { useUsers } from "@/modules/users/presentation/hooks/useUsers";
import { UserTable } from "@/modules/users/presentation/components/UserTable";
import { UserForm } from "@/modules/users/presentation/components/UserForm";

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const { users, isLoading, create, isCreating, deleteUser } = useUsers();

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.COMPANY_ADMIN]}>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Gestión de Equipo</h1>
            <p className="text-sm text-zinc-500">Administra los accesos y roles de tu empresa.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            {showForm ? "Cancelar" : <><UserPlus className="w-4 h-4" /> Añadir Miembro</>}
          </button>
        </div>

        {showForm && (
          <UserForm 
            onSubmit={create} 
            isSubmitting={isCreating} 
            onSuccess={() => setShowForm(false)} 
          />
        )}

        <UserTable 
          users={users} 
          isLoading={isLoading} 
          onDelete={deleteUser} 
        />
      </div>
    </RoleGuard>
  );
}

