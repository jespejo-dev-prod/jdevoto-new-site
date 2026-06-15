'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useCustomer, useCustomers } from '@/modules/customers/presentation/hooks/useCustomers';
import { useOrders } from '@/modules/orders/presentation/hooks/useOrders';
import { RoleGuard } from '@/components/auth/role-guard';
import { UserRole } from '@prisma/client';
import { useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, 
  TrendingUp, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  Calendar,
  Building,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CuentaCorrientePage() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();

  const isAdminOrSalesRep = user?.role === UserRole.ADMIN || user?.role === UserRole.SALES_REP;
  const myCompanyId = user?.companyId || user?.company?.id || '';

  // Tab state for admins
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');

  // Default to "ALL" companies for Admin/Sales Rep so they see global pending orders first
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  useEffect(() => {
    if (isAdminOrSalesRep) {
      setSelectedCompanyId('ALL');
    } else if (myCompanyId) {
      setSelectedCompanyId(myCompanyId);
    }
  }, [myCompanyId, isAdminOrSalesRep]);

  // Search state for Admin/Sales Rep
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination state for customers tab (10 items per page)
  const [customerPage, setCustomerPage] = useState(1);

  useEffect(() => {
    if (!isAdminOrSalesRep) return;
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCustomerPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, isAdminOrSalesRep]);

  // 1. Query for the dropdown selector (limit 100)
  const { data: selectorCustomersList, meta: selectorMeta } = useCustomers(
    isAdminOrSalesRep ? { limit: 100, search: debouncedSearch } : { limit: 1, enabled: false }
  );
  const selectorCustomers = (selectorCustomersList || []).filter((c: any) => c.razonSocial && c.razonSocial.trim() !== '');

  // 2. Query for the paginated customer list in Tab 2 (limit 10)
  const { data: tableCustomersList, meta: customersMeta, isLoading: isLoadingCustomers } = useCustomers(
    isAdminOrSalesRep && activeTab === 'customers' 
      ? { limit: 10, page: customerPage, search: debouncedSearch } 
      : { limit: 1, enabled: false }
  );
  const tableCustomers = (tableCustomersList || []).filter((c: any) => c.razonSocial && c.razonSocial.trim() !== '');

  // Fetch updated company credit data (disable if selected ALL)
  const { data: company, isLoading: isLoadingCompany } = useCustomer(
    selectedCompanyId && selectedCompanyId !== 'ALL' ? selectedCompanyId : ''
  );

  // Combine search results and the currently selected company to ensure it's always in the list
  const displayCustomers = [...selectorCustomers];
  if (selectedCompanyId && selectedCompanyId !== 'ALL' && company) {
    const isSelectedInList = displayCustomers.some(c => c.id === selectedCompanyId);
    if (!isSelectedInList) {
      displayCustomers.push(company);
    }
  }

  // Invalidate queries on mount/company change to get latest credit limits & orders
  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== 'ALL') {
      queryClient.invalidateQueries({ queryKey: ["customer", selectedCompanyId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } else if (selectedCompanyId === 'ALL') {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  }, [selectedCompanyId, queryClient]);

  // Fetch pending B2B credit orders
  const { data: ordersData, isLoading: isLoadingOrders } = useOrders({
    companyId: selectedCompanyId && selectedCompanyId !== 'ALL' ? selectedCompanyId : undefined,
    paymentStatus: 'PENDING',
    paymentMethod: 'credit_b2b',
    limit: 100,
  });

  // Calculate credit limits based on view selection (rounded to prevent decimal places)
  let limit = 0;
  let used = 0;
  let available = 0;

  if (selectedCompanyId === 'ALL') {
    // Global summary of all company credits from DB aggregate
    limit = selectorMeta?.totals?.creditLimit ? Math.round(Number(selectorMeta.totals.creditLimit)) : 0;
    used = selectorMeta?.totals?.creditUsed ? Math.round(Number(selectorMeta.totals.creditUsed)) : 0;
    available = Math.max(0, limit - used);
  } else {
    limit = company?.creditLimit ? Math.round(Number(company.creditLimit)) : 0;
    used = company?.creditUsed ? Math.round(Number(company.creditUsed)) : 0;
    available = Math.max(0, limit - used);
  }

  const pendingOrders = ordersData?.data || [];
  const pendingOrdersTotal = Math.round(pendingOrders.reduce((sum: number, o: any) => sum + Number(o.totalGross || 0), 0));

  // Manual payment updates state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const handleConfirmTransfer = async (orderId: string, orderNumber: string) => {
    if (!confirm(`¿Estás seguro de que deseas confirmar el pago de la orden ${orderNumber} por transferencia directa? Se liberará el cupo de la empresa en la base de datos.`)) {
      return;
    }
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error('Error al registrar pago en el servidor.');

      toast.success(`Pago del pedido ${orderNumber} confirmado con éxito. Se liberó el cupo.`);
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al procesar la confirmación del pago.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOnlinePayment = async (orderId: string) => {
    setPayingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) throw new Error('Error al generar la preferencia de pago.');
      
      const json = await res.json();
      if (json.success && json.data?.initPoint) {
        window.location.href = json.data.initPoint;
      } else {
        throw new Error('No se recibió la URL de pago.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al iniciar el pago.');
    } finally {
      setPayingOrderId(null);
    }
  };

  // Adjust Credit Modal state
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [newCreditLimit, setNewCreditLimit] = useState<string>('');
  const [newCreditUsed, setNewCreditUsed] = useState<string>('');
  const [isSavingCredit, setIsSavingCredit] = useState(false);

  const handleOpenEdit = (comp: any) => {
    setEditingCompany(comp);
    setNewCreditLimit(Math.round(Number(comp.creditLimit || 0)).toString());
    setNewCreditUsed(Math.round(Number(comp.creditUsed || 0)).toString());
  };

  const handleSaveCredit = async () => {
    if (!editingCompany) return;
    setIsSavingCredit(true);
    try {
      const res = await fetch(`/api/customers/${editingCompany.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          creditLimit: Math.round(parseFloat(newCreditLimit)) || 0,
          creditUsed: Math.round(parseFloat(newCreditUsed)) || 0
        })
      });
      if (!res.ok) throw new Error('Error al actualizar crédito');
      
      toast.success(`Línea de crédito de ${editingCompany.razonSocial} actualizada correctamente.`);
      setEditingCompany(null);
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar crédito.');
    } finally {
      setIsSavingCredit(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.COMPANY_ADMIN, UserRole.BUYER, UserRole.ADMIN, UserRole.SALES_REP]}>
      <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8 animate-in fade-in duration-500">
        
        {/* Welcome / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
              Cuenta Corriente B2B
            </h1>
            <p className="text-sm text-zinc-500">
              {isAdminOrSalesRep 
                ? 'Panel administrativo para verificar créditos y confirmar pagos por transferencias de clientes.'
                : 'Revisa el estado de tu línea de crédito y salda tus pedidos pendientes online.'
              }
            </p>
          </div>
          
          {/* Customer view company label */}
          {!isAdminOrSalesRep && company && (
            <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-800/80 px-4 py-2 rounded-xl text-zinc-400 text-xs font-semibold select-none shadow-sm">
              <Building className="w-4 h-4 text-primary" />
              {company.razonSocial}
            </div>
          )}

          {/* Admin / Sales Rep view company selector dropdown */}
          {isAdminOrSalesRep && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] select-none">Buscar:</span>
                <input
                  type="text"
                  placeholder="RUT o Nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-950 text-zinc-100 border border-zinc-850 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium text-xs w-44 transition-all"
                />
              </div>

              {selectorCustomers && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] select-none">Seleccionar:</span>
                  <div className="relative">
                    <select
                      key={selectedCompanyId || 'empty'}
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="appearance-none bg-zinc-950 text-zinc-100 border border-zinc-850 hover:border-zinc-750 rounded-xl pl-9 pr-10 py-1.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold cursor-pointer text-xs transition-all shadow-lg min-w-[220px]"
                    >
                      <option value="ALL" className="bg-zinc-950 text-zinc-100 font-bold">
                        Todas las empresas
                      </option>
                      {displayCustomers.map((c: any) => (
                        <option key={c.id} value={c.id} className="bg-zinc-950 text-zinc-100">
                          {c.razonSocial} {c.rut ? `(${c.rut})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Límite de Crédito */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-36 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500" />
            <div className="flex justify-between items-start">
              <p className="text-zinc-400 font-semibold text-sm">
                {selectedCompanyId === 'ALL' ? 'Límite de Crédito Total (Cartera)' : 'Cupo Autorizado'}
              </p>
              <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            {isLoadingCompany || (selectedCompanyId === 'ALL' && isLoadingCustomers) ? (
              <Loader2 className="w-6 h-6 text-zinc-650 animate-spin" />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ${limit.toLocaleString('es-CL')}
              </h3>
            )}
          </div>

          {/* Crédito Utilizado (Deuda) */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-36 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all duration-500" />
            <div className="flex justify-between items-start">
              <p className="text-zinc-400 font-semibold text-sm">
                {selectedCompanyId === 'ALL' ? 'Total Deuda en Tránsito' : 'Crédito Utilizado'}
              </p>
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            {isLoadingCompany || (selectedCompanyId === 'ALL' && isLoadingCustomers) ? (
              <Loader2 className="w-6 h-6 text-zinc-650 animate-spin" />
            ) : (
              <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${used > 0 ? 'text-rose-400' : 'text-white'}`}>
                ${used.toLocaleString('es-CL')}
              </h3>
            )}
          </div>

          {/* Crédito Disponible / Total por Recaudar */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-36 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
            {selectedCompanyId === 'ALL' ? (
              <>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all duration-500" />
                <div className="flex justify-between items-start">
                  <p className="text-zinc-400 font-semibold text-sm">
                    Total por Recaudar (Pedidos Pendientes)
                  </p>
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                {isLoadingOrders ? (
                  <Loader2 className="w-6 h-6 text-zinc-650 animate-spin" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                    ${pendingOrdersTotal.toLocaleString('es-CL')}
                  </h3>
                )}
              </>
            ) : (
              <>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                <div className="flex justify-between items-start">
                  <p className="text-zinc-400 font-semibold text-sm">
                    Crédito Disponible
                  </p>
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                {isLoadingCompany ? (
                  <Loader2 className="w-6 h-6 text-zinc-650 animate-spin" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                    ${available.toLocaleString('es-CL')}
                  </h3>
                )}
              </>
            )}
          </div>
        </div>

        {/* Admin Tab Bar */}
        {isAdminOrSalesRep && (
          <div className="flex border-b border-zinc-800 gap-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition-all select-none ${
                activeTab === 'orders' 
                  ? 'border-primary text-white font-black' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Pedidos Pendientes B2B ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition-all select-none ${
                activeTab === 'customers' 
                  ? 'border-primary text-white font-black' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Clientes y Líneas de Crédito ({customersMeta?.total ?? selectorCustomers.length ?? 0})
            </button>
          </div>
        )}

        {/* TAB 1: Pedidos Pendientes */}
        {(!isAdminOrSalesRep || activeTab === 'orders') && (
          <div className="space-y-4">
            {(!isAdminOrSalesRep) && (
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Pedidos Pendientes de Pago</span>
                  {pendingOrders.length > 0 && (
                    <span className="text-xs bg-rose-500/15 border border-rose-500/20 text-rose-400 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                      {pendingOrders.length}
                    </span>
                  )}
                </h2>
                <span className="text-xs text-zinc-500 font-medium select-none">
                  Condición: Pago con Crédito Directo (B2B)
                </span>
              </div>
            )}

            {isLoadingCompany || isLoadingOrders ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Cargando pedidos...</p>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="bg-zinc-900/10 border border-zinc-800/60 rounded-2xl p-12 text-center flex flex-col items-center gap-4 max-w-2xl mx-auto mt-6">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-base">¡Sin pedidos pendientes!</h3>
                  <p className="text-xs text-zinc-500 font-medium font-sans">
                    {selectedCompanyId === 'ALL'
                      ? 'No hay registros de compras pendientes de pago por crédito directo en toda la cartera.'
                      : 'Esta empresa no tiene pedidos ni facturas vencidas asociadas a su línea de crédito B2B.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/20 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/35">
                        <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider">Nº Pedido</th>
                        {selectedCompanyId === 'ALL' && (
                          <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider">Empresa / RUT</th>
                        )}
                        <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider">Fecha Emisión</th>
                        <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider text-right">Neto</th>
                        <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider text-right">Total Bruto</th>
                        <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider text-center">Estado</th>
                        <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {pendingOrders.map((order) => {
                        const net = order.subtotalNet || 0;
                        const gross = order.totalGross || 0;
                        
                        return (
                          <tr key={order.id} className="hover:bg-zinc-900/20 transition-colors duration-150">
                            {/* Order Number */}
                            <td className="p-5 py-6 font-extrabold text-white text-lg">
                              <Link 
                                href={`/dashboard/orders/${order.id}`}
                                className="text-primary hover:underline transition-all"
                              >
                                {order.orderNumber}
                              </Link>
                            </td>

                            {/* Company Name & RUT (Global View Only) */}
                            {selectedCompanyId === 'ALL' && (
                              <td className="p-5 py-6 max-w-[280px] truncate">
                                <div className="text-white font-extrabold text-base">{order.companyName}</div>
                                {order.companyRut && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-1.5 select-none">
                                    {order.companyRut}
                                  </span>
                                )}
                              </td>
                            )}

                            {/* Date */}
                            <td className="p-5 py-6 text-base text-zinc-200 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-5 h-5 text-zinc-500" />
                                {new Date(order.createdAt).toLocaleDateString('es-CL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </div>
                            </td>

                            {/* Net Price */}
                            <td className="p-5 py-6 text-lg text-zinc-200 font-bold text-right">
                              ${Math.round(net).toLocaleString('es-CL')}
                            </td>

                            {/* Gross Price */}
                            <td className="p-5 py-6 text-lg font-black text-white text-right">
                              ${Math.round(gross).toLocaleString('es-CL')}
                            </td>

                            {/* State */}
                            <td className="p-5 py-6 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-inner">
                                <AlertCircle className="w-4 h-4" />
                                Pendiente
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="p-5 py-6 text-right">
                              {isAdminOrSalesRep ? (
                                <button 
                                  onClick={() => handleConfirmTransfer(order.id, order.orderNumber)}
                                  disabled={updatingOrderId !== null}
                                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-sm font-bold text-white transition-all shadow-md shadow-emerald-500/10 inline-flex items-center gap-1.5 select-none"
                                >
                                  {updatingOrderId === order.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                  Confirmar Transferencia
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleOnlinePayment(order.id)}
                                  disabled={payingOrderId !== null}
                                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/95 text-primary-foreground hover:opacity-90 disabled:opacity-50 text-sm font-bold transition-all shadow-md shadow-primary/10 inline-flex items-center gap-1.5 group select-none"
                                >
                                  {payingOrderId === order.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                  Pagar en línea
                                  {payingOrderId !== order.id && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Clientes y Líneas de Crédito (Only Admins / Sales Reps) */}
        {isAdminOrSalesRep && activeTab === 'customers' && (
          <div className="space-y-4">
            {isLoadingCustomers ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Cargando clientes...</p>
              </div>
            ) : tableCustomers.length === 0 ? (
              <div className="bg-zinc-900/10 border border-zinc-800/60 rounded-2xl p-12 text-center text-zinc-550 max-w-2xl mx-auto mt-6">
                No se encontraron empresas clientes que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-950/20 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/35">
                          <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider">Empresa / RUT</th>
                          <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider text-right">Cupo Autorizado</th>
                          <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider text-right">Crédito Utilizado (Deuda)</th>
                          <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider text-right">Crédito Disponible</th>
                          <th className="p-5 py-5 text-base font-bold text-zinc-300 uppercase tracking-wider text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {tableCustomers.map((c: any) => {
                          const cLimit = Math.round(Number(c.creditLimit || 0));
                          const cUsed = Math.round(Number(c.creditUsed || 0));
                          const cAvailable = Math.max(0, cLimit - cUsed);
                          
                          return (
                            <tr key={c.id} className="hover:bg-zinc-900/20 transition-colors duration-150">
                              <td className="p-5 py-6">
                                <div className="font-extrabold text-white text-base">{c.razonSocial}</div>
                                {c.rut && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-1.5 select-none">
                                    {c.rut}
                                  </span>
                                )}
                              </td>
                              <td className="p-5 py-6 text-lg text-zinc-200 text-right font-bold">
                                ${cLimit.toLocaleString('es-CL')}
                              </td>
                              <td className={`p-5 py-6 text-lg text-right font-black ${cUsed > 0 ? 'text-rose-450' : 'text-zinc-450'}`}>
                                ${cUsed.toLocaleString('es-CL')}
                              </td>
                              <td className="p-5 py-6 text-lg text-emerald-400 text-right font-black">
                                ${cAvailable.toLocaleString('es-CL')}
                              </td>
                              <td className="p-5 py-6 text-right">
                                <button
                                  onClick={() => handleOpenEdit(c)}
                                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-white text-sm font-bold transition-all inline-flex items-center gap-1.5 shadow-sm select-none"
                                >
                                  Asignar Crédito
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                {customersMeta && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                      Mostrando {tableCustomers.length} de {customersMeta.total} clientes (Página {customersMeta.page} de {customersMeta.totalPages})
                    </p>
                    {customersMeta.totalPages > 1 && (
                      <div className="flex gap-2">
                        <button 
                          disabled={customerPage === 1}
                          onClick={() => setCustomerPage(p => p - 1)}
                          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 disabled:opacity-50 hover:text-white transition-all select-none"
                        >
                          Anterior
                        </button>
                        <button 
                          disabled={customerPage === customersMeta.totalPages}
                          onClick={() => setCustomerPage(p => p + 1)}
                          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 disabled:opacity-50 hover:text-white transition-all select-none"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Adjust Credit Modal */}
        {editingCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setEditingCompany(null)}
            />
            <div className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-left space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">Asignar / Ajustar Crédito B2B</h3>
                <p className="text-xs text-zinc-450 font-semibold truncate">{editingCompany.razonSocial}</p>
                {editingCompany.rut && (
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{editingCompany.rut}</p>
                )}
              </div>

              <div className="space-y-4">
                {/* Credit Limit Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Cupo Autorizado ($ CLP)</label>
                  <input
                    type="number"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none font-bold"
                  />
                </div>

                {/* Credit Used Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Crédito Utilizado / Deuda ($ CLP)</label>
                  <input
                    type="number"
                    value={newCreditUsed}
                    onChange={(e) => setNewCreditUsed(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingCompany(null)}
                  disabled={isSavingCredit}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCredit}
                  disabled={isSavingCredit}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-95 text-xs font-bold transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingCredit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
