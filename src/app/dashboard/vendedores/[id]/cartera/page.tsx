'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, Building2, Plus, X, Search,
  Loader2, UserCheck, AlertTriangle, Mail
} from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';
import { toast } from 'sonner';
import { AssignCompanyModal } from '@/modules/users/presentation/components/AssignCompanyModal';

export default function CarteraVendedorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const repId = params.id;

  const { data: rep, isLoading } = useQuery<any>({
    queryKey: ['sales-rep-portfolio', repId],
    queryFn: () => fetcher(`/api/sales-reps/${repId}/portfolio`),
    enabled: !!repId,
    staleTime: 30000,
  });

  const removeMutation = useMutation({
    mutationFn: (companyId: string) =>
      fetcher('/api/sales-reps/assign', {
        method: 'POST',
        body: JSON.stringify({ salesRepId: repId, companyId, action: 'remove' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-rep-portfolio', repId] });
      queryClient.invalidateQueries({ queryKey: ['sales-reps'] });
      toast.success('Cliente desvinculado correctamente');
    },
    onError: (err: any) => toast.error(err.message || 'Error al desvincular'),
  });

  const assignMutation = useMutation({
    mutationFn: (companyId: string) =>
      fetcher('/api/sales-reps/assign', {
        method: 'POST',
        body: JSON.stringify({ salesRepId: repId, companyId, action: 'assign' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-rep-portfolio', repId] });
      queryClient.invalidateQueries({ queryKey: ['sales-reps'] });
      toast.success('Cliente asignado correctamente');
      setIsAssignModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message || 'Error al asignar'),
  });

  const filteredCompanies = (rep?.assignedCompanies ?? []).filter((c: any) =>
    c.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
    c.rut.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/vendedores"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            {isLoading ? (
              <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded-lg" />
            ) : (
              <>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Users className="w-7 h-7 text-primary" />
                  Cartera de {rep?.firstName} {rep?.lastName}
                </h1>
                <div className="mt-2.5 flex items-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-300">
                    <Mail className="w-4 h-4 text-primary" />
                    {rep?.email}
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Añadir Cliente
          </button>
        </div>

        {/* Stats bar */}
        {!isLoading && rep && (
          <div className="flex items-center gap-3 p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Clientes Asignados</p>
              <p className="text-2xl font-black text-white">{rep.assignedCompanies?.length ?? 0}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Filtrar por nombre o RUT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-base text-white focus:border-primary/50 outline-none transition-all"
          />
        </div>

        {/* Company grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-zinc-900/40 border border-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-600">
            <Building2 className="w-16 h-16 opacity-20" />
            <p className="text-base font-bold uppercase tracking-widest">
              {search ? `Sin coincidencias para "${search}"` : 'Sin clientes asignados'}
            </p>
            {!search && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="mt-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-colors"
              >
                Asignar primer cliente
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCompanies.map((c: any) => (
              <div
                key={c.id}
                className="group flex items-center justify-between p-5 bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all"
              >
                <div className="flex items-start gap-3 truncate">
                  <div className="p-2 bg-zinc-800 rounded-xl shrink-0">
                    <Building2 className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-base font-bold text-white truncate" title={c.razonSocial}>
                      {c.razonSocial}
                    </p>
                    <div className="mt-1.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-bold text-sm font-mono tracking-wider">
                        {c.rut}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Desvincular a "${c.razonSocial}" de este vendedor?`)) {
                      removeMutation.mutate(c.id);
                    }
                  }}
                  disabled={removeMutation.isPending}
                  className="ml-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-all shrink-0"
                  title="Desvincular cliente"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign modal */}
      {isAssignModalOpen && rep && (
        <AssignCompanyModal
          salesRep={rep}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={async (companyId) => {
            await assignMutation.mutateAsync(companyId);
          }}
        />
      )}
    </RoleGuard>
  );
}
