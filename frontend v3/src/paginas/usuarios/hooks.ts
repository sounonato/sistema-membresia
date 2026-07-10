import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Perfil, type Usuario } from "@/lib/api";

export function useUsuarios() {
  return useQuery<Usuario[]>({ queryKey: ["usuarios"], queryFn: () => api.getUsuarios() });
}
export function useCreateUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: { nome: string; email: string; senha: string; perfil: Perfil }) =>
      api.createUsuario(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}
export function useToggleUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.toggleUsuario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}