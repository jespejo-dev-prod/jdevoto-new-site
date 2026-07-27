"use client";
import { useAuth } from "@/context/auth-context";

export function AuthRender({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  return <>{children}</>;
}
