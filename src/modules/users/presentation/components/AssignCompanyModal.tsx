import React, { useState, useEffect } from "react";
import { Search, Loader2, X, Plus } from "lucide-react";
import { useCustomers } from "@/modules/customers/presentation/hooks/useCustomers";
import { Button } from "@/components/ui/button";

export function AssignCompanyModal({ 
  salesRep, 
  onClose, 
  onAssign 
}: { 
  salesRep: any; 
  onClose: () => void; 
  onAssign: (companyId: string) => Promise<void>; 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useCustomers({ 
    search: debouncedSearch, 
    limit: 5,
    enabled: debouncedSearch.length >= 3
  });
  
  const customers = Array.isArray(data) ? data : (data?.data || []);

  const handleAssign = async (companyId: string) => {
    setIsAssigning(true);
    try {
      await onAssign(companyId);
      onClose();
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Asignar Cliente</h3>
            <p className="text-sm text-zinc-500">
              Buscando para: <span className="text-zinc-300 font-semibold">{salesRep.firstName} {salesRep.lastName}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              autoFocus
              type="text"
              placeholder="Buscar cliente por RUT o Razón Social..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl h-12 pl-10 pr-4 text-sm text-white focus:border-primary/50 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            {debouncedSearch.length < 3 ? (
              <div className="flex items-center justify-center h-20 text-zinc-500 text-sm italic">
                Escribe al menos 3 caracteres para buscar clientes...
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-zinc-700 animate-spin" />
              </div>
            ) : customers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
                No se encontraron clientes.
              </div>
            ) : (
              customers.map((c: any) => {
                const isAlreadyAssigned = salesRep.assignedCompanies?.some((ac: any) => ac.id === c.id);
                const assignedToOther = !isAlreadyAssigned && c.salesRep != null && c.salesRep.id !== salesRep.id;

                return (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white">{c.razonSocial}</p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">RUT: {c.rut}</p>
                    </div>
                    {isAlreadyAssigned ? (
                      <span className="text-xs font-bold text-zinc-600 bg-zinc-900 px-3 py-1 rounded-full uppercase tracking-wider">
                        Ya en cartera
                      </span>
                    ) : assignedToOther ? (
                      <span className="text-[10px] font-bold text-orange-400/80 bg-orange-500/10 px-3 py-1 rounded-full uppercase tracking-wider border border-orange-500/20 text-right">
                        Asignado a<br/>{c.salesRep.firstName} {c.salesRep.lastName}
                      </span>
                    ) : (
                      <Button 
                        onClick={() => handleAssign(c.id)}
                        disabled={isAssigning}
                        className="h-8 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white"
                      >
                        {isAssigning ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Plus className="w-3 h-3 mr-2" />}
                        Asignar
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
