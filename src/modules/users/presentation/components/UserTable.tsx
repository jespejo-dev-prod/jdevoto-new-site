import { Mail, CheckCircle2, Trash2, Loader2, Pencil, Key, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useFetcher } from "@/lib/fetcher";
import { toast } from "sonner";
import { useState } from "react";

import { translateRole } from "@/lib/role-translations";

interface UserTableProps {
  users: any[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onResetPassword: (id: string) => void;
}

export function UserTable({ users, isLoading, onDelete, onResetPassword }: UserTableProps) {
  const fetcher = useFetcher();
  const [sendingWelcome, setSendingWelcome] = useState<string | null>(null);
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto shadow-2xl">
      <table className="w-full min-w-[1000px] text-left border-collapse">
        <thead className="bg-zinc-950/50 border-b border-zinc-800">
          <tr>
            <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest pl-8">Usuario</th>
            <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest">Email</th>
            <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest">Rol</th>
            <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest">Empresa Asociada</th>
            <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest">Estado</th>
            <th className="p-4 text-sm font-bold text-zinc-400 uppercase tracking-widest pr-8">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-zinc-700 animate-spin mx-auto mb-2" />
                <p className="text-base text-zinc-500 font-medium uppercase tracking-widest">Cargando equipo...</p>
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-12 text-center">
                <p className="text-base text-zinc-650 font-medium uppercase tracking-widest">No hay otros miembros en el equipo</p>
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr 
                key={u.id} 
                onClick={() => router.push(`/dashboard/users/${u.id}`)}
                className="hover:bg-zinc-900/20 transition-colors group text-base cursor-pointer"
              >
                <td className="p-4 pl-8">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 border border-zinc-700">
                      {u.firstName?.[0] || ""}{u.lastName?.[0] || ""}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{u.firstName} {u.lastName}</p>
                      <p className="text-base text-sky-400/90 font-medium mt-0.5">Miembro desde {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-zinc-350">
                    <Mail className="w-3.5 h-3.5 text-zinc-550" />
                    <span className="text-base">{u.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-sm font-bold uppercase tracking-wider border whitespace-nowrap",
                    (u.role === "ADMIN" || u.role === "SUPER_ADMIN") ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    u.role === "SALES_REP" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}>
                    {translateRole(u.role)}
                  </span>
                </td>

                <td className="p-4">
                  {(u.role === 'SALES_REP' || u.role === 'ADMIN') ? (
                    <span className="text-sm text-zinc-500 italic font-medium tracking-wide">Multicliente</span>
                  ) : u.company ? (
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-zinc-300">{u.company.razonSocial}</span>
                      <span className="text-base text-sky-400/90 font-medium mt-0.5">{u.company.rut}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-zinc-600 italic">Sin empresa / Staff</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Activo</span>
                  </div>
                </td>
                <td className="p-4 pr-8" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-1.5">
                    {/* Botón de Reenviar Correo de Bienvenida */}
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`¿Reenviar correo de bienvenida a ${u.email}?\n\nSe enviará un nuevo enlace para que cree su contraseña (válido por 1 hora).`)) return;
                          setSendingWelcome(u.id);
                          try {
                            await fetcher(`/api/users/${u.id}/resend-welcome`, { method: 'POST' });
                            toast.success(`Correo reenviado a ${u.email}`);
                          } catch (err: any) {
                            toast.error(err.message || 'Error al reenviar correo');
                          } finally {
                            setSendingWelcome(null);
                          }
                        }}
                        disabled={sendingWelcome === u.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-sky-400 transition-colors opacity-70 group-hover:opacity-100 text-xs font-bold uppercase tracking-wider text-left disabled:opacity-30"
                      >
                        {sendingWelcome === u.id ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Send className="w-4 h-4 shrink-0" />}
                        {sendingWelcome === u.id ? 'Enviando...' : 'Reenviar Correo'}
                      </button>
                    )}

                    {/* Botón de Reset Password */}
                    {!(currentUser?.role === 'ADMIN' && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Enviar instrucciones de restablecimiento a ${u.email}?`)) {
                            onResetPassword(u.id);
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-yellow-500 transition-colors opacity-70 group-hover:opacity-100 text-xs font-bold uppercase tracking-wider text-left"
                      >
                        <Key className="w-4 h-4 shrink-0" /> Restablecer Pass
                      </button>
                    )}
                    
                    {/* Botón de Editar */}
                    {!(currentUser?.role === 'ADMIN' && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')) && (
                      <Link 
                        href={`/dashboard/users/${u.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors opacity-70 group-hover:opacity-100 text-xs font-bold uppercase tracking-wider text-left"
                      >
                        <Pencil className="w-4 h-4 shrink-0" /> Editar
                      </Link>
                    )}

                    {/* Botón de Eliminar */}
                    {u.email !== 'jespejo@jdevoto.cl' && u.role !== 'SUPER_ADMIN' && !(currentUser?.role === 'ADMIN' && u.role === 'ADMIN') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("¿Estás seguro de que deseas eliminar este miembro del equipo?")) {
                            onDelete(u.id);
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors opacity-70 group-hover:opacity-100 text-xs font-bold uppercase tracking-wider text-left"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" /> Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
