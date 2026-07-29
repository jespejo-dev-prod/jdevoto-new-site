'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useCustomer } from '@/modules/customers/presentation/hooks/useCustomers';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Building, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AsignarCreditoPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const customerId = params?.id as string;

  const { data: company, isLoading } = useCustomer(customerId);

  const [creditLimit, setCreditLimit] = useState<string>('');
  const [creditUsed, setCreditUsed] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setCreditLimit(Math.round(Number(company.creditLimit || 0)).toLocaleString('es-CL'));
      setCreditUsed(Math.round(Number(company.creditUsed || 0)).toLocaleString('es-CL'));
    }
  }, [company]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    // Solo permitir números
    const digitsOnly = e.target.value.replace(/\D/g, '');
    if (!digitsOnly) {
      setter('');
      return;
    }
    // Formatear con separador de miles
    const formatted = parseInt(digitsOnly, 10).toLocaleString('es-CL');
    setter(formatted);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    // Quitar puntos para obtener el número real
    const limitNum = parseInt(creditLimit.replace(/\./g, ''), 10) || 0;
    const usedNum = parseInt(creditUsed.replace(/\./g, ''), 10) || 0;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/customers/${company.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          creditLimit: limitNum,
          creditUsed: usedNum
        })
      });

      if (!res.ok) throw new Error('Error al actualizar el crédito');
      
      toast.success(`Línea de crédito de ${company.razonSocial} actualizada correctamente.`);
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      
      // Volver a la página anterior
      router.push('/dashboard/cuenta-corriente');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar crédito.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
        
        {/* Header & Volver */}
        <div>
          <Link 
            href="/dashboard/cuenta-corriente"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Cuenta Corriente
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary" />
            Asignar / Ajustar Crédito B2B
          </h1>
          <p className="text-zinc-500 mt-2">
            Configura el cupo de crédito y los montos utilizados de forma manual para este cliente.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-zinc-900/20 rounded-3xl border border-zinc-800">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cargando datos del cliente...</p>
          </div>
        ) : !company ? (
          <div className="bg-zinc-900/20 rounded-3xl border border-zinc-800 p-12 text-center text-zinc-500 font-bold">
            No se encontró el cliente.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Info Panel */}
            <div className="lg:col-span-1 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 shadow-xl h-fit">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 mb-4 border border-zinc-700">
                <Building className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{company.razonSocial}</h2>
              {company.rut && (
                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 select-none">
                  {company.rut}
                </span>
              )}
              <div className="mt-6 pt-6 border-t border-zinc-800 space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-zinc-300 font-medium truncate">{company.email || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Teléfono</p>
                  <p className="text-sm text-zinc-300 font-medium truncate">{company.telefono || 'No registrado'}</p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 shadow-xl">
              <form onSubmit={handleSave} className="space-y-8">
                
                <div className="space-y-6">
                  {/* Cupo Autorizado */}
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Cupo Autorizado ($ CLP)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold select-none">$</span>
                      <input
                        type="text"
                        value={creditLimit}
                        onChange={(e) => handleAmountChange(e, setCreditLimit)}
                        placeholder="0"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-4 text-xl text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold transition-all placeholder:text-zinc-700 shadow-inner"
                      />
                    </div>
                    <p className="text-xs text-zinc-500">Monto total disponible autorizado para compras con crédito B2B.</p>
                  </div>

                  {/* Crédito Utilizado */}
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Crédito Utilizado / Deuda ($ CLP)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold select-none">$</span>
                      <input
                        type="text"
                        value={creditUsed}
                        onChange={(e) => handleAmountChange(e, setCreditUsed)}
                        placeholder="0"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-4 text-xl text-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-bold transition-all placeholder:text-zinc-700 shadow-inner"
                      />
                    </div>
                    <p className="text-xs text-zinc-500">Saldo pendiente de pago acumulado en órdenes a crédito.</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-800">
                  <Link
                    href="/dashboard/cuenta-corriente"
                    className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-base font-bold transition-all shadow-sm text-center"
                  >
                    Cancelar
                  </Link>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground hover:opacity-95 text-base font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
