import React from 'react';
import { User, Key, LogOut, Unlink, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { translateRole } from '@/lib/role-translations';
import Link from 'next/link';

interface CustomerUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
}

interface CustomerUserListProps {
  users: CustomerUser[];
  onUsersChanged?: () => void;
  companyId?: string;
  companyName?: string;
  companyRut?: string;
  showAddButton?: boolean;
}

export function CustomerUserList({ users, onUsersChanged, companyId, companyName, companyRut, showAddButton }: CustomerUserListProps) {
  const { fetcher } = useApi();

  if (!users) return null;

  const handleResetPassword = async (userId: string, email: string) => {
    if (!window.confirm(`¿Enviar instrucciones de restablecimiento a ${email}?`)) return;
    try {
      await fetcher(`/api/users/${userId}/reset-password`, { method: 'POST' });
      toast.success("Instrucciones enviadas correctamente.");
    } catch (err: any) {
      toast.error(err.message || "Error al solicitar reset");
    }
  };

  const handleForceLogout = async (userId: string, name: string) => {
    if (!window.confirm(`¿Cerrar todas las sesiones activas de ${name}?`)) return;
    try {
      await fetcher(`/api/users/${userId}/sessions`, { method: 'DELETE' });
      toast.info("Sesiones cerradas con éxito.");
    } catch (err: any) {
      toast.error(err.message || "Error al cerrar sesiones");
    }
  };

  const handleUnlinkUser = async (userId: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres desvincular al usuario ${name} de esta empresa?`)) return;
    try {
      await fetcher(`/api/users/${userId}`, { 
        method: 'PATCH', 
        body: JSON.stringify({ companyId: null }) 
      });
      toast.success("Usuario desvinculado con éxito.");
      if (onUsersChanged) {
        onUsersChanged();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al desvincular usuario");
    }
  };

  return (
    <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8 space-y-6 mt-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <User className="h-5 w-5 text-primary" />
          Usuarios vinculados ({users.length})
        </h3>
        
        {showAddButton && companyId && (
          <Link 
            href={`/dashboard/users/new?companyId=${companyId}&companyName=${encodeURIComponent(companyName || '')}&companyRut=${encodeURIComponent(companyRut || '')}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl text-sm font-bold tracking-widest hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            AÑADIR MIEMBRO
          </Link>
        )}
      </div>

      {users.length === 0 ? (
        <div className="text-zinc-500 text-sm py-4">No hay usuarios vinculados a esta empresa.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <div key={u.id} className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col gap-4 shadow-xl hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-base font-bold text-primary border border-zinc-800 shrink-0">
                {u.firstName?.[0]}{u.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-white truncate">{u.firstName} {u.lastName}</p>
                <p className="text-sm text-zinc-400 truncate mt-0.5">{u.email}</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {translateRole(u.role)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-zinc-900">
              <button 
                onClick={() => handleResetPassword(u.id, u.email)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-zinc-800"
              >
                <Key className="h-3 w-3" />
                Reset Pass
              </button>
              <button 
                onClick={() => handleForceLogout(u.id, u.firstName || u.email)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-red-500/5 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-red-500/10"
              >
                <LogOut className="h-3 w-3" />
                Cerrar
              </button>
              <button 
                onClick={() => {
                  if (u.role === 'COMPANY_ADMIN') return;
                  handleUnlinkUser(u.id, u.firstName || u.email);
                }}
                disabled={u.role === 'COMPANY_ADMIN'}
                title={u.role === 'COMPANY_ADMIN' ? "No se puede desvincular al administrador principal de la empresa" : "Desvincular usuario de la empresa"}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  u.role === 'COMPANY_ADMIN' 
                    ? 'bg-zinc-900/50 text-zinc-600 border-zinc-800/50 cursor-not-allowed' 
                    : 'bg-orange-500/5 hover:bg-orange-500/10 text-orange-500/60 hover:text-orange-500 border-orange-500/10'
                }`}
              >
                <Unlink className="h-3 w-3" />
                Desvincular
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
