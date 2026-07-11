import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Discipulador = {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  qtd_grupos?: number;
  ativo?: boolean;
};

export function useDiscipuladores() {
  return useQuery<Discipulador[]>({ queryKey: ["discipuladores"], queryFn: () => api.getDiscipuladores() });
}

export function useCreateDiscipulador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Discipulador>) => api.createDiscipulador(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discipuladores"] }),
  });
}
export function useUpdateDiscipulador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Discipulador> }) =>
      api.updateDiscipulador(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discipuladores"] }),
  });
}
export function useDeleteDiscipulador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDiscipulador(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discipuladores"] }),
  });
}