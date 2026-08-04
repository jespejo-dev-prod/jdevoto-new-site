"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Search } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";
import { useUsers } from "@/modules/users/presentation/hooks/useUsers";
import { UserTable } from "@/modules/users/presentation/components/UserTable";
import { useAuth } from "@/context/auth-context";

export default function UsersPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when role filter changes
  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  const { users, meta, isLoading, deleteUser, resetPassword } = useUsers({
    page,
    limit,
    search: debouncedSearch,
    role: roleFilter || undefined,
  });

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.COMPANY_ADMIN]}>
      <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Gestión de Equipo</h1>
            <p className="text-base text-zinc-500">
              Administra los accesos y roles de tu empresa.
              {meta && <span className="ml-2 text-primary/50 text-sm tracking-widest uppercase">Total DB: {meta.total}</span>}
            </p>
          </div>
          <Link 
            href="/dashboard/users/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-4 h-4" /> Añadir Miembro
          </Link>
        </div>

        {/* Buscador y Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Buscar por nombre, email o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-base text-white focus:border-primary/50 outline-none transition-all"
            />
          </div>
          
          <div className="w-full sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-base text-zinc-400 focus:border-primary/50 outline-none transition-all cursor-pointer appearance-none"
            >
              <option value="">Todos los Roles</option>
              {user?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
              <option value={UserRole.ADMIN}>Administrador</option>
              <option value={UserRole.COMPANY_ADMIN}>Admin de Empresa</option>
              <option value={UserRole.SALES_REP}>Vendedor</option>
              <option value={UserRole.BUYER}>Comprador</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <UserTable 
            users={users} 
            isLoading={isLoading} 
            onDelete={deleteUser} 
            onResetPassword={resetPassword}
          />

          {/* Pagination */}
          {meta && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">
                  Mostrando página {meta.page} de {meta.totalPages} ({meta.total} usuarios)
                </p>
                <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Por página:</span>
                  <select
                    value={limit === 99999 ? "all" : limit}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLimit(val === "all" ? 99999 : Number(val));
                      setPage(1);
                    }}
                    className="bg-zinc-900 border border-zinc-850 rounded-xl text-sm font-bold text-zinc-400 px-3.5 py-1.5 outline-none focus:border-primary/50 cursor-pointer"
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
