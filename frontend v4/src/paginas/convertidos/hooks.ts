import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Convertido = {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  estado_civil?: string;
  genero?: string;
  profissao?: string;
  tem_filhos?: boolean;
  qtd_filhos?: number;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  data_conversao: string;
  como_conheceu?: string;
  batizado?: boolean;
  quer_batizar?: boolean;
  frequentava_outra_igreja?: boolean;
  qual_igreja?: string;
  fez_discipulado?: boolean;
  observacoes?: string;
  status?: string;
  discipulador_id?: string | null;
};

export function useConvertidos() {
  return useQuery<Convertido[]>({
    queryKey: ["convertidos"],
    queryFn: () => api.getConvertidos(),
  });
}

export function useConvertido(id: string) {
  return useQuery<Convertido>({
    queryKey: ["convertidos", id],
    queryFn: () => api.getConvertido(id),
    enabled: !!id,
  });
}

export function useDeleteConvertido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteConvertido(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["convertidos"] }),
  });
}

export function useCreateConvertido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Convertido>) => api.createConvertido(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["convertidos"] }),
  });
}

export function useUpdateConvertido(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Convertido>) => api.updateConvertido(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["convertidos"] });
      qc.invalidateQueries({ queryKey: ["convertidos", id] });
    },
  });
}