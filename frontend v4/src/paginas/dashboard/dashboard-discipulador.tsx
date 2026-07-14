import { useState } from "react";
import { Loader2, Search, MessageSquare, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConvertidos } from "@/paginas/convertidos/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardDiscipulador() {
  const { usuario } = useAuth();
  const { data: convertidos, isLoading } = useConvertidos();
  const [busca, setBusca] = useState("");

  if (isLoading) {
    return (
      <div className="grid place-content-center py-32 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const list = convertidos ?? [];

  // KPIs
  const total = list.length;
  const emAndamento = list.filter((c) => c.status === "ativo" && !c.fez_discipulado).length;
  
  // Proxy para sem contato: convertidos há mais de 30 dias que ainda estão ativos e sem discipulado completo
  const semContato = list.filter((c) => {
    if (c.status !== "ativo" || c.fez_discipulado) return false;
    const diffDays = Math.floor(
      (Date.now() - new Date(c.data_conversao).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 30;
  }).length;

  const filtrados = list.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const now = new Date();
  const dateLabel = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const kpis = [
    { n: "01", label: "Convertidos", value: total, note: "Sob sua responsabilidade" },
    { n: "02", label: "Em andamento", value: emAndamento, note: "Aulas em progresso" },
    { n: "03", label: "Sem contato (30d+)", value: semContato, note: "Atenção necessária" },
  ];

  function abrirWhatsapp(telefone: string, nome: string) {
    const limpo = telefone.replace(/\D/g, "");
    const ddi = limpo.startsWith("55") ? limpo : `55${limpo}`;
    const texto = encodeURIComponent(`Olá, ${nome.split(" ")[0]}! Tudo bem? Passando para saber como você está.`);
    window.open(`https://wa.me/${ddi}?text=${texto}`, "_blank");
  }

  return (
    <div className="space-y-16 text-foreground">
      {/* Masthead */}
      <header className="border-b border-border pb-8">
        <div className="flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-6">
          <span>Painel do discipulador</span>
          <span className="font-editorial italic normal-case tracking-normal text-muted-foreground text-sm">
            {dateLabel}
          </span>
        </div>
        <h1 className="font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.03em] font-light">
          Bom te ver,<br />
          <span className="font-editorial italic text-primary">{usuario?.nome?.split(" ")[0] ?? "irmão"}</span>.
        </h1>
        <p className="mt-6 max-w-xl text-muted-foreground leading-relaxed font-serif italic">
          "Aquele que cuida da figueira comerá do seu fruto; e o que zela pelo seu senhor será honrado." &mdash; Provérbios 27:18
        </p>
      </header>

      {/* KPIs */}
      <section>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-6 flex items-center gap-3">
          <span className="tabular-nums">I.</span>
          <span className="h-px w-8 bg-stone-400" />
          Seu discipulado
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-foreground">
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className={
                "py-8 pr-4 border-b border-border " +
                (i < 2 ? "md:border-r md:border-border md:pr-8 " : "")
              }
            >
              <p className="font-editorial italic text-primary text-sm mb-3">{k.n}</p>
              <p className="font-serif text-[clamp(3rem,6vw,5rem)] leading-none tabular-nums text-foreground font-light">
                {k.value}
              </p>
              <p className="mt-4 text-sm text-foreground font-medium">{k.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Listagem */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
              <span className="tabular-nums">II.</span> &mdash; Pessoas
            </p>
            <h2 className="font-serif text-3xl tracking-tight">Seus Convertidos</h2>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 bg-card border-border rounded-lg text-sm"
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="bg-card border border-border p-12 text-center">
            <p className="text-muted-foreground font-serif italic text-sm">Nenhum convertido sob sua responsabilidade encontrado.</p>
          </div>
        ) : (
          <div className="bg-card border border-border overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Nome</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Conversão</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => {
                  const dataConv = new Date(c.data_conversao).toLocaleDateString("pt-BR");
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-serif text-base text-foreground">{c.nome}</div>
                        {c.email && <div className="text-xs text-muted-foreground mt-0.5">{c.email}</div>}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-serif italic">{dataConv}</td>
                      <td className="p-4">
                        <span
                          className={
                            "text-[10px] uppercase tracking-widest pb-0.5 border-b " +
                            (c.fez_discipulado
                              ? "text-emerald-500 border-emerald-500/30"
                              : "text-primary border-primary/30")
                          }
                        >
                          {c.fez_discipulado ? "Concluído" : "Em andamento"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-border hover:bg-muted"
                            onClick={() => abrirWhatsapp(c.telefone, c.nome)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1 text-emerald-600" />
                            WhatsApp
                          </Button>
                          {c.telefone && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-xl"
                              asChild
                            >
                              <a href={`tel:${c.telefone}`} title="Ligar">
                                <Phone className="h-4 w-4" />
                              </a>
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
      </section>
    </div>
  );
}
