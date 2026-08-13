'use client';

import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export function AdminEditButton({ productId }: { productId: string }) {
  const { user } = useAuth();
  
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") return null;

  return (
    <Link
      href={`/dashboard/products/${productId}/edit`}
      className="shrink-0"
    >
      <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95 hover:scale-[1.02]">
        <Pencil className="h-3.5 w-3.5 text-white" />
        Editar Producto
      </Button>
    </Link>
  );
}
