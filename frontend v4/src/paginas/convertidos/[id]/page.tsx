import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Pencil, Trash2, ArrowLeft, Loader2, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar } from "@/lib/api";
import { useConvertido, useDeleteConvertido } from "../hooks";
import { useCriarMembro } from "@/paginas/membros/hooks";

export function ConvertidoDetalhePage() {
  const { id } = useParams({ from: "/_auth/convertidos/$id/" });
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const { data, isLoading } = useConvertido(id);
  const del = useDeleteConvertido();
  const criarMembro = useCriarMembro();

  if (isLoading || !data) {
    return (
      <div className="grid place-content-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  async function onPromover() {
    if (!data) return;
    if (!window.confirm(`Promover "${data.nome}" a membro? Um registro de membro será criado com os dados deste convertido.`)) return;
    try {
      await criarMembro.mutateAsync({
        nome: data.nome,
        telefone: data.telefone,
        email: data.email ?? undefined,
        data_nascimento: data.data_nascimento ?? undefined,
        genero: (data.genero as "masculino" | "feminino" | "outro") ?? undefined,
        estado_civil: (data.estado_civil as "solteiro" | "casado" | "divorciado" | "viuvo" | "uniao_estavel") ?? undefined,
        profissao: data.profissao ?? undefined,
        endereco: data.endereco ?? undefined,
        bairro: data.bairro ?? undefined,
        cidade: data.cidade ?? undefined,
        data_entrada: new Date().toISOString().split("T")[0],
        convertido_id: data.id,
      });
      toast.success(`${data.nome} foi promovido a membro!`);
      navigate({ to: "/membros" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao promover");
    }
  }

  async function onExcluir() {
    if (!window.confirm(`Excluir convertido "${data?.nome}"?`)) return;
    try {
      await del.mutateAsync(id);
      toast.success("Excluído");
      navigate({ to: "/convertidos" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/convertidos"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="font-serif text-3xl text-primary">{data.nome}</h1>
            <p className="text-sm text-muted-foreground">Detalhes do convertido</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/convertidos/$id/jornada" params={{ id }}>
              <Sparkles className="h-4 w-4" /> Ver jornada
            </Link>
          </Button>
          {editor && (
            <>
              <Button
                variant="outline"
                className="rounded-xl border-amber-600 text-amber-700 hover:bg-amber-50"
                onClick={onPromover}
                disabled={criarMembro.isPending}
              >
                {criarMembro.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <UserCheck className="h-4 w-4" />
                }
                Promover a membro
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/convertidos/$id/editar" params={{ id }}>
                  <Pencil className="h-4 w-4" /> Editar
                </Link>
              </Button>
              <Button variant="destructive" className="rounded-xl" onClick={onExcluir} disabled={del.isPending}>
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </>
          )}
        </div>
      </div>

      <Section title="Dados Pessoais">
        <Info label="Nome" value={data.nome} />
        <Info label="Telefone" value={data.telefone} />
        <Info label="E-mail" value={data.email} />
        <Info label="Nascimento" value={fmt(data.data_nascimento)} />
        <Info label="Estado civil" value={data.estado_civil} />
        <Info label="Gênero" value={data.genero} />
        <Info label="Profissão" value={data.profissao} />
        <Info label="Filhos" value={data.tem_filhos ? `Sim (${data.qtd_filhos ?? 0})` : "Não"} />
      </Section>

      <Section title="Endereço">
        <Info label="Endereço" value={data.endereco} />
        <Info label="Bairro" value={data.bairro} />
        <Info label="Cidade" value={data.cidade} />
      </Section>

      <Section title="Informações da Conversão">
        <Info label="Data da conversão" value={fmt(data.data_conversao)} />
        <Info label="Como conheceu" value={data.como_conheceu} />
      </Section>

      <Section title="Informações de Fé">
        <Info label="Batizado" value={data.batizado ? "Sim" : "Não"} />
        <Info label="Quer se batizar" value={data.quer_batizar ? "Sim" : "Não"} />
        <Info
          label="Outra igreja"
          value={data.frequentava_outra_igreja ? data.qual_igreja || "Sim" : "Não"}
        />
        <Info label="Já fez discipulado" value={data.fez_discipulado ? "Sim" : "Não"} />
        <Info label="Observações" value={data.observacoes} full />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="font-serif text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</CardContent>
    </Card>
  );
}

function Info({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{value || "—"}</p>
    </div>
  );
}

function fmt(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("pt-BR");
}