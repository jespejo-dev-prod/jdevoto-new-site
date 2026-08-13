import React, { useState } from "react";
import { Mail, CheckCircle2, Loader2, Users, Building, Plus, X } from "lucide-react";
import { UserForm } from "./UserForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SalesRepTableProps {
  salesReps: any[];
  isLoading: boolean;
  onAssignCompany: (salesRepId: string, companyId: string) => Promise<void>;
  onRemoveCompany: (salesRepId: string, companyId: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function SalesRepTable({ salesReps, isLoading, onAssignCompany, onRemoveCompany, onDelete }: SalesRepTableProps) {
  return (
    <>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto shadow-2xl">
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead className="bg-zinc-950/50 border-b border-zinc-800">
            <tr>
              <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest pl-8">Vendedor</th>
              <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest">Email</th>
              <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest">Estado</th>
              <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest">Clientes Asignados</th>
              <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest pr-8">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-zinc-700 animate-spin mx-auto mb-2" />
                  <p className="text-base text-zinc-500 font-medium uppercase tracking-widest">Cargando vendedores...</p>
                </td>
              </tr>
            ) : salesReps.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <p className="text-base text-zinc-650 font-medium uppercase tracking-widest">No hay vendedores registrados</p>
                </td>
              </tr>
            ) : (
              salesReps.map((rep) => {
                const assignedCount = rep.assignedCount ?? rep.assignedCompanies?.length ?? 0;
                return (
                  <React.Fragment key={rep.id}>
                    <tr className="hover:bg-zinc-900/20 transition-colors group text-base">
                      <td className="p-4 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 border border-zinc-700">
                            {rep.firstName?.[0] || ""}{rep.lastName?.[0] || ""}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white">{rep.firstName} {rep.lastName}</p>
                            <p className="text-base text-sky-400/90 font-medium mt-0.5">Vendedor</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm font-bold text-zinc-300">
                          <Mail className="w-4 h-4 text-primary" />
                          <span>{rep.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Activo</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-zinc-500" />
                          <span className="text-base font-bold text-zinc-300">{assignedCount}</span>
                          <span className="text-sm text-zinc-500 uppercase tracking-widest">clientes</span>
                        </div>
                      </td>
                      <td className="p-4 pr-8 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/vendedores/${rep.id}/cartera`}>
                            <Button
                              variant="ghost"
                              className="h-8 text-sm font-bold bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                            >
                              <Users className="w-3 h-3 mr-2" />
                              Ver Cartera
                            </Button>
                          </Link>
                          <Link href={`/dashboard/vendedores/${rep.id}/editar`}>
                            <Button
                              variant="ghost"
                              className="h-8 px-2 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                              title="Editar vendedor"
                            >
                              Editar
                            </Button>
                          </Link>
                          {onDelete && (
                            <Button
                              onClick={() => onDelete(rep.id)}
                              variant="ghost"
                              className="h-8 px-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                              title="Eliminar vendedor"
                            >
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
