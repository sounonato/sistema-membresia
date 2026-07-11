import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Grupo = {
  id: string;
  nome: string;
  discipulador?: string;
  discipulador_id?: string;
  discipulador_nome?: string;
  modulo?: string;
  modulo_id?: string;
  modulo_nome?: string;
  data_inicio?: string;
  status?: string;
  qtd_membros?: number;
  membros?: { id: string; nome: string }[];
};

export type Aula = {
  id?: string;
  numero: number;
  data: string;
  concluida: boolean;
  observacoes?: string;
};

export function useGrupos() {
  return useQuery<Grupo[]>({ queryKey: ["grupos"], queryFn: () => api.getGrupos() });
}

export function useGrupo(id: string) {
  return useQuery<Grupo>({
    queryKey: ["grupos", id],
    queryFn: () => api.getGrupo(id),
    enabled: !!id,
  });
}

export function useProgresso(grupoId: string) {
  return useQuery<Aula[]>({
    queryKey: ["grupos", grupoId, "progresso"],
    queryFn: () => api.getProgresso(grupoId),
    enabled: !!grupoId,
  });
}

export function useCreateGrupo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Grupo>) => api.createGrupo(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grupos"] }),
  });
}

export function useAddMembro(grupoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (convertidoId: string) => api.addMembro(grupoId, convertidoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grupos", grupoId] }),
  });
}

export function useRemoveMembro(grupoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (convertidoId: string) => api.removeMembro(grupoId, convertidoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grupos", grupoId] }),
  });
}

export function useAddProgresso(grupoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Aula>) => api.addProgresso(grupoId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grupos", grupoId, "progresso"] }),
  });
}