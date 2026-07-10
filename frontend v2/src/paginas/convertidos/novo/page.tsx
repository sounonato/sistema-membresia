import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ConvertidoForm } from "../ConvertidoForm";
import { useCreateConvertido } from "../hooks";

export function NovoConvertidoPage() {
  const navigate = useNavigate();
  const create = useCreateConvertido();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-primary">Novo Convertido</h1>
        <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
      </header>
      <ConvertidoForm
        submitting={create.isPending}
        submitLabel="Cadastrar"
        onCancel={() => navigate({ to: "/convertidos" })}
        onSubmit={async (data) => {
          try {
            await create.mutateAsync(data);
            toast.success("Convertido cadastrado");
            navigate({ to: "/convertidos" });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao cadastrar");
          }
        }}
      />
    </div>
  );
}