import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Eye,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar, type Membro } from "@/lib/api";
import { useExcluirMembro, useMembros, useMembrosSemContato, useMembrosStats } from "./hooks";
import { useMinisterios } from "@/paginas/ministerios/hooks";

const STATUS_STYLES: Record<string, string> = {
  ativo: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  inativo: "border-border bg-muted text-muted-foreground",
  transferido: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  falecido: "border-border bg-muted text-muted-foreground",
  excluido: "border-border bg-muted text-muted-foreground",
};

function formatNumber(value?: number) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em]",
        STATUS_STYLES[status] ?? STATUS_STYLES.inativo,
      )}
    >
      {status}
    </Badge>
  );
}

function ContatoCell({ m }: { m: Membro }) {
  const dias = m.dias_sem_contato ?? 0;
  if (dias > 90) {
    return (
      <Badge className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-destructive">
        {dias} dias
      </Badge>
    );
  }
  if (dias > 60) {
    return (
      <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-primary">
        {dias} dias
      </Badge>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Clock3 className="h-3.5 w-3.5 text-primary" />
      {formatDate(m.ultimo_contato)}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  helper: string;
  tone?: "neutral" | "primary" | "emerald" | "amber";
}) {
  const toneClasses = {
    neutral: "bg-card",
    primary: "bg-primary/10",
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
  }[tone];

  return (
    <article className={`border border-border px-4 py-4 sm:px-5 ${toneClasses}`}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-[clamp(1.8rem,3vw,3rem)] font-semibold leading-none tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{helper}</p>
    </article>
  );
}

function AlertRow({ m }: { m: Membro }) {
  return (
    <div className="flex items-start gap-3 border-t border-border px-4 py-3 first:border-t-0">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-content-center border border-border bg-muted/50 text-primary">
        <ShieldAlert className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{m.nome}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {m.telefone ?? "Sem telefone"} · {m.dias_sem_contato ?? 0} dias sem contato
        </p>
      </div>
    </div>
  );
}

export function MembrosPage() {
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const isAdmin = usuario?.perfil === "admin";

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("__todos");
  const [ministerioId, setMinisterioId] = useState("__todos");
  const [pagina, setPagina] = useState(1);

  const { data: resultado, isLoading } = useMembros({
    busca,
    status,
    ministerio_id: ministerioId,
    pagina,
    por_pagina: 50,
  });
  const data = resultado?.data ?? [];
  const totalPaginas = resultado?.paginas ?? 1;
  const totalMembros = resultado?.total ?? data.length;
  const { data: ministerios } = useMinisterios();
  const { data: stats } = useMembrosStats();
  const { data: semContato } = useMembrosSemContato(60);
  const excluir = useExcluirMembro();

  const alertas = (semContato ?? []).slice(0, 4);
  const ministeriosAtivos = data.flatMap((m) => m.ministerios ?? []);
  const ministerioTopo = (() => {
    const contagem = new Map<string, number>();
    for (const item of ministeriosAtivos) {
      contagem.set(item.ministerio_nome, (contagem.get(item.ministerio_nome) ?? 0) + 1);
    }
    return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["Sem vínculo", 0];
  })();

  async function onExcluir(m: Membro) {
    if (!window.confirm(`Excluir "${m.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await excluir.mutateAsync(m.id);
      toast.success("Membro excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <div className="space-y-8 text-foreground">
      <PageHeader
        chapter="04"
        eyebrow="Pastoral · Cadastro"
        title="Membros"
        lede="Base operacional da membresia com foco em leitura rápida, vínculos e ação."
        actions={
          editor && (
            <Button asChild className="h-11 gap-2 rounded-none bg-primary text-primary-foreground">
              <Link to="/membros/novo">
                <Plus className="h-4 w-4" /> Novo membro
              </Link>
            </Button>
          )
        }
      />

      <section className="grid gap-px border border-border bg-border xl:grid-cols-[minmax(0,1.35fr)_24rem]">
        <div className="bg-card px-5 py-6 sm:px-6 sm:py-7">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              Base viva
            </span>
            <span className="inline-flex items-center gap-2 border border-border px-3 py-2">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              {formatNumber(stats?.ativos)} ativos
            </span>
          </div>

          <h1 className="mt-6 text-[clamp(2.2rem,4vw,4.5rem)] font-semibold leading-[0.95] tracking-tight text-foreground">
            Membros
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Acompanhe quem está na base, quem precisa de atenção e para onde o cuidado pastoral
            precisa ir agora.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              {formatNumber(stats?.total)} cadastrados
            </span>
            <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              {formatNumber(stats?.batizados)} batizados
            </span>
            <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              {formatNumber(stats?.sem_contato_60)} sem contato
            </span>
          </div>
        </div>

        <aside className="divide-y divide-border bg-muted/30">
          <MetricCard
            label="Total na base"
            value={formatNumber(stats?.total)}
            helper="Membros ativos e inativos cadastrados."
            tone="primary"
          />
          <MetricCard
            label="Membros ativos"
            value={formatNumber(stats?.ativos)}
            helper="Pessoas em comunhão."
            tone="emerald"
          />
          <MetricCard
            label="Batizados"
            value={formatNumber(stats?.batizados)}
            helper="Marco público já registrado."
            tone="neutral"
          />
          <MetricCard
            label="Sem contato"
            value={formatNumber(stats?.sem_contato_60)}
            helper="Janela de 60 dias sem retorno."
            tone="amber"
          />
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <section className="border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Lista operacional
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    <span className="text-foreground">{formatNumber(totalMembros)}</span> resultados
                  </span>
                  <span>
                    Página <span className="text-foreground">{pagina}</span> de {totalPaginas}
                  </span>
                  <span>
                    Maior vínculo:{" "}
                    <span className="text-foreground">
                      {ministerioTopo[0]} ({formatNumber(ministerioTopo[1])})
                    </span>
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 border border-border bg-muted/30 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Filtragem ativa
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px]">
              <label className="flex items-center gap-3 border border-border bg-background px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPagina(1);
                  }}
                  placeholder="Buscar por nome ou telefone"
                  className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </label>

              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPagina(1);
                }}
              >
                <SelectTrigger className="h-11 rounded-none border-border bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                  <SelectItem value="transferido">Transferidos</SelectItem>
                  <SelectItem value="falecido">Falecidos</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={ministerioId}
                onValueChange={(v) => {
                  setMinisterioId(v);
                  setPagina(1);
                }}
              >
                <SelectTrigger className="h-11 rounded-none border-border bg-background">
                  <SelectValue placeholder="Ministério" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos">Todos os ministérios</SelectItem>
                  {(ministerios ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {isLoading ? (
            <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-muted-foreground" />
          ) : data.length === 0 ? (
            <div className="border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum membro encontrado. Ajuste os filtros e tente novamente.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-normal">Nome</th>
                    <th className="px-4 py-3 font-normal">Telefone</th>
                    <th className="px-4 py-3 font-normal">Entrada</th>
                    <th className="px-4 py-3 font-normal">Último contato</th>
                    <th className="px-4 py-3 font-normal">Ministérios</th>
                    <th className="px-4 py-3 font-normal">Status</th>
                    <th className="px-4 py-3 font-normal text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((m) => {
                    const mins = m.ministerios ?? [];
                    return (
                      <tr key={m.id} className="border-t border-border hover:bg-muted/35">
                        <td className="px-4 py-4 align-top">
                          <Link
                            to="/membros/$id"
                            params={{ id: m.id }}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {m.nome}
                          </Link>
                        </td>
                        <td className="px-4 py-4 align-top tabular-nums text-muted-foreground">
                          {m.telefone}
                        </td>
                        <td className="px-4 py-4 align-top text-muted-foreground">
                          {formatDate(m.data_entrada)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <ContatoCell m={m} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {mins.slice(0, 2).map((mm) => (
                              <span
                                key={mm.id}
                                className="border border-border bg-muted px-2.5 py-1 text-xs text-foreground"
                              >
                                {mm.ministerio_nome}
                              </span>
                            ))}
                            {mins.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{mins.length - 2}
                              </span>
                            )}
                            {mins.length === 0 && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex justify-end gap-1">
                            <Button asChild size="icon" variant="ghost" title="Ver">
                              <Link to="/membros/$id" params={{ id: m.id }}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {editor && (
                              <Button asChild size="icon" variant="ghost" title="Editar">
                                <Link to="/membros/$id/editar" params={{ id: m.id }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Excluir"
                                onClick={() => onExcluir(m)}
                                disabled={excluir.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-700" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
              <span>
                Página {pagina} de {totalPaginas} · {formatNumber(resultado?.total)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="border border-border bg-card">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Atenção agora
              </p>
              <h2 className="mt-2 font-serif text-2xl text-foreground">Sem contato</h2>
            </div>
            <div className="divide-y divide-border">
              {alertas.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  Nenhum membro em alerta neste momento.
                </p>
              ) : (
                alertas.map((m) => <AlertRow key={m.id} m={m} />)
              )}
            </div>
          </section>

          <section className="border border-border bg-card">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Leitura do recorte
              </p>
              <h2 className="mt-2 font-serif text-2xl text-foreground">Resumo rápido</h2>
            </div>
            <div className="grid grid-cols-1 gap-px bg-border">
              <div className="bg-card px-5 py-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Páginas
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {pagina}/{totalPaginas}
                </p>
              </div>
              <div className="bg-card px-5 py-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Registros carregados
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                  {formatNumber(data.length)}
                </p>
              </div>
              <div className="bg-card px-5 py-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Maior faixa
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">{ministerioTopo[0]}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm text-muted-foreground">
              <span>Entrada operacional</span>
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
