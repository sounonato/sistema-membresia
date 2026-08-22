import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Pencil, Sparkles, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api, podeEditar } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
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

  const [selectedDiscId, setSelectedDiscId] = useState("");
  const [situacao, setSituacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingSituacao, setSavingSituacao] = useState(false);

  useEffect(() => {
    if (data?.discipulador_id) {
      setSelectedDiscId(data.discipulador_id);
    } else {
      setSelectedDiscId("");
    }
    setSituacao(((data as Record<string, unknown>)?.situacao as string) ?? "");
  }, [data?.discipulador_id, data]);

  const idade = useMemo(() => {
    if (!data?.data_nascimento) return null;
    const nasc = new Date(data.data_nascimento);
    if (isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let anos = hoje.getFullYear() - nasc.getFullYear();
    if (
      hoje.getMonth() < nasc.getMonth() ||
      (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())
    ) {
      anos--;
    }
    return anos;
  }, [data?.data_nascimento]);

  const ativosDiscipuladores = (discipuladores ?? []).filter((d) => d.ativo !== false);
  const statusTone = situacaoTone(situacao);

  if (isLoading || !data) {
    return (
      <div className="grid place-content-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

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

  async function onSalvarSituacao() {
    setSavingSituacao(true);
    try {
      await api.updateConvertido(id, { situacao });
      toast.success("Situação atualizada");
      qc.invalidateQueries({ queryKey: ["convertidos", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingSituacao(false);
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
    if (
      !window.confirm(
        `Promover "${data.nome}" a membro? Um registro de membro será criado com os dados deste convertido.`,
      )
    )
      return;
    try {
      await criarMembro.mutateAsync({
        nome: data.nome,
        telefone: data.telefone,
        email: data.email ?? undefined,
        data_nascimento: data.data_nascimento ?? undefined,
        genero: (data.genero as "masculino" | "feminino" | "outro") ?? undefined,
        estado_civil:
          (data.estado_civil as "solteiro" | "casado" | "divorciado" | "viuvo" | "uniao_estavel") ??
          undefined,
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
    <div className="space-y-8 text-foreground">
      <PageHeader
        chapter="03"
        eyebrow="Discipulado"
        title={data.nome}
        lede={data.email || data.telefone || "Detalhe operacional do convertido"}
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button asChild variant="outline" className="h-11 gap-2 rounded-none border-border">
              <Link to="/convertidos/$id/jornada" params={{ id }}>
                <Sparkles className="h-4 w-4" />
                Jornada
              </Link>
            </Button>
            {editor && (
              <>
                <Button
                  variant="outline"
                  className="h-11 gap-2 rounded-none border-primary text-primary hover:bg-primary/10"
                  onClick={onPromover}
                  disabled={criarMembro.isPending}
                >
                  {criarMembro.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                  Promover
                </Button>
                <Button asChild variant="outline" className="h-11 gap-2 rounded-none border-border">
                  <Link to="/convertidos/$id/editar" params={{ id }}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-11 gap-2 rounded-none border-red-200 text-red-700 hover:bg-red-50"
                  onClick={onExcluir}
                  disabled={del.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Situação" value={situacaoLabel(situacao)} tone={statusTone} />
        <SummaryCard
          label="Responsável"
          value={data.discipulador_id ? "Atribuído" : "Sem responsável"}
          helper={
            data.discipulador_id ? "Acompanhamento ativo" : "Ainda não vinculado a discipulador"
          }
        />
        <SummaryCard label="Idade" value={idade !== null ? `${idade}` : "—"} helper="Anos" />
        <SummaryCard
          label="Conversão"
          value={formatDate(data.data_conversao)}
          helper="Data do registro"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="space-y-4">
          <InfoCard title="Dados pessoais">
            <InfoRow label="Nome" value={data.nome} />
            <InfoRow label="Telefone" value={data.telefone} />
            <InfoRow label="E-mail" value={data.email} />
            <InfoRow label="Nascimento" value={formatDate(data.data_nascimento)} />
            <InfoRow label="Idade" value={idade !== null ? `${idade} anos` : "—"} />
            <InfoRow label="Estado civil" value={data.estado_civil} />
            <InfoRow label="Gênero" value={data.genero} />
            <InfoRow label="Profissão" value={data.profissao} />
            <InfoRow
              label="Filhos"
              value={data.tem_filhos ? `Sim (${data.qtd_filhos ?? 0})` : "Não"}
            />
          </InfoCard>

          <InfoCard title="Endereço">
            <InfoRow label="Endereço" value={data.endereco} />
            <InfoRow label="Bairro" value={data.bairro} />
            <InfoRow label="Cidade" value={data.cidade} />
          </InfoCard>

          <InfoCard title="Conversão">
            <InfoRow label="Data da conversão" value={formatDate(data.data_conversao)} />
            <InfoRow label="Culto de conversão" value={formatCulto(data.culto_conversao)} />
            <InfoRow label="Como conheceu" value={data.como_conheceu} full />
          </InfoCard>

          <InfoCard title="Informações de fé">
            <InfoRow label="Batizado" value={data.batizado ? "Sim" : "Não"} />
            <InfoRow label="Quer se batizar" value={data.quer_batizar ? "Sim" : "Não"} />
            <InfoRow
              label="Outra igreja"
              value={data.frequentava_outra_igreja ? data.qual_igreja || "Sim" : "Não"}
            />
            <InfoRow label="Já fez discipulado" value={data.fez_discipulado ? "Sim" : "Não"} />
            <InfoRow label="Observações" value={data.observacoes} full />
          </InfoCard>
        </div>

        <div className="space-y-4">
          <Card className="border-border rounded-none">
            <div className="border-b border-border px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Situação atual
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Acompanhamento</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Status de acompanhamento
                </Label>
                <Select value={situacao} onValueChange={setSituacao}>
                  <SelectTrigger className="h-11 rounded-none border-border bg-background">
                    <SelectValue placeholder="Sem status definido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem status definido</SelectItem>
                    <SelectItem value="frequentando">Frequentando</SelectItem>
                    <SelectItem value="membro">Membro</SelectItem>
                    <SelectItem value="nao_frequenta">Não está mais frequentando</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editor && (
                <Button
                  onClick={onSalvarSituacao}
                  disabled={savingSituacao}
                  className="h-11 w-full rounded-none bg-primary text-primary-foreground hover:opacity-90"
                >
                  {savingSituacao && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar situação
                </Button>
              )}
            </div>
          </Card>

          <Card className="border-border rounded-none">
            <div className="border-b border-border px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Responsável
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                Discipulador(a) responsável
              </h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Atribuição
                </Label>
                <Select value={selectedDiscId} onValueChange={setSelectedDiscId}>
                  <SelectTrigger className="h-11 rounded-none border-border bg-background">
                    <SelectValue placeholder="Sem responsável atribuído" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem responsável atribuído</SelectItem>
                    {ativosDiscipuladores.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nome} {d.email ? `(${d.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editor && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={onSalvarResponsavel}
                    disabled={saving}
                    className="h-11 rounded-none bg-primary text-primary-foreground hover:opacity-90"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar responsável
                  </Button>
                  {data.discipulador_id && (
                    <Button
                      variant="outline"
                      onClick={onRemoverResponsavel}
                      disabled={saving}
                      className="h-11 rounded-none border-border text-foreground hover:bg-muted"
                    >
                      Remover
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-none border-border">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">{children}</div>
    </Card>
  );
}

function InfoRow({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={cn(full && "md:col-span-2")}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-6 text-foreground whitespace-pre-wrap">{value || "—"}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "success" | "warning" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "muted"
          ? "border-border bg-muted text-muted-foreground"
          : "border-border bg-card text-foreground";

  return (
    <section className={cn("border p-4", toneClass)}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold leading-tight">{value}</p>
      {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
    </section>
  );
}

function situacaoLabel(value: string) {
  if (!value) return "Sem status";
  if (value === "frequentando") return "Frequentando";
  if (value === "membro") return "Membro";
  if (value === "nao_frequenta") return "Não está mais frequentando";
  return value;
}

function formatCulto(culto?: string) {
  if (!culto) return null;
  const mapa: Record<string, string> = {
    domingo: "Domingo",
    culto_oracao: "Culto de oração",
    overflow: "Over Flow",
    encontro_homens: "Encontro dos Homens de Honra",
    encontro_mulheres: "Encontro das Mulheres",
    culto_jni: "Culto de JNI",
    evangelismo: "Evangelismo",
    outro: "Outro",
  };
  return mapa[culto.toLowerCase()] || culto;
}

function situacaoTone(value: string) {
  if (value === "membro") return "success";
  if (value === "frequentando") return "warning";
  return "muted";
}

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("pt-BR");
}
