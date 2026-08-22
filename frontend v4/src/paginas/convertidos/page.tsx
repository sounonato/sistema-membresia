import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  UserRoundCheck,
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar } from "@/lib/api";
import { useConvertidos, useDeleteConvertido } from "./hooks";

const PAGE_SIZE = 12;

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("pt-BR");
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

function StatusBadge({ status }: { status?: string }) {
  return (
    <Badge
      className={cn(
        "rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em]",
        statusTone(status),
      )}
    >
      {labelStatus(status)}
    </Badge>
  );
}

function labelStatus(status?: string) {
  if (!status) return "Sem status";
  return status.replaceAll("_", " ");
}

function statusTone(status?: string) {
  if (!status) return "border-border bg-muted text-muted-foreground";
  const value = status.toLowerCase();
  if (value.includes("inativo")) return "border-border bg-muted text-muted-foreground";
  if (value.includes("ativo"))
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (value.includes("batiz")) return "border-primary/20 bg-primary/10 text-primary";
  if (value.includes("em andamento") || value.includes("andamento"))
    return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (value.includes("concl")) return "border-primary/20 bg-primary/10 text-primary";
  return "border-border bg-muted text-muted-foreground";
}

export function ConvertidosPage() {
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const { data, isLoading } = useConvertidos();
  const del = useDeleteConvertido();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("__todos");
  const [pagina, setPagina] = useState(1);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of data ?? []) {
      if (item.status) values.add(item.status);
    }
    return Array.from(values).sort();
  }, [data]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return (data ?? []).filter((c) => {
      const matchBusca =
        !termo ||
        c.nome?.toLowerCase().includes(termo) ||
        (c.telefone ?? "").toLowerCase().includes(termo) ||
        (c.email ?? "").toLowerCase().includes(termo);
      const matchStatus = status === "__todos" || (c.status ?? "__sem_status") === status;
      return matchBusca && matchStatus;
    });
  }, [data, busca, status]);

  const totalPag = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pagSegura = Math.min(pagina, totalPag);
  const itens = filtrados.slice((pagSegura - 1) * PAGE_SIZE, pagSegura * PAGE_SIZE);

  const comDiscipulador = filtrados.filter((c) => Boolean(c.discipulador_id)).length;
  const comBatismo = filtrados.filter((c) => Boolean(c.data_batismo)).length;
  const comStatus = filtrados.filter((c) => c.status && c.status !== "").length;
  const semResponsavel = filtrados.filter((c) => !c.discipulador_id).length;
  const statusTopo = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of filtrados) {
      const key = item.status || "Sem status";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["Sem status", 0];
  }, [filtrados]);

  async function onExcluir(id: string, nome: string) {
    if (!window.confirm(`Excluir convertido "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await del.mutateAsync(id);
      toast.success("Convertido excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <div className="space-y-8 text-foreground">
      <PageHeader
        chapter="03"
        eyebrow="Discipulado"
        title="Convertidos"
        lede="Fila operacional de convertidos, com foco em responsabilidade, status e próximo passo."
        actions={
          editor ? (
            <Button
              asChild
              className="h-11 gap-2 rounded-none bg-primary text-primary-foreground hover:opacity-90"
            >
              <Link to="/convertidos/novo">
                <Plus className="h-4 w-4" />
                Registrar convertido
              </Link>
            </Button>
          ) : null
        }
      />

      <section className="grid gap-px border border-border bg-border xl:grid-cols-[minmax(0,1.35fr)_24rem]">
        <div className="bg-card px-5 py-6 sm:px-6 sm:py-7">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              Fluxo em acompanhamento
            </span>
            <span className="inline-flex items-center gap-2 border border-border px-3 py-2">
              <UserRoundCheck className="h-3.5 w-3.5 text-primary" />
              {formatNumber(comDiscipulador)} com responsável
            </span>
          </div>

          <h1 className="mt-6 text-[clamp(2.2rem,4vw,4.5rem)] font-semibold leading-[0.95] tracking-tight text-foreground">
            Convertidos
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Aqui a leitura é de acompanhamento: quem entrou, quem já avançou e quem ainda está sem
            direção clara.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              {formatNumber(filtrados.length)} no filtro
            </span>
            <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <UserRoundCheck className="h-3.5 w-3.5 text-primary" />
              {formatNumber(comDiscipulador)} com responsável
            </span>
            <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <Plus className="h-3.5 w-3.5 text-primary" />
              {formatNumber(comBatismo)} batizados
            </span>
          </div>
        </div>

        <aside className="divide-y divide-border bg-muted/30">
          <MetricCard
            label="Total filtrado"
            value={formatNumber(filtrados.length)}
            helper="Registros visíveis no recorte atual."
            tone="primary"
          />
          <MetricCard
            label="Com responsável"
            value={formatNumber(comDiscipulador)}
            helper="Convertidos já atribuídos a alguém."
            tone="emerald"
          />
          <MetricCard
            label="Batizados"
            value={formatNumber(comBatismo)}
            helper="Marcos de avanço já concluídos."
            tone="neutral"
          />
          <MetricCard
            label="Sem responsável"
            value={formatNumber(semResponsavel)}
            helper="Gente que ainda precisa de dono."
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
                  Fila operacional
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    <span className="text-foreground">{formatNumber(filtrados.length)}</span>{" "}
                    resultados
                  </span>
                  <span>
                    Página <span className="text-foreground">{pagSegura}</span> de {totalPag}
                  </span>
                  <span>
                    Status líder:{" "}
                    <span className="text-foreground">
                      {labelStatus(statusTopo[0])} ({formatNumber(statusTopo[1])})
                    </span>
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 border border-border bg-muted/30 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                <Search className="h-3.5 w-3.5 text-primary" />
                Busca e filtro
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="flex items-center gap-3 border border-border bg-background px-3 py-2 h-11">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPagina(1);
                  }}
                  placeholder="Buscar por nome, telefone ou e-mail"
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>

              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPagina(1);
                }}
              >
                <SelectTrigger className="h-11 rounded-none border-border bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos">Todos os status</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {labelStatus(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
              <p>
                {filtrados.length} {filtrados.length === 1 ? "resultado" : "resultados"}
              </p>
              <p>
                Página {pagSegura} de {totalPag}
              </p>
            </div>
          </section>

          {isLoading ? (
            <div className="grid place-content-center py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : itens.length === 0 ? (
            <div className="border border-dashed border-border bg-card py-20 text-center">
              <p className="text-lg text-muted-foreground">Nenhum convertido encontrado.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tente outro termo de busca ou limpe o filtro de status.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {itens.map((c) => (
                <article
                  key={c.id}
                  className="grid gap-0 border border-border bg-card xl:grid-cols-[minmax(0,1.5fr)_14rem_12rem_auto]"
                >
                  <div className="px-4 py-4">
                    <Link
                      to="/convertidos/$id"
                      params={{ id: c.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {c.nome}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.email ?? "Sem e-mail"} · {c.telefone ?? "Sem telefone"}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Conversão em {formatDate(c.data_conversao)}
                    </p>
                  </div>

                  <div className="border-t border-border px-4 py-4 xl:border-t-0 xl:border-l">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      Contato
                    </p>
                    <p className="mt-2 text-sm text-foreground">{c.telefone ?? "—"}</p>
                    {c.email && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{c.email}</p>
                    )}
                  </div>

                  <div className="border-t border-border px-4 py-4 xl:border-t-0 xl:border-l">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      Status
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {c.data_batismo
                        ? `Batizado em ${formatDate(c.data_batismo)}`
                        : "Sem batismo registrado"}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1 border-t border-border px-4 py-4 xl:border-t-0 xl:border-l">
                    <Button asChild size="icon" variant="ghost" title="Ver">
                      <Link to="/convertidos/$id" params={{ id: c.id }}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    {editor && (
                      <>
                        <Button asChild size="icon" variant="ghost" title="Editar">
                          <Link to="/convertidos/$id/editar" params={{ id: c.id }}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir"
                          onClick={() => onExcluir(c.id, c.nome)}
                          disabled={del.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-700" />
                        </Button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {filtrados.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Página {pagSegura} de {totalPag}
              </p>
              <div className="flex gap-2">
                <button
                  className="h-9 border border-border px-3 text-sm hover:bg-muted disabled:opacity-30"
                  disabled={pagSegura === 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <button
                  className="h-9 border border-border px-3 text-sm hover:bg-muted disabled:opacity-30"
                  disabled={pagSegura === totalPag}
                  onClick={() => setPagina((p) => Math.min(totalPag, p + 1))}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="border border-border bg-card">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Recorte atual
              </p>
              <h2 className="mt-2 font-serif text-2xl text-foreground">Resumo rápido</h2>
            </div>
            <div className="grid grid-cols-1 gap-px bg-border">
              <MetricCard
                label="Com status"
                value={formatNumber(comStatus)}
                helper="Registros com etapa definida."
                tone="primary"
              />
              <MetricCard
                label="Sem responsável"
                value={formatNumber(semResponsavel)}
                helper="Pessoas que ainda pedem dono."
                tone="amber"
              />
              <MetricCard
                label="Responsáveis"
                value={formatNumber(comDiscipulador)}
                helper="Fluxo já encaminhado."
                tone="emerald"
              />
            </div>
          </section>

          <section className="border border-border bg-card">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Status líder
              </p>
              <h2 className="mt-2 font-serif text-2xl text-foreground">Mais frequente</h2>
            </div>
            <div className="px-5 py-5 sm:px-6">
              <p className="text-sm text-muted-foreground">Etiqueta dominante do recorte atual.</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {labelStatus(statusTopo[0])}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {formatNumber(statusTopo[1])} registros dentro do filtro atual.
              </p>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
