'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useCustomers } from '@/modules/customers/presentation/hooks/useCustomers';
import { Building2, Search } from 'lucide-react';

interface CompanyFilterProps {
  basePath: string;
}

export function CompanyFilter({ basePath }: CompanyFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const currentCompanyId = searchParams.get('companyId') || 'ALL';
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    
    // Preserve other search params if necessary, but here we just append companyId
    const currentUrlParams = new URLSearchParams(Array.from(searchParams.entries()));
    
    if (val === 'ALL') {
      currentUrlParams.delete('companyId');
    } else {
      currentUrlParams.set('companyId', val);
    }
    
    const searchString = currentUrlParams.toString();
    const newUrl = searchString ? `${basePath}?${searchString}` : basePath;
    router.push(newUrl);
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'SALES_REP') {
    return null; // Comprador or Company Admin don't need this filter
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Buscar empresa..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <select
          value={currentCompanyId}
          onChange={handleChange}
          className="w-full pl-9 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer hover:bg-zinc-900 transition-colors truncate"
        >
          <option value="ALL">Todas las empresas</option>
          {companies.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.razonSocial} {c.rut ? `(${c.rut})` : ''}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  );
}
