import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@prisma/client";

interface UserFormProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  onSuccess: () => void;
}

export function UserForm({ onSubmit, isSubmitting, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "BUYER"
  });
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === UserRole.COMPANY_ADMIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      toast.success("Usuario creado correctamente");
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "BUYER"
      });
      onSuccess();
    } catch (error: any) {
      // Manejado en el hook o componente superior si falla
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Nombre</label>
          <input 
            required
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Ej: Juan"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Apellido</label>
          <input 
            required
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Ej: Pérez"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Email</label>
          <input 
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="email@empresa.cl"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Password</label>
          <input 
            required
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="********"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Rol</label>
          <select 
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
      </div>
      <div className="flex justify-end pt-2">
        <button 
          disabled={isSubmitting}
          className="px-8 py-2.5 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
          Guardar Usuario
        </button>
      </div>
    </form>
  );
}
