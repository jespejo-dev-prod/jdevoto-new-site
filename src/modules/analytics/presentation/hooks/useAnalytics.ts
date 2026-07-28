import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/infrastructure/api/use-api";

export function useAnalytics(
  period: '30d' | '60d' | '90d' | '120d' | 'all' | 'custom' = 'all',
  startDate?: string,
  endDate?: string
) {
  const { fetcher } = useApi();

  return useQuery({
    queryKey: ["analytics", period, startDate, endDate],
    queryFn: () => {
      let url = `/api/analytics?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      return fetcher(url);
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de caché para analítica
  });
}
