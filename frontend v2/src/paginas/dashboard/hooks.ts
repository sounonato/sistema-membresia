import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type DashboardStats = {
  total_convertidos?: number;
  grupos_ativos?: number;
  batizados?: number;
  aguardando_discipulado?: number;
  por_mes?: { mes: string; total: number }[];
  por_genero?: { genero: string; total: number }[];
};

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.getDashboardStats(),
  });
}