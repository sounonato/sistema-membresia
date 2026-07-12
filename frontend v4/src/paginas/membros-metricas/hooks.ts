import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMembrosMetricas() {
  return useQuery({
    queryKey: ["membros-metricas"],
    queryFn: () => api.getMembrosMetricas(),
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
}
