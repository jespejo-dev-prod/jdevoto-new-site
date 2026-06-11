"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Search } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";
import { useUsers } from "@/modules/users/presentation/hooks/useUsers";
import { UserTable } from "@/modules/users/presentation/components/UserTable";
import { UserForm } from "@/modules/users/presentation/components/UserForm";

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { users, meta, isLoading, create, isCreating, deleteUser } = useUsers({
    page,
    limit,
    search: debouncedSearch,
  });

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.COMPANY_ADMIN]}>
    <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Gestión de Equipo</h1>
          <p className="text-sm text-zinc-500">
            Administra los accesos y roles de tu empresa.
            {meta && <span className="ml-2 text-primary/50 text-xs tracking-widest uppercase">Total DB: {meta.total}</span>}
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
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

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input 
          type="text"
          placeholder="Buscar por nombre, email o empresa..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-sm text-white focus:border-primary/50 outline-none transition-all"
        />
      </div>

      <div className="space-y-6">
        <UserTable 
          users={users} 
          isLoading={isLoading} 
          onDelete={deleteUser} 
        />

        {/* Pagination */}
        {meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-3">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                Mostrando página {meta.page} de {meta.totalPages} ({meta.total} usuarios)
              </p>
              <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Por página:</span>
                <select
                  value={limit === 99999 ? "all" : limit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLimit(val === "all" ? 99999 : Number(val));
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
      </div>
    </RoleGuard>
  );
}

