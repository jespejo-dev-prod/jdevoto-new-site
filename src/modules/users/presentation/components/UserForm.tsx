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
}

export function UserForm({ onSubmit, isSubmitting, onSuccess, initialData, fixedRole }: UserFormProps) {
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
        companyId: ""
      });
    }
  }, [initialData, fixedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      // Validate company selection for non-company-admin users
      if (!isCompanyAdmin && !submitData.companyId) {
        toast.error("Debes seleccionar una empresa asociada.");
        return;
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
              <option value="BUYER">Comprador (Cliente)</option>
              {!isCompanyAdmin && (
                <>
                  <option value="COMPANY_ADMIN">Admin de Empresa (Company Admin)</option>
                  <option value="SALES_REP">Vendedor (Sales Rep)</option>
                  <option value="ADMIN">Administrador (Sistema)</option>
                </>
              )}
            </select>
          </div>
        )}
        
        {!isCompanyAdmin && (
          <div className="space-y-2 md:col-span-2 relative">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center justify-between">
              <span>Empresa Asociada</span>
              {isLoadingCustomers && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
            </label>
            
            <div className="relative">
              <div 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-base text-white cursor-pointer flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                tabIndex={0}
              >
                <span className={formData.companyId ? "text-white" : "text-zinc-500"}>
                  {selectedCompany ? `${selectedCompany.razonSocial} (${selectedCompany.rut})` : "Seleccione una empresa (Requerido)"}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </div>

              {showCompanyDropdown && (
                <>
                  {/* Backdrop para cerrar el dropdown si se hace click afuera */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowCompanyDropdown(false)} 
                  />
                  
                  <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-zinc-800 flex items-center gap-2">
                      <Search className="w-4 h-4 text-zinc-500 ml-2" />
                      <input 
                        autoFocus
                        className="w-full bg-transparent border-none text-white focus:outline-none text-sm py-2"
                        placeholder="Buscar por RUT o Razón Social..."
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                      {(() => {
                        const filtered = customers || [];

                        if (!filtered || filtered.length === 0) {
                          return <div className="p-4 text-sm text-zinc-500 text-center">No se encontraron empresas</div>;
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
                            className={`p-3 rounded-lg cursor-pointer text-sm flex justify-between items-center transition-colors ${formData.companyId === company.id ? 'bg-primary/20 text-primary' : 'hover:bg-zinc-800 text-zinc-300'}`}
                          >
                            <div>
                              <div className="font-bold">{company.razonSocial}</div>
                              <div className="text-xs opacity-70">{company.rut}</div>
                            </div>
                            {formData.companyId === company.id && <Check className="w-4 h-4" />}
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
