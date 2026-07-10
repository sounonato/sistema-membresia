import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Ministerio } from "@/lib/api";

export function useMinisterios() {
  return useQuery<Ministerio[]>({
    queryKey: ["ministerios"],
    queryFn: () => api.getMinisterios(),
  });
}

export function useMinisterio(id: string) {
  return useQuery<Ministerio>({
    queryKey: ["ministerios", id],
    queryFn: () => api.getMinisterio(id),
    enabled: !!id,
  });
}

export function useCriarMinisterio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Ministerio>) => api.createMinisterio(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ministerios"] }),
  });
}

export function useEditarMinisterio(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Ministerio>) => api.updateMinisterio(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ministerios"] });
      qc.invalidateQueries({ queryKey: ["ministerios", id] });
    },
  });
}

export function useExcluirMinisterio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMinisterio(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ministerios"] }),
  });
}