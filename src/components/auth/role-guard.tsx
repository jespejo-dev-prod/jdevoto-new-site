"use client";

import { useAuth } from "@/context/auth-context";
import { ShieldAlert, Loader2 } from "lucide-react";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirect?: boolean;
}

/**
 * Componente para proteger secciones de la UI basadas en el rol del usuario.
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirect = false 
}: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const hasAccess = user && (user.role === 'SUPER_ADMIN' || allowedRoles.includes(user.role));

  useEffect(() => {
    if (!loading && !hasAccess && redirect) {
      router.push("/dashboard");
    }
  }, [loading, hasAccess, redirect, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    if (redirect) return null;

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-zinc-900/20 rounded-3xl border border-zinc-800/50 m-8">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acceso No Autorizado</h2>
        <p className="text-zinc-500 max-w-sm mb-6">
          Tu cuenta no tiene los permisos necesarios para acceder a esta sección de administración.
        </p>
        <button 
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
