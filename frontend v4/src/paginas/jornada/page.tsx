import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
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
    <div>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-stone-500 hover:text-stone-900">
          <Link to="/convertidos/$id" params={{ id }}>
            <ArrowLeft className="h-4 w-4" /> voltar ao dossiê
          </Link>
        </Button>
      </div>

      <header className="border-b border-stone-300/70 pb-6 mb-10">
        <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-stone-500">
          <span className="font-serif text-2xl italic text-primary">01</span>
          <span className="h-px w-6 bg-stone-400" />
          Jornada pastoral
        </p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05] text-stone-900 tracking-tight">
          {c.nome}
        </h1>
        <p className="mt-3 font-[Instrument_Serif,serif] italic text-lg text-stone-600 leading-snug">
          Da primeira decisão à multiplicação — um caminho, sete estações.
        </p>
      </header>

      <section className="grid md:grid-cols-[1fr_auto] gap-8 items-end pb-8 border-b border-stone-300/70 mb-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Próxima estação</p>
          <p className="mt-2 font-serif text-3xl text-stone-900 leading-tight">
            {proxima?.titulo ?? "Jornada completa."}
          </p>
          <p className="mt-2 font-[Instrument_Serif,serif] italic text-stone-500">
            {proxima?.descricao ?? "Restam apenas os frutos."}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Progresso</p>
          <p className="font-serif text-6xl tabular-nums text-primary leading-none mt-2">{progresso}<span className="text-2xl text-stone-400 align-top">%</span></p>
          <div className="mt-3 h-[3px] w-40 bg-stone-200 overflow-hidden ml-auto">
            <div className="h-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      </section>

      <ol className="relative">
        {etapas.map((e, i) => (
          <li key={e.id} className="grid grid-cols-[80px_1fr] gap-6 py-6 border-t border-stone-200 first:border-t-0">
            <div className="text-right">
              <p className="font-serif text-3xl italic text-stone-300 tabular-nums leading-none">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className={cn(
                "mt-2 text-[10px] uppercase tracking-widest",
                e.status === "concluido" && "text-emerald-700",
                e.status === "ativo" && "text-primary",
                e.status === "pendente" && "text-stone-400",
              )}>
                {e.status === "concluido" ? "cumprido" : e.status === "ativo" ? "em curso" : "a caminho"}
              </p>
            </div>
            <div className="border-l border-stone-300 pl-6 relative">
              <span className={cn(
                "absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full ring-2 ring-white",
                e.status === "concluido" && "bg-primary",
                e.status === "ativo" && "bg-stone-900",
                e.status === "pendente" && "bg-stone-300",
              )} />
              <h3 className="font-serif text-2xl text-stone-900 leading-tight">{e.titulo}</h3>
              <p className="mt-1 font-[Instrument_Serif,serif] italic text-stone-600">{e.descricao}</p>
              <div className="mt-3 flex items-center gap-4 text-xs">
                {fmt(e.data) && <span className="text-stone-500">{fmt(e.data)}</span>}
                {e.manualSecaoId && (
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                    <Link to="/manual" search={{ secao: e.manualSecaoId } as any}>
                      <BookOpen className="h-3 w-3" /> consultar manual
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}