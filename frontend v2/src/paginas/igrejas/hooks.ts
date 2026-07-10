import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Igreja } from "@/lib/api";

export function useIgrejas() {
  return useQuery<Igreja[]>({ queryKey: ["igrejas"], queryFn: () => api.getIgrejas() });
}
export function useCreateIgreja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: { nome: string; slug: string }) => api.createIgreja(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["igrejas"] }),
  });
}
export function useUpdateIgreja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Igreja> }) =>
      api.updateIgreja(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["igrejas"] }),
  });
}
export function useUploadLogoIgreja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => api.uploadLogoIgreja(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["igrejas"] }),
  });
}
export function useDeleteIgreja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteIgreja(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["igrejas"] }),
  });
}
export function useCreateAdminIgreja() {
  return useMutation({
    mutationFn: ({ igrejaId, data }: { igrejaId: string; data: { nome: string; email: string; senha: string } }) =>
      api.createAdminIgreja(igrejaId, data),
  });
}