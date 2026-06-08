/**
 * app/api/shipping/regions/route.ts
 * 
 * Endpoint para obtener la lista de regiones y comunas de Chile.
 * Útil para poblar dropdowns en el checkout.
 */

import { withApiHandler, ok } from "@/lib/api-handler";
import { CHILE_REGIONS } from "@/lib/chile-data";

export const GET = withApiHandler(async () => {
  return ok(CHILE_REGIONS);
});
