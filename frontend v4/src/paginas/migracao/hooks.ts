import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useImportarMembros() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.importarMembros(formData),
  });
}
