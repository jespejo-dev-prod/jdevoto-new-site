'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/shared/infrastructure/api/use-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, Building, X, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AssignCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssignCustomerModal({ isOpen, onClose }: AssignCustomerModalProps) {
  const { fetcher } = useApi();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['customers', 'search-unassigned', debouncedSearch],
    queryFn: () => fetcher(`/api/customers?unassigned=true&search=${encodeURIComponent(debouncedSearch)}&limit=10`),
    enabled: isOpen && debouncedSearch.length >= 2,
  });

  const assignMutation = useMutation({
    mutationFn: (companyId: string) => fetcher(`/api/customers/${companyId}/assign`, { method: 'PATCH' }),
    onSuccess: () => {
      toast.success('Cliente asignado correctamente a tu cartera.');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['sales-rep-operational-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al asignar el cliente.');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Vincular Cliente</h2>
              <p className="text-sm text-zinc-500">Busca empresas sin vendedor asignado</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text"
              placeholder="Buscar por RUT, Razón Social o Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                <p className="text-xs text-zinc-500 font-medium">Buscando empresas...</p>
              </div>
            ) : debouncedSearch.length < 2 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Ingresa al menos 2 caracteres para buscar.</p>
              </div>
            ) : searchResults?.data?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-zinc-500">No se encontraron empresas sin asignar que coincidan con tu búsqueda.</p>
              </div>
            ) : (
              searchResults?.data?.map((company: any) => (
                <div 
                  key={company.id} 
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate">{company.razonSocial}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />{company.rut}</span>
                      {company.email && <span>• {company.email}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => assignMutation.mutate(company.id)}
                    disabled={assignMutation.isPending}
                    className="shrink-0 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold text-xs transition-colors border border-purple-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {assignMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Vincular
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
