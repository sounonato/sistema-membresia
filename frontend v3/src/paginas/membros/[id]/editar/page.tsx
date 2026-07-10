import { useNavigate, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { MembroForm } from "../../MembroForm";
import { useMembro, useEditarMembro } from "../../hooks";

export function MembroEditarPage() {
  const { id } = useParams({ from: "/_auth/membros/$id/editar" });
  const navigate = useNavigate();
  const { data, isLoading } = useMembro(id);
  const editar = useEditarMembro(id);

  if (isLoading || !data)
    return <Loader2 className="h-6 w-6 animate-spin mx-auto my-16 text-stone-400" />;

  return (
    <div className="text-stone-900">
      <PageHeader
        chapter="04"
        eyebrow="Pastoral · Cadastro"
        title={`Editar ${data.nome}`}
        lede="Atualizar informações da membresia."
      />
      <MembroForm
        initial={data}
        submitLabel="Salvar alterações"
        showStatusSection
        loading={editar.isPending}
        onCancel={() => navigate({ to: "/membros/$id", params: { id } })}
        onSubmit={async (dados) => {
          try {
            await editar.mutateAsync(dados);
            toast.success("Membro atualizado!");
            navigate({ to: "/membros/$id", params: { id } });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao atualizar");
          }
        }}
      />
    </div>
  );
}