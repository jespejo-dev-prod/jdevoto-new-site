'use client';

import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from '@/components/dashboard/views/admin-dashboard';
import { CompanyAdminDashboard } from '@/components/dashboard/views/company-admin-dashboard';
import { BuyerDashboard } from '@/components/dashboard/views/buyer-dashboard';

export default function DashboardPage() {
 const { user, loading } = useAuth();

 if (loading || !user) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <Loader2 className="w-8 h-8 text-primary animate-spin" />
 </div>
 );
 }

 return (
 <div className="py-8 px-4 sm:px-8 w-full max-w-none space-y-8">
 {user.role === 'ADMIN' || user.role === 'SALES_REP' ? (
 <AdminDashboard />
 ) : user.role === 'COMPANY_ADMIN' ? (
 <CompanyAdminDashboard />
 ) : (
 <BuyerDashboard />
 )}
 </div>
 );
}
