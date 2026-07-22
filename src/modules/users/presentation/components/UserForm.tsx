import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@prisma/client";

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
    role: fixedRole || "BUYER"
  });
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === UserRole.COMPANY_ADMIN;

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || "",
        password: "",
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        role: initialData.role || "BUYER"
      });
    } else {
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: fixedRole || "BUYER"
      });
    }
  }, [initialData, fixedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
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
          role: fixedRole || "BUYER"
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
            required={!initialData}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder={initialData ? "Dejar en blanco para no cambiar" : "********"}
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
