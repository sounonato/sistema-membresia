import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Modulo = {
  id: string;
  nome: string;
  descricao?: string;
  total_aulas?: number;
  ordem?: number;
};

export function useModulos() {
  return useQuery<Modulo[]>({ queryKey: ["modulos"], queryFn: () => api.getModulos() });
}
export function useCreateModulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Modulo>) => api.createModulo(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modulos"] }),
  });
}
export function useUpdateModulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Modulo> }) =>
      api.updateModulo(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modulos"] }),
  });
}
export function useDeleteModulo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteModulo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modulos"] }),
  });
}