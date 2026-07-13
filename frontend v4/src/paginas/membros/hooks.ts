import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Membro, type MembrosStats } from "@/lib/api";

type MembrosPage = {
  data: Membro[];
  total: number;
  pagina: number;
  paginas: number;
  por_pagina: number;
};

export function useMembros(params?: {
  status?: string;
  busca?: string;
  ministerio_id?: string;
  pagina?: number;
  por_pagina?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "__todos") query.set("status", params.status);
  if (params?.busca && params.busca.trim()) query.set("busca", params.busca.trim());
  if (params?.ministerio_id && params.ministerio_id !== "__todos")
    query.set("ministerio_id", params.ministerio_id);
  query.set("pagina", String(params?.pagina ?? 1));
  query.set("por_pagina", String(params?.por_pagina ?? 50));
  return useQuery<MembrosPage>({
    queryKey: ["membros", params],
    queryFn: () => api.getMembros(`?${query.toString()}`),
  });
}

export function useMembro(id: string) {
  return useQuery<Membro>({
    queryKey: ["membros", id],
    queryFn: () => api.getMembro(id),
    enabled: !!id,
  });
}

export function useMembrosStats() {
  return useQuery<MembrosStats>({
    queryKey: ["membros-stats"],
    queryFn: () => api.getMembrosStats(),
  });
}

export function useMembrosSemContato(dias: number = 60) {
  return useQuery<Membro[]>({
    queryKey: ["membros-sem-contato", dias],
    queryFn: () => api.getMembrosSemContato(dias),
  });
}

export function useCriarMembro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Membro>) => api.createMembro(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros"] }),
  });
}

export function useEditarMembro(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Membro>) => api.updateMembro(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membros"] });
      qc.invalidateQueries({ queryKey: ["membros", id] });
    },
  });
}

export function useExcluirMembro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMembro(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros"] }),
  });
}

export function useViHoje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.viHoje(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["membros"] });
      qc.invalidateQueries({ queryKey: ["membros", id] });
      qc.invalidateQueries({ queryKey: ["membros-sem-contato"] });
    },
  });
}

export function useEnviarWhatsapp() {
  return useMutation({
    mutationFn: (id: string) => api.enviarWhatsapp(id),
  });
}

export function useAddMembroMinisterio(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ministerio_id: string; cargo?: string }) =>
      api.addMembroMinisterio(membroId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros", membroId] }),
  });
}

export function useRemoveMembroMinisterio(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ministerioId: string) =>
      api.removeMembroMinisterio(membroId, ministerioId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros", membroId] }),
  });
}

export function useAddCargo(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      cargo: string;
      data_posse?: string;
      observacoes?: string;
    }) => api.addCargo(membroId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros", membroId] }),
  });
}

export function useEncerrarCargo(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cargoId,
      data,
    }: {
      cargoId: string;
      data: { data_fim?: string };
    }) => api.encerrarCargo(membroId, cargoId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros", membroId] }),
  });
}

export function useCriarAcessoMembro(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; senha: string; perfil: string }) =>
      api.criarAcessoMembro(membroId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membros", membroId] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useRevogarAcessoMembro(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.revogarAcessoMembro(membroId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membros", membroId] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useAlterarPerfilUsuario(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ usuarioId, perfil }: { usuarioId: string; perfil: string }) =>
      api.alterarPerfilUsuario(usuarioId, perfil),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membros", membroId] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}