'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useCustomers } from '@/modules/customers/presentation/hooks/useCustomers';
import { Building2, Search, Calendar, Filter } from 'lucide-react';

export default function FacturasFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const currentCompanyId = searchParams.get('companyId') || 'ALL';
  const currentFrom = searchParams.get('from') || '';
  const currentTo = searchParams.get('to') || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [companyId, setCompanyId] = useState(currentCompanyId);
  const [fromDate, setFromDate] = useState(currentFrom);
  const [toDate, setToDate] = useState(currentTo);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: companiesList } = useCustomers({ 
    limit: 100, 
    search: debouncedSearch 
  });
  
  const companies = (companiesList || []).filter((c: any) => c.razonSocial && c.razonSocial.trim() !== '');

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (companyId && companyId !== 'ALL') params.set('companyId', companyId);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);

    router.push(`/dashboard/facturas?${params.toString()}`);
  };

  const isAdminOrSales = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'SALES_REP';

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 w-full xl:w-auto">
      
      {isAdminOrSales && (
        <>
          <div className="relative w-full sm:w-48 xl:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="relative w-full sm:w-48 xl:w-56">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer hover:bg-zinc-900 transition-colors truncate"
            >
              <option value="ALL">Todas las empresas</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.razonSocial}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-zinc-500 hidden sm:block" />
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
            title="Fecha inicio"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-zinc-500 text-sm hidden sm:block">-</span>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
            title="Fecha fin"
          />
        </div>
      </div>

      <button 
        onClick={handleApplyFilters}
        className="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-zinc-700"
      >
        <Filter className="w-4 h-4" />
        Filtrar
      </button>

    </div>
  );
}
