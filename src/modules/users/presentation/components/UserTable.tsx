import React from "react";
import { Mail, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserTableProps {
  users: any[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function UserTable({ users, isLoading, onDelete }: UserTableProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead className="bg-zinc-950/50 border-b border-zinc-800">
          <tr>
            <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-8">Usuario</th>
            <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</th>
            <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rol</th>
            <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado</th>
            <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pr-8">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-zinc-700 animate-spin mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Cargando equipo...</p>
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-12 text-center">
                <p className="text-xs text-zinc-600 font-medium uppercase tracking-widest">No hay otros miembros en el equipo</p>
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-900/20 transition-colors group">
                <td className="p-4 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 border border-zinc-700">
                      {u.firstName?.[0] || ""}{u.lastName?.[0] || ""}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{u.firstName} {u.lastName}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">Miembro desde {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail className="w-3 h-3" />
                    <span className="text-xs">{u.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border",
                    u.role === "ADMIN" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    u.role === "SALES_REP" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    "bg-zinc-800 text-zinc-500 border-zinc-700"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Activo</span>
                  </div>
                </td>
                <td className="p-4 pr-8">
                  <button 
                    onClick={() => onDelete(u.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
