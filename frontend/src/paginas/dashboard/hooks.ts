import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type DashboardStats = {
  total_convertidos?: number;
  grupos_ativos?: number;
  batizados?: number;
  aguardando_discipulado?: number;
  convertidos_por_mes?: { mes: string; quantidade: number }[];
  por_genero?: { genero: string; quantidade: number }[];
  por_faixa_etaria?: { faixa: string; quantidade: number; nomes: string[] }[];
};

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.getDashboardStats(),
  });
}