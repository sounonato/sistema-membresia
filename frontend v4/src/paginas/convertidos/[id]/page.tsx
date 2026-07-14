import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Pencil, Trash2, ArrowLeft, Loader2, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api, podeEditar } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useConvertido, useDeleteConvertido } from "../hooks";
import { useCriarMembro } from "@/paginas/membros/hooks";
import { useDiscipuladores } from "@/paginas/discipuladores/hooks";

export function ConvertidoDetalhePage() {
  const { id } = useParams({ from: "/_auth/convertidos/$id/" });
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const qc = useQueryClient();
  const { data, isLoading } = useConvertido(id);
  const del = useDeleteConvertido();
  const criarMembro = useCriarMembro();
  const { data: discipuladores } = useDiscipuladores();

  const [selectedDiscId, setSelectedDiscId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.discipulador_id) {
      setSelectedDiscId(data.discipulador_id);
    } else {
      setSelectedDiscId("");
    }
  }, [data?.discipulador_id]);

  if (isLoading || !data) {
    return (
      <div className="grid place-content-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const ativosDiscipuladores = (discipuladores ?? []).filter(d => d.ativo !== false);

  async function onSalvarResponsavel() {
    setSaving(true);
    try {
      await api.atribuirResponsavel(id, selectedDiscId || null);
      toast.success("Responsável atualizado");
      qc.invalidateQueries({ queryKey: ["convertidos", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function onRemoverResponsavel() {
    if (!window.confirm("Deseja remover o discipulador responsável?")) return;
    setSaving(true);
    try {
      await api.atribuirResponsavel(id, null);
      toast.success("Responsável removido");
      setSelectedDiscId("");
      qc.invalidateQueries({ queryKey: ["convertidos", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setSaving(false);
    }
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
                className="rounded-xl border-primary text-primary hover:bg-primary/10"
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

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-primary">Responsável pelo discipulado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5 max-w-md">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Discipulador responsável</label>
            <select
              value={selectedDiscId}
              onChange={(e) => setSelectedDiscId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:border-primary focus:outline-none"
              disabled={!editor || saving}
            >
              <option value="">Sem responsável atribuído</option>
              {ativosDiscipuladores.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} {d.email ? `(${d.email})` : ""}
                </option>
              ))}
            </select>
          </div>
          {editor && (
            <div className="flex gap-2">
              <Button
                onClick={onSalvarResponsavel}
                disabled={saving}
                size="sm"
                className="rounded-xl"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar responsável
              </Button>
              {data.discipulador_id && (
                <Button
                  variant="outline"
                  onClick={onRemoverResponsavel}
                  disabled={saving}
                  size="sm"
                  className="rounded-xl border-destructive text-destructive hover:bg-destructive/5"
                >
                  Remover responsável
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
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