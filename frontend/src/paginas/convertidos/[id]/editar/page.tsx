import { useNavigate, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConvertidoForm } from "../../ConvertidoForm";
import { useConvertido, useUpdateConvertido } from "../../hooks";

export function EditarConvertidoPage() {
  const { id } = useParams({ from: "/_auth/convertidos/$id/editar" });
  const navigate = useNavigate();
  const { data, isLoading } = useConvertido(id);
  const upd = useUpdateConvertido(id);

  if (isLoading || !data) {
    return (
      <div className="grid place-content-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-primary">Editar Convertido</h1>
        <p className="text-sm text-muted-foreground">{data.nome}</p>
      </header>
      <ConvertidoForm
        initial={data}
        submitting={upd.isPending}
        submitLabel="Salvar alterações"
        onCancel={() => navigate({ to: "/convertidos/$id", params: { id } })}
        onSubmit={async (form) => {
          try {
            await upd.mutateAsync(form);
            toast.success("Atualizado");
            navigate({ to: "/convertidos/$id", params: { id } });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao salvar");
          }
        }}
      />
    </div>
  );
}