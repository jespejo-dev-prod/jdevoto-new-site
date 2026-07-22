'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { UserForm } from '@/modules/users/presentation/components/UserForm';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';
import { ArrowLeft, Loader2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditarVendedorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const repId = params.id;

  // Fetch specific rep data
  const { data: rep, isLoading } = useQuery<any>({
    queryKey: ['user', repId],
    queryFn: () => fetcher(`/api/users/${repId}`),
    enabled: !!repId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return fetcher(`/api/users/${repId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-reps"] });
      queryClient.invalidateQueries({ queryKey: ["user", repId] });
      toast.success("Vendedor actualizado correctamente");
      router.push('/dashboard/vendedores');
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar vendedor");
    },
  });

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <Link 
            href="/dashboard/vendedores"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <UserCog className="w-6 h-6 text-primary" />
              Editar Vendedor
            </h1>
            <p className="text-base text-zinc-500 mt-1">
              Modifica la información básica y credenciales del vendedor
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-base font-medium uppercase tracking-widest">Cargando datos...</p>
            </div>
          ) : !rep ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
              <p className="text-base font-medium">Vendedor no encontrado</p>
              <Link href="/dashboard/vendedores" className="text-primary hover:underline mt-2">
                Volver a la lista
              </Link>
            </div>
          ) : (
            <UserForm
              initialData={rep.data || rep}
              fixedRole="SALES_REP"
              onSubmit={async (data) => {
                await updateMutation.mutateAsync(data);
              }}
              isSubmitting={updateMutation.isPending}
              onSuccess={() => {}}
            />
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
