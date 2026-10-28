'use client';

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function TestProductGuard({ sku }: { sku: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (sku === 'TEST-001' && !loading) {
      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        router.replace('/products');
      }
    }
  }, [sku, user, loading, router]);

  if (sku === 'TEST-001' && !loading && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6 text-center">
        <div className="space-y-4 max-w-md">
          <h1 className="text-2xl font-black text-zinc-900 uppercase">Producto no disponible</h1>
          <p className="text-sm font-medium text-zinc-500">Este producto de prueba está reservado únicamente para administradores.</p>
        </div>
      </div>
    );
  }

  return null;
}
