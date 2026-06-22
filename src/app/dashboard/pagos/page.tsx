'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, Building2, CreditCard, Wallet, AlertCircle, Edit2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';
import { useAuth } from '@/context/auth-context';

type BankAccount = {
  accountName: string;
  accountDetails: string;
  bankName: string;
};

type BankTransferConfig = {
  enabled: boolean;
  title: string;
  description: string;
  instructions: string;
  accounts: BankAccount[];
};

type MercadoPagoConfig = {
  enabled: boolean;
  accessToken: string;
  publicKey: string;
};

export default function PagosDashboard() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'bank' | 'mp'>('bank');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form for Bank Transfer
  const bankForm = useForm<BankTransferConfig>({
    defaultValues: {
      enabled: false,
      title: 'Transferencia bancaria directa',
      description: 'Realiza tu pago directamente en una de nuestras cuentas bancarias...',
      instructions: '',
      accounts: []
    }
  });

  const { fields: accountFields, append: appendAccount, remove: removeAccount } = useFieldArray({
    control: bankForm.control,
    name: "accounts"
  });

  // Form for Mercado Pago
  const mpForm = useForm<MercadoPagoConfig>({
    defaultValues: {
      enabled: false,
      accessToken: '',
      publicKey: ''
    }
  });

  useEffect(() => {
    if (!accessToken) return;

    const fetchSettings = async () => {
      try {
        const [bankRes, mpRes] = await Promise.all([
          fetch('/api/settings?key=bank_transfer_config', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }),
          fetch('/api/settings?key=mercadopago_config', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
        ]);
        
        const bankData = await bankRes.json();
        const mpData = await mpRes.json();
        
        if (bankData.value) bankForm.reset(bankData.value);
        if (mpData.value) mpForm.reset(mpData.value);
      } catch (error) {
        toast.error('Error al cargar configuraciones');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [bankForm, mpForm, accessToken]);

  const onSaveBank = async (data: BankTransferConfig) => {
    // Limpiar cuentas vacías antes de guardar
    const cleanedData = {
      ...data,
      accounts: data.accounts.filter(acc => 
        (acc.accountName && acc.accountName.trim() !== '')
      )
    };
    
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ key: 'bank_transfer_config', value: cleanedData })
      });
      if (res.ok) toast.success('Configuración de transferencia guardada');
      else throw new Error();
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const onSaveMP = async (data: MercadoPagoConfig) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ key: 'mercadopago_config', value: data })
      });
      if (res.ok) toast.success('Configuración de MercadoPago guardada');
      else throw new Error();
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Proveedores de pago</h1>
        <p className="text-zinc-500 text-sm mt-1">Configura las opciones de pago que verán tus clientes durante el checkout.</p>
      </div>

      <div className="flex gap-4 border-b border-zinc-200">
        <button 
          onClick={() => setActiveTab('bank')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'bank' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
        >
          <Building2 className="w-4 h-4 inline-block mr-2" />
          Transferencia Bancaria
        </button>
        <button 
          onClick={() => setActiveTab('mp')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'mp' ? 'border-blue-500 text-blue-500' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
        >
          <CreditCard className="w-4 h-4 inline-block mr-2" />
          Mercado Pago (Simulado)
        </button>
      </div>

      {activeTab === 'bank' && (
        <form onSubmit={bankForm.handleSubmit(onSaveBank)} className="space-y-8 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Transferencia bancaria directa</h2>
              <p className="text-sm text-zinc-500">Permite pagos directos a tus cuentas.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...bankForm.register('enabled')} className="rounded text-primary focus:ring-primary h-5 w-5 border-zinc-300" />
              <span className="font-bold text-sm text-zinc-900">Activar método</span>
            </label>
          </div>

          <div className="space-y-6 max-w-3xl">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Título</Label>
              <Input {...bankForm.register('title')} className="bg-zinc-50 border-zinc-200 text-zinc-900 font-medium" />
              <p className="text-xs text-zinc-400">Nombre del método de pago que verá el cliente.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Descripción</Label>
              <Textarea {...bankForm.register('description')} className="bg-zinc-50 border-zinc-200 text-zinc-900 font-medium min-h-[80px]" />
              <p className="text-xs text-zinc-400">Descripción que verá el cliente al finalizar el pago.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Instrucciones</Label>
              <Textarea {...bankForm.register('instructions')} className="bg-zinc-50 border-zinc-200 text-zinc-900 font-medium min-h-[80px]" />
              <p className="text-xs text-zinc-400">Instrucciones que se agregarán a la página de agradecimiento.</p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Detalles de la cuenta</h3>
              <p className="text-xs text-zinc-500">Configura los datos de tu cuenta bancaria.</p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-100 text-xs uppercase text-zinc-500 font-bold border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-3">Nombre de la cuenta</th>
                    <th className="px-4 py-3">Número de cuenta</th>
                    <th className="px-4 py-3">Nombre del banco</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {accountFields.map((field, index) => {
                    const isEditing = editingIndex === index;
                    return (
                      <tr key={field.id} className="border-b border-zinc-100 bg-white">
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <Input {...bankForm.register(`accounts.${index}.accountName`)} className="h-9 text-sm text-zinc-900 font-medium" placeholder="Ej: Mi Empresa SPA" />
                          ) : (
                            <span className="text-sm font-medium text-zinc-900">{bankForm.getValues(`accounts.${index}.accountName`) || '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <Input {...bankForm.register(`accounts.${index}.accountDetails`)} className="h-9 text-sm text-zinc-900 font-medium" placeholder="N° de cuenta" />
                          ) : (
                            <span className="text-sm font-medium text-zinc-900">{bankForm.getValues(`accounts.${index}.accountDetails`) || '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <Input {...bankForm.register(`accounts.${index}.bankName`)} className="h-9 text-sm text-zinc-900 font-medium" placeholder="Ej: Banco de Chile" />
                          ) : (
                            <span className="text-sm font-medium text-zinc-900">{bankForm.getValues(`accounts.${index}.bankName`) || '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <button type="button" onClick={() => {
                                const currentAcc = bankForm.getValues(`accounts.${index}`);
                                if (!currentAcc.bankName?.trim() && !currentAcc.accountDetails?.trim() && !currentAcc.accountName?.trim()) {
                                  removeAccount(index);
                                }
                                setEditingIndex(null);
                              }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button type="button" onClick={() => setEditingIndex(index)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button type="button" onClick={() => {
                              removeAccount(index);
                              if (editingIndex === index) setEditingIndex(null);
                            }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {accountFields.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-400 italic text-sm">
                        No hay cuentas configuradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="p-3 bg-white border-t border-zinc-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    appendAccount({ accountName: '', accountDetails: '', bankName: '' });
                    setEditingIndex(accountFields.length);
                  }}
                  className="text-xs font-bold text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
                >
                  <Plus className="w-3 h-3 mr-2" /> Agregar cuenta
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button disabled={saving} className="bg-primary text-zinc-950 font-black">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar los cambios
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'mp' && (
        <form onSubmit={mpForm.handleSubmit(onSaveMP)} className="space-y-8 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black text-xs">MP</div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Mercado Pago (Oficial)</h2>
                <p className="text-sm text-zinc-500">Acepta tarjetas de crédito, débito y dinero de cuenta Mercado Pago.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...mpForm.register('enabled')} className="rounded text-blue-500 focus:ring-blue-500 h-5 w-5 border-zinc-300" />
              <span className="font-bold text-sm text-zinc-900">Activar método</span>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Esta es una simulación de la configuración de Mercado Pago para preparar el Checkout.</p>
          </div>

          <div className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Public Key</Label>
              <Input {...mpForm.register('publicKey')} className="bg-zinc-50 border-zinc-200 text-zinc-900 font-mono text-sm" placeholder="TEST-..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Access Token</Label>
              <Input {...mpForm.register('accessToken')} type="password" className="bg-zinc-50 border-zinc-200 text-zinc-900 font-mono text-sm" placeholder="TEST-..." />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-100">
            <Button disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar Mercado Pago
            </Button>
          </div>
        </form>
      )}

      </div>
    </RoleGuard>
  );
}
