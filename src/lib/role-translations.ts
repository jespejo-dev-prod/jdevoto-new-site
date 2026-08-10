export const ROLE_TRANSLATIONS: Record<string, string> = {
  SUPER_ADMIN: "Super Administrador",
  ADMIN: "Administrador del sistema",
  SALES_REP: "Vendedor",
  COMPANY_ADMIN: "Administrador empresa",
  BUYER: "Comprador",
};

export function translateRole(role: string | null | undefined): string {
  if (!role) return "Desconocido";
  return ROLE_TRANSLATIONS[role] || role;
}
