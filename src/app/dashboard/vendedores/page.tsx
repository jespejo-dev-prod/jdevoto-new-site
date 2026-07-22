"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Search, X } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";
import { useSalesReps } from "@/modules/users/presentation/hooks/useSalesReps";
import { SalesRepTable } from "@/modules/users/presentation/components/SalesRepTable";
import Link from "next/link";

export default function VendedoresPage() {
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

  const { 
    salesReps, 
    meta, 
    isLoading, 
    assignCompany, 
    removeCompany,
    create,
    isCreating,
    updateUser,
    isUpdating,
    deleteUser,
    isDeleting
  } = useSalesReps({
    page,
    limit,
    search: debouncedSearch,
  });

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Gestión de Vendedores</h1>
            <p className="text-base text-zinc-500">
              Administra a tu equipo de ventas y su cartera de clientes.
              {meta && <span className="ml-2 text-primary/50 text-sm tracking-widest uppercase">Total: {meta.total}</span>}
            </p>
          </div>
          <Link href="/dashboard/vendedores/nuevo">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity">
              <UserPlus className="w-4 h-4" /> Añadir Vendedor
            </button>
          </Link>
        </div>

        {/* Buscador */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-base text-white focus:border-primary/50 outline-none transition-all"
          />
        </div>

        <div className="space-y-6">
          <SalesRepTable 
            salesReps={salesReps} 
            isLoading={isLoading} 
            onAssignCompany={assignCompany}
            onRemoveCompany={removeCompany}
            onEdit={async (id, data) => await updateUser({ id, data })}
            onDelete={async (id) => {
              if (window.confirm("¿Estás seguro de eliminar a este vendedor?")) {
                await deleteUser(id);
              }
            }}
          />

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">
                  Mostrando página {meta.page} de {meta.totalPages} ({meta.total} vendedores)
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-400 disabled:opacity-50 hover:text-white transition-all"
                >
                  Anterior
                </button>
                <button 
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-400 disabled:opacity-50 hover:text-white transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
