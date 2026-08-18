import React, { useState, useEffect } from "react";
import { Loader2, Search, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@prisma/client";
import { useCustomers } from "@/modules/customers/presentation/hooks/useCustomers";

interface UserFormProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  onSuccess: () => void;
  initialData?: any;
  fixedRole?: string;
  fixedCompany?: {
    id: string;
    razonSocial: string;
    rut: string;
  };
}

export function UserForm({ onSubmit, isSubmitting, onSuccess, initialData, fixedRole, fixedCompany }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: fixedRole || "BUYER",
    companyId: ""
  });
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === UserRole.COMPANY_ADMIN;
  
  const [companySearch, setCompanySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(companySearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [companySearch]);

  const { customers, isLoading: isLoadingCustomers } = useCustomers({ 
    limit: 15, 
    search: debouncedSearch,
    enabled: showCompanyDropdown
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || "",
        password: "",
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        role: initialData.role || "BUYER",
        companyId: initialData.companyId || ""
      });
      if (initialData.company) {
        setSelectedCompany(initialData.company);
      }
    } else {
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: fixedRole || "BUYER",
        companyId: fixedCompany ? fixedCompany.id : ""
      });
      if (fixedCompany) {
        setSelectedCompany(fixedCompany);
      }
    }
  }, [initialData, fixedRole, fixedCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      
      const requiresCompany = submitData.role === 'BUYER' || submitData.role === 'COMPANY_ADMIN';
      // Validate company selection for non-company-admin users
      if (!isCompanyAdmin && requiresCompany && !submitData.companyId) {
        toast.error("Debes seleccionar una empresa asociada para este rol.");
        return;
      }
      
      // SALES_REP is the only one that absolutely shouldn't have a company associated in this way (they have assignedCompanies instead)
      if (submitData.role === 'SALES_REP') {
        submitData.companyId = "";
      }

      if (!submitData.password) {
        delete (submitData as any).password;
      } else {
        const pass = submitData.password;
        if (pass.length < 7 || !/[A-Z]/.test(pass) || !/[0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(pass)) {
          toast.error("La contraseña debe tener al menos 7 caracteres, una mayúscula y un número o símbolo.");
          return;
        }
      }
      await onSubmit(submitData);
      if (!initialData) {
        toast.success("Usuario creado correctamente");
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          role: fixedRole || "BUYER",
          companyId: ""
        });
      }
      onSuccess();
    } catch (error: any) {
      // Manejado en el hook o componente superior si falla
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Nombre</label>
          <input 
            required
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Ej: Juan"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Apellido</label>
          <input 
            required
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Ej: Pérez"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Email</label>
          <input 
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="email@empresa.cl"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Password</label>
          <input 
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder={initialData ? "Dejar en blanco para no cambiar" : "Dejar en blanco para enviar email de creación"}
          />
          <div className="mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Requisitos de la contraseña:</p>
            <ul className="text-sm text-zinc-500 space-y-1 list-disc list-inside">
              <li>Mínimo 7 caracteres de longitud.</li>
              <li>Al menos una letra mayúscula.</li>
              <li>Al menos un número o símbolo especial.</li>
            </ul>
          </div>
        </div>
        {!fixedRole && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Rol</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="BUYER">Comprador</option>
              {!isCompanyAdmin && (
                <>
                  <option value="COMPANY_ADMIN">Administrador empresa</option>
                  <option value="SALES_REP">Vendedor</option>
                  <option value="ADMIN">Administrador del sistema</option>
                  {user?.role === 'SUPER_ADMIN' && (
                    <option value="SUPER_ADMIN">Super Administrador</option>
                  )}
                </>
              )}
            </select>
          </div>
        )}
        
        {!isCompanyAdmin && formData.role !== 'SALES_REP' && (
          <div className="space-y-2 md:col-span-2 relative">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center justify-between">
              <span>{formData.role === 'ADMIN' || formData.role === 'SUPER_ADMIN' ? 'Empresa Asociada (Opcional para Admin)' : 'Empresa Asociada'}</span>
              {isLoadingCustomers && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
            </label>
            
            <div className="relative">
              <div 
                className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-base flex justify-between items-center transition-all ${
                  fixedCompany ? 'cursor-default opacity-80' : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 text-white'
                }`}
                onClick={() => {
                  if (!fixedCompany) setShowCompanyDropdown(!showCompanyDropdown);
                }}
                tabIndex={fixedCompany ? -1 : 0}
              >
                <span className={formData.companyId ? "text-white" : "text-zinc-500"}>
                  {selectedCompany ? `${selectedCompany.razonSocial} (${selectedCompany.rut})` : "Seleccione una empresa (Requerido)"}
                </span>
                {!fixedCompany && <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </div>

              {showCompanyDropdown && (
                <>
                  {/* Backdrop para cerrar el dropdown si se hace click afuera */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowCompanyDropdown(false)} 
                  />
                  
                  <div className="relative mt-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                    <div className="p-3 border-b border-zinc-800/80 flex items-center gap-3 bg-zinc-950/50">
                      <Search className="w-5 h-5 text-zinc-400 ml-1" />
                      <input 
                        autoFocus
                        className="w-full bg-transparent border-none text-white focus:outline-none text-sm py-1 placeholder:text-zinc-600"
                        placeholder="Buscar por RUT o Razón Social..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                      {(() => {
                        const filtered = customers || [];

                        if (!filtered || filtered.length === 0) {
                          return <div className="p-6 text-sm text-zinc-500 text-center flex flex-col items-center justify-center gap-2">
                            <Search className="w-8 h-8 text-zinc-700" />
                            <span>No se encontraron empresas</span>
                          </div>;
                        }

                        return filtered.map((company: any) => (
                          <div 
                            key={company.id}
                            onClick={() => {
                              setFormData({...formData, companyId: company.id});
                              setSelectedCompany(company);
                              setShowCompanyDropdown(false);
                              setCompanySearch("");
                            }}
                            className={`p-3.5 rounded-xl cursor-pointer text-sm flex justify-between items-center transition-all ${formData.companyId === company.id ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-zinc-800/60 text-zinc-300 border border-transparent'}`}
                          >
                            <div className="flex flex-col gap-1.5">
                              <div className="font-bold text-white text-base">{company.razonSocial}</div>
                              <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">{company.rut}</span>
                              </div>
                            </div>
                            {formData.companyId === company.id && <Check className="w-5 h-5" />}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Input oculto para validación de formulario (required) */}
            <input type="text" value={formData.companyId} onChange={() => {}} className="hidden" tabIndex={-1} />
          </div>
        )}
      </div>
      <div className="flex justify-end pt-2">
         <button 
           disabled={isSubmitting}
           className="px-8 py-2.5 bg-white text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
         >
           {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
           {initialData ? "Actualizar Usuario" : "Guardar Usuario"}
         </button>
      </div>
    </form>
  );
}
