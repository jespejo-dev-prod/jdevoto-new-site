'use client';

import { Company } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterCompanySchema, RegisterCompanyDto } from '@/validations/company.schemas';
import { 
  Building2, 
  CreditCard, 
  Truck, 
  Percent, 
  Phone, 
  Globe, 
  Mail,
  User,
  Save,
  Trash2,
  AlertCircle,
  Loader2,
  Clock,
  RotateCcw,
  Key,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHILE_REGIONS } from '@/lib/chile-data';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

interface CustomerFormProps {
  initialData?: Partial<Company> & { salesRepEmail?: string | null };
  onSubmit: (data: RegisterCompanyDto) => void;
  isSubmitting?: boolean;
  onDelete?: () => void;
  onActivate?: () => void;
  isActivating?: boolean;
}

const findMatchingRegionName = (name: string | null | undefined): string => {
  if (!name) return "";
  const norm = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const match = CHILE_REGIONS.find(r => {
    const rNorm = r.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    return rNorm === norm || rNorm.includes(norm) || norm.includes(rNorm);
  });
  return match ? match.name : name;
};

const findMatchingCommunaName = (regionName: string | undefined, comunaName: string | null | undefined): string => {
  if (!comunaName) return "";
  const norm = comunaName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const region = CHILE_REGIONS.find(r => r.name === regionName);
  if (!region) return comunaName;
  const match = region.comunas.find(c => {
    const cNorm = c.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    return cNorm === norm || cNorm.includes(norm) || norm.includes(cNorm);
  });
  return match ? match.name : comunaName;
};

export function CustomerForm({ initialData, onSubmit, isSubmitting, onDelete, onActivate, isActivating }: CustomerFormProps) {
  const { user } = useAuth();
  const isCustomerUser = user?.role === 'COMPANY_ADMIN' || user?.role === 'BUYER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const canEditCommercialTerms = isAdmin;

  const [creditLimitDisplay, setCreditLimitDisplay] = useState('');

  // Initial load formatting
  useEffect(() => {
    if (initialData?.creditLimit !== undefined && initialData?.creditLimit !== null) {
      setCreditLimitDisplay(Math.round(Number(initialData.creditLimit)).toLocaleString('es-CL'));
    } else {
      setCreditLimitDisplay('0');
    }
  }, [initialData?.creditLimit]);

  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/\D/g, '');
    
    if (cleanVal === '') {
      setValue('creditLimit', 0, { shouldValidate: true, shouldDirty: true });
      setCreditLimitDisplay('');
      return;
    }

    const parsed = parseInt(cleanVal, 10);
    setValue('creditLimit', parsed, { shouldValidate: true, shouldDirty: true });
    setCreditLimitDisplay(parsed.toLocaleString('es-CL'));
  };

  const defaultRegion = findMatchingRegionName(initialData?.region);
  const defaultComuna = findMatchingCommunaName(defaultRegion, initialData?.comuna);

  const defaultShippingRegion = findMatchingRegionName(initialData?.shippingRegion);
  const defaultShippingCommune = findMatchingCommunaName(defaultShippingRegion, initialData?.shippingCommune);

  const defaultBillingRegion = findMatchingRegionName(initialData?.billingRegion);
  const defaultBillingCommune = findMatchingCommunaName(defaultBillingRegion, initialData?.billingCommune);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, dirtyFields } } = useForm<RegisterCompanyDto>({
    resolver: zodResolver(RegisterCompanySchema) as any,
    defaultValues: {
      rut: initialData?.rut || '',
      razonSocial: initialData?.razonSocial || '',
      nombreFantasia: initialData?.nombreFantasia || '',
      giro: initialData?.giro || '',
      direccion: initialData?.direccion || '',
      comuna: defaultComuna,
      ciudad: initialData?.ciudad || '',
      region: defaultRegion,
      telefono: initialData?.telefono || '',
      email: initialData?.email || '',
      website: initialData?.website || '',
      salesRepEmail: initialData?.salesRepEmail || '',
      initialPassword: '',
      defaultDiscount: Number(initialData?.defaultDiscount) || 0,
      creditLimit: Number(initialData?.creditLimit) || 0,
      paymentTerms: initialData?.paymentTerms ?? 0,
      paymentTermDiscount: Number(initialData?.paymentTermDiscount) || 0,
      
      shippingStreet: initialData?.shippingStreet || '',
      shippingNumber: initialData?.shippingNumber || '',
      shippingApartment: initialData?.shippingApartment || '',
      shippingCommune: defaultShippingCommune,
      shippingCity: initialData?.shippingCity || '',
      shippingRegion: defaultShippingRegion,

      billingStreet: initialData?.billingStreet || '',
      billingNumber: initialData?.billingNumber || '',
      billingApartment: initialData?.billingApartment || '',
      billingCommune: defaultBillingCommune,
      billingCity: initialData?.billingCity || '',
      billingRegion: defaultBillingRegion,
      billingEmail: initialData?.billingEmail || initialData?.email || '',
    }
  });

  useEffect(() => {
    if (initialData) {
      const reg = findMatchingRegionName(initialData.region);
      const com = findMatchingCommunaName(reg, initialData.comuna);
      
      const sReg = findMatchingRegionName(initialData.shippingRegion);
      const sCom = findMatchingCommunaName(sReg, initialData.shippingCommune);

      const bReg = findMatchingRegionName(initialData.billingRegion);
      const bCom = findMatchingCommunaName(bReg, initialData.billingCommune);

      reset({
        rut: initialData.rut || '',
        razonSocial: initialData.razonSocial || '',
        nombreFantasia: initialData.nombreFantasia || '',
        giro: initialData.giro || '',
        direccion: initialData.direccion || '',
        comuna: com,
        ciudad: initialData.ciudad || '',
        region: reg,
        telefono: initialData.telefono || '',
        email: initialData.email || '',
        website: initialData.website || '',
        salesRepEmail: initialData.salesRepEmail || '',
        defaultDiscount: Number(initialData.defaultDiscount) || 0,
        creditLimit: Number(initialData.creditLimit) || 0,
        paymentTerms: initialData.paymentTerms ?? 0,
        paymentTermDiscount: Number(initialData.paymentTermDiscount) || 0,
        
        shippingStreet: initialData.shippingStreet || '',
        shippingNumber: initialData.shippingNumber || '',
        shippingApartment: initialData.shippingApartment || '',
        shippingCommune: sCom,
        shippingCity: initialData.shippingCity || '',
        shippingRegion: sReg,

        billingStreet: initialData.billingStreet || '',
        billingNumber: initialData.billingNumber || '',
        billingApartment: initialData.billingApartment || '',
        billingCommune: bCom,
        billingCity: initialData.billingCity || '',
        billingRegion: bReg,
        billingEmail: initialData.billingEmail || initialData.email || '',
      });
    }
  }, [initialData, reset, user]);

  const watchedPaymentTerms = watch('paymentTerms');

  // Lógica Automática: Descuento por condición de pago
  useEffect(() => {
    const termToDiscount: Record<number, number> = {
      0: 10,
      30: 7,
      31: 10,
      60: 4,
      61: 0,
      90: 0
    };
    
    if (watchedPaymentTerms in termToDiscount) {
      setValue('paymentTermDiscount', termToDiscount[watchedPaymentTerms as keyof typeof termToDiscount]);
    }
  }, [watchedPaymentTerms, setValue]);

  // Autofill billingEmail from email
  const watchedEmail = watch('email');
  const isBillingEmailDirty = !!dirtyFields.billingEmail;

  useEffect(() => {
    // Solo autocompletamos el email de facturación automáticamente al CREAR un cliente nuevo.
    // Si estamos editando (!initialData?.id es falso), no tocamos el billingEmail porque
    // puede causar que se sobreescriba con el email normal al cargar el formulario.
    if (!initialData?.id && !isBillingEmailDirty && watchedEmail) {
      setValue('billingEmail', watchedEmail, { shouldValidate: true, shouldDirty: false });
    }
  }, [watchedEmail, isBillingEmailDirty, setValue, initialData?.id]);

  const defaultDiscountVal = Number(watch('defaultDiscount') || 0);
  const paymentTermDiscountVal = Number(watch('paymentTermDiscount') || 0);
  const totalDiscountVal = 100 - (1 - defaultDiscountVal / 100) * (1 - paymentTermDiscountVal / 100) * 100;
  const formattedTotalDiscount = totalDiscountVal.toLocaleString('es-CL', { maximumFractionDigits: 2 });

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8 animate-in fade-in duration-700">
      
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest">
          <AlertCircle className="h-5 w-5" />
          Hay errores en el formulario. Por favor, revísalos antes de guardar.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              Identificación Legal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">RUT Empresa</label>
                <input 
                  {...register('rut')}
                  disabled={!!initialData?.id && !isAdmin}
                  className={cn(
                    "w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none transition-all disabled:opacity-50",
                    errors.rut && "border-red-500/50 focus:border-red-500"
                  )}
                  placeholder="12345678-9"
                />
                {errors.rut && <p className="text-red-400 text-[10px] font-bold px-1">{errors.rut.message}</p>}
                {!!initialData?.id && !isAdmin && (
                  <p className="text-sm text-zinc-400 px-1 italic mt-1">Solo administradores pueden modificar el RUT.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Razón Social</label>
                <input 
                  {...register('razonSocial')}
                  className={cn(
                    "w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none transition-all",
                    errors.razonSocial && "border-red-500/50"
                  )}
                  placeholder="Ej: J. Devoto"
                />
                {errors.razonSocial && <p className="text-red-400 text-[10px] font-bold px-1">{errors.razonSocial.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Giro Comercial</label>
                <input 
                  {...register('giro')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none transition-all"
                  placeholder="Venta de artículos electrónicos..."
                />
              </div>

              <div className="space-y-2 md:col-span-2 mt-2 border-t border-zinc-800 pt-6">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Dirección Tributaria / Legal</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-12 space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Calle y Número</label>
                    <input 
                      {...register('direccion')} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none" 
                      placeholder="Ej: Av. Apoquindo 4501"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Región</label>
                    <input 
                      {...register('region')} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none" 
                      placeholder="Ej: Metropolitana de Santiago"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Comuna</label>
                    <input 
                      {...register('comuna')} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none" 
                      placeholder="Ej: Las Condes"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Ciudad</label>
                    <input 
                      {...register('ciudad')} 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none" 
                      placeholder="Ej: Santiago"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              Datos de Acceso y Contacto
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Email Contacto (Usuario)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input {...register('email')} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-white focus:border-primary/50 outline-none text-base" />
                  </div>
                  {errors.email && <p className="text-red-400 text-[10px] font-bold px-1">{errors.email.message}</p>}
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input {...register('telefono')} placeholder="+56 9 1234 5678" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-white focus:border-primary/50 outline-none text-base" />
                  </div>
                  {errors.telefono && <p className="text-red-400 text-[10px] font-bold px-1">{errors.telefono.message}</p>}
               </div>

               {!initialData?.id && (
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Contraseña de Acceso (Opcional)</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input 
                        {...register('initialPassword')} 
                        type="password"
                        placeholder="Mínimo 6 caracteres (Opcional)"
                        className={cn(
                          "w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-white focus:border-primary/50 outline-none text-base",
                          errors.initialPassword && "border-red-500/50"
                        )} 
                      />
                    </div>
                    {errors.initialPassword && <p className="text-red-400 text-[10px] font-bold px-1">{errors.initialPassword.message as string}</p>}
                    <p className="text-sm text-zinc-400 px-1 italic mt-1">
                      Si la dejas en blanco, se enviará un enlace al cliente para crearla.
                    </p>
                 </div>
               )}
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                Dirección de Envío / Despacho
              </h3>
              <button
                type="button"
                onClick={() => {
                  setValue('shippingStreet', watch('direccion'), { shouldValidate: true, shouldDirty: true });
                  setValue('shippingRegion', watch('region'), { shouldValidate: true, shouldDirty: true });
                  setValue('shippingCommune', watch('comuna'), { shouldValidate: true, shouldDirty: true });
                  setValue('shippingCity', watch('ciudad'), { shouldValidate: true, shouldDirty: true });
                }}
                className="text-[11px] font-bold text-primary hover:text-white transition-colors uppercase tracking-wider bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/20 self-start sm:self-auto"
              >
                Copiar Dir. Tributaria
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-12 space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Calle y Número</label>
                <input {...register('shippingStreet')} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none" />
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Región</label>
                <input 
                  type="text"
                  {...register('shippingRegion')} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none" 
                  placeholder="Ej: Metropolitana de Santiago"
                />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Comuna</label>
                <input 
                  type="text"
                  {...register('shippingCommune')} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none" 
                  placeholder="Ej: Providencia"
                />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Ciudad</label>
                <input {...register('shippingCity')} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              Datos de Facturación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Email envío facturas</label>
                <input {...register('billingEmail')} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none" placeholder="facturacion@empresa.cl" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: Condición de Pago y Descuento por Pago */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              Condición de Pago
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Plazo de Pago</label>
                <div className="relative">
                  <select 
                    {...register('paymentTerms', { valueAsNumber: true })}
                    disabled={isCustomerUser}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 px-4 text-white focus:border-primary/50 outline-none appearance-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value={0}>Contado (0 días)</option>
                    <option value={30}>30 días (7% Dcto)</option>
                    <option value={31}>30 días, 10% Dcto</option>
                    <option value={60}>60 días (4% Dcto)</option>
                    <option value={61}>60 días, 0% Dcto</option>
                    <option value={90}>90 días</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                </div>
                {isCustomerUser && (
                  <p className="text-sm text-zinc-400 px-1 italic text-center mt-1">
                    Solo el administrador del sitio puede cambiar tu condición de pago.
                  </p>
                )}
              </div>

              <div className="bg-zinc-950/60 rounded-2xl p-4 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-zinc-500 uppercase">Dcto. por Pago</span>
                     <span className="text-sm text-zinc-400 italic">Automático según plazo</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-2xl font-black text-primary">-{watch('paymentTermDiscount') || 0}%</span>
                  </div>
                </div>
                {watch('paymentTerms') === 0 && (
                  <div className="border-t border-zinc-800/50 pt-2 text-xs text-zinc-400 leading-relaxed">
                    <span className="text-emerald-400 font-bold">Nota:</span> Se aplica un 10% de descuento por pago al contado.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl sticky top-24">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <Percent className="h-5 w-5 text-primary" />
              Descuento Comercial
            </h3>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm text-zinc-300 leading-relaxed space-y-1.5">
              <span className="font-bold text-primary block text-[15px]">💡 ¿Cómo se aplican los descuentos?</span>
              <p>
                Los descuentos no se suman, se aplican de forma sucesiva.
              </p>
              <p className="text-sm text-zinc-400 italic mt-1">
                Ejemplo: 25% + 10% resulta en un 32,5% de descuento final.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Límite de Crédito (CLP)</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input 
                    type="text"
                    value={creditLimitDisplay}
                    onChange={handleCreditLimitChange}
                    disabled={!canEditCommercialTerms}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-14 pl-12 pr-6 text-xl font-bold text-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <input type="hidden" {...register('creditLimit', { valueAsNumber: true })} />
                </div>
                {errors.creditLimit && <p className="text-red-400 text-[10px] font-bold px-1">{errors.creditLimit.message}</p>}
                <p className="text-sm text-zinc-400 px-1 italic text-center mt-1">
                  {!canEditCommercialTerms ? "Solo el administrador del sitio puede cambiar el crédito." : "Crédito máximo autorizado para compras B2B."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Descuento Base (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.01"
                    {...register('defaultDiscount', { valueAsNumber: true })}
                    disabled={!canEditCommercialTerms}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-14 px-6 text-xl font-bold text-primary focus:border-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">%</div>
                </div>
                {errors.defaultDiscount && <p className="text-red-400 text-[10px] font-bold px-1">{errors.defaultDiscount.message}</p>}
                <p className="text-sm text-zinc-400 px-1 italic text-center mt-1">
                  {!canEditCommercialTerms ? "Solo el administrador del sitio puede cambiar el descuento." : "Descuento adicional fijo por cliente."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                 <div className="flex justify-between text-sm font-bold text-zinc-500 uppercase">
                    <span>Total Descuentos</span>
                    <span className="text-primary">{formattedTotalDiscount}%</span>
                 </div>
                 <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500" 
                      style={{ width: `${Math.min(totalDiscountVal, 100)}%` }}
                    />
                 </div>
              </div>
            </div>

            <div className="h-px bg-zinc-800" />

            <div className="space-y-4">
               {canEditCommercialTerms && (
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Ejecutivo de Ventas (Email)</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input 
                        {...register('salesRepEmail')} 
                        placeholder="vendedor@tuempresa.cl"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl h-12 pl-12 pr-4 text-white focus:border-primary/50 outline-none text-base" 
                      />
                    </div>
                    {errors.salesRepEmail && <p className="text-red-400 text-[10px] font-bold px-1">{errors.salesRepEmail.message}</p>}
                    <p className="text-sm text-zinc-400 px-1 italic mt-1">
                      Email del vendedor activo.
                    </p>
                 </div>
               )}
            </div>

            <div className="space-y-3 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-black h-14 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Guardar Cambios
              </button>

              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="w-full bg-red-500/5 text-red-500/60 border border-red-500/10 h-14 rounded-2xl font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  {initialData?.isActive ? 'Desactivar Cliente' : 'Eliminar Definitivamente'}
                </button>
              )}

              {onActivate && !initialData?.isActive && (
                <button
                  type="button"
                  onClick={onActivate}
                  disabled={isActivating}
                  className="w-full bg-emerald-500 text-black h-14 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isActivating ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
                  Reactivar Cliente
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
