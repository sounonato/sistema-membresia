import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, CheckCircle2, Circle, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConvertido } from "../convertidos/hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Etapa = {
  id: string;
  titulo: string;
  descricao: string;
  data?: string | null;
  status: "concluido" | "ativo" | "pendente";
  manualSecaoId?: string;
};

function fmt(d?: string | null) {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR");
}

export function JornadaPage() {
  const { id } = useParams({ from: "/_auth/convertidos/$id/jornada" });
  const { data: c, isLoading } = useConvertido(id);

  const { data: modulos } = useQuery({
    queryKey: ["modulos"],
    queryFn: () => api.getModulos(),
  });

  if (isLoading || !c) {
    return (
      <div className="grid place-content-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const modulosLista: { id: string; nome: string }[] = Array.isArray(modulos) ? modulos : [];
  const concluidos: string[] = Array.isArray((c as any).modulos_concluidos)
    ? (c as any).modulos_concluidos
    : [];

  const etapas: Etapa[] = [
    {
      id: "cadastro",
      titulo: "Cadastro",
      descricao: "Acolhimento e registro inicial",
      data: (c as any).created_at ?? (c as any).data_cadastro,
      status: "concluido",
      manualSecaoId: "passo-decisao",
    },
    {
      id: "decisao",
      titulo: "Decisão por Cristo",
      descricao: "Profissão de fé registrada",
      data: c.data_conversao,
      status: c.data_conversao ? "concluido" : "ativo",
      manualSecaoId: "passo-decisao",
    },
    {
      id: "batismo",
      titulo: "Batismo",
      descricao: c.batizado
        ? "Batismo realizado"
        : c.quer_batizar
          ? "Aguardando preparação para batismo"
          : "A conversar sobre o batismo",
      data: (c as any).data_batismo,
      status: c.batizado ? "concluido" : c.quer_batizar ? "ativo" : "pendente",
      manualSecaoId: "passo-batismo",
    },
    ...modulosLista.map<Etapa>((m, i) => {
      const done = concluidos.includes(m.id);
      const prevDone =
        i === 0
          ? !!c.batizado || !!c.fez_discipulado
          : concluidos.includes(modulosLista[i - 1].id);
      return {
        id: `mod-${m.id}`,
        titulo: `Módulo: ${m.nome}`,
        descricao: done ? "Concluído" : prevDone ? "Em andamento" : "Aguardando módulo anterior",
        status: done ? "concluido" : prevDone ? "ativo" : "pendente",
        manualSecaoId: "passo-modulos",
      };
    }),
    {
      id: "lideranca",
      titulo: "Líder em formação",
      descricao: "Multiplicação: novos discípulos sob sua liderança",
      status:
        modulosLista.length > 0 && concluidos.length === modulosLista.length
          ? "ativo"
          : "pendente",
      manualSecaoId: "passo-lideranca",
    },
  ];

  const totalConcluido = etapas.filter((e) => e.status === "concluido").length;
  const progresso = Math.round((totalConcluido / etapas.length) * 100);
  const proxima = etapas.find((e) => e.status === "ativo") ?? etapas.find((e) => e.status === "pendente");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/convertidos/$id" params={{ id }}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-3xl text-primary">Jornada de {c.nome}</h1>
          <p className="text-sm text-muted-foreground">
            Linha do tempo do crescimento espiritual
          </p>
        </div>
      </div>

      <Card className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Próximo passo sugerido
                </p>
                <p className="font-serif text-lg text-primary">
                  {proxima?.titulo ?? "Jornada completa 🎉"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Progresso</p>
              <p className="font-serif text-2xl text-primary">{progresso}%</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <ol className="relative border-l-2 border-border ml-3 space-y-6">
            {etapas.map((e) => (
              <li key={e.id} className="pl-8 relative">
                <span
                  className={cn(
                    "absolute -left-[14px] top-0 grid place-content-center h-6 w-6 rounded-full ring-4 ring-card",
                    e.status === "concluido" && "bg-primary text-primary-foreground",
                    e.status === "ativo" && "bg-accent text-accent-foreground",
                    e.status === "pendente" && "bg-muted text-muted-foreground",
                  )}
                >
                  {e.status === "concluido" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </span>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-serif text-lg text-primary leading-tight">{e.titulo}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{e.descricao}</p>
                    {fmt(e.data) && (
                      <p className="text-xs text-muted-foreground mt-1">📅 {fmt(e.data)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs rounded-full px-2.5 py-1 font-medium",
                        e.status === "concluido" && "bg-primary/10 text-primary",
                        e.status === "ativo" && "bg-accent text-accent-foreground",
                        e.status === "pendente" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {e.status === "concluido" ? "✓ Concluído" : e.status === "ativo" ? "Em andamento" : "Pendente"}
                    </span>
                    {e.manualSecaoId && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 rounded-lg"
                      >
                        <Link to="/manual" search={{ secao: e.manualSecaoId } as any}>
                          <BookOpen className="h-3 w-3" /> Manual
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}