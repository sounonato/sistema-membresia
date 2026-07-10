import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { MembroForm } from "../MembroForm";
import { useCriarMembro } from "../hooks";

export function MembroNovoPage() {
  const navigate = useNavigate();
  const criar = useCriarMembro();

  return (
    <div className="text-stone-900">
      <PageHeader
        chapter="04"
        eyebrow="Pastoral · Cadastro"
        title="Novo membro"
        lede="Registrar formalmente um novo integrante da membresia."
      />
      <MembroForm
        loading={criar.isPending}
        onCancel={() => navigate({ to: "/membros" })}
        onSubmit={async (dados) => {
          try {
            const res = await criar.mutateAsync(dados);
            toast.success("Membro cadastrado!");
            const id = (res as { id?: string })?.id;
            if (id) navigate({ to: "/membros/$id", params: { id } });
            else navigate({ to: "/membros" });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao cadastrar membro");
          }
        }}
      />
    </div>
  );
}