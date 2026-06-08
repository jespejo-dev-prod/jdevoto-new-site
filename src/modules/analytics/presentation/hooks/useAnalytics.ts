import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";

export function useAnalytics() {
  const { fetcher } = useApi();

  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetcher("/api/analytics"),
    staleTime: 1000 * 60 * 5, // 5 minutos de caché para analítica
  });
}
