import { useState } from "react";
import { Loader2, Search, MessageSquare, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConvertidos } from "@/paginas/convertidos/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";

type Kpi = {
  label: string;
  value: number;
  note: string;
};

function KpiCard({ label, value, note }: Kpi) {
  return (
    <div className="border border-border bg-card px-5 py-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-[clamp(2.2rem,4vw,3.8rem)] leading-none tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

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
  const total = list.length;
  const emAndamento = list.filter((c) => c.status === "ativo" && !c.fez_discipulado).length;

  const semContato = list.filter((c) => {
    if (c.status !== "ativo" || c.fez_discipulado) return false;
    const diffDays = Math.floor(
      (Date.now() - new Date(c.data_conversao).getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays > 30;
  }).length;

  const filtrados = list.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()));
  const firstName = usuario?.nome?.split(" ")[0] ?? "irmão";

  const kpis: Kpi[] = [
    { label: "Convertidos", value: total, note: "Sob sua responsabilidade" },
    { label: "Em andamento", value: emAndamento, note: "Aulas em progresso" },
    { label: "Sem contato (30d+)", value: semContato, note: "Atenção necessária" },
  ];

  function abrirWhatsapp(telefone: string, nome: string) {
    const limpo = telefone.replace(/\D/g, "");
    const ddi = limpo.startsWith("55") ? limpo : `55${limpo}`;
    const texto = encodeURIComponent(
      `Olá, ${nome.split(" ")[0]}! Tudo bem? Passando para saber como você está.`,
    );
    window.open(`https://wa.me/${ddi}?text=${texto}`, "_blank");
  }

  return (
    <div className="space-y-10 text-foreground">
      <PageHeader
        chapter="01"
        eyebrow="Painel discipulador(a)"
        title="Dashboard"
        lede={`Acompanhamento direto dos convertidos sob responsabilidade de ${firstName}.`}
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Pessoas</p>
            <h2 className="mt-2 font-serif text-2xl text-foreground">Seus convertidos</h2>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 bg-card border-border text-sm"
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="border border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum convertido sob sua responsabilidade encontrado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Nome
                  </th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Conversão
                  </th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Status
                  </th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-muted-foreground font-medium text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => {
                  const dataConv = new Date(c.data_conversao).toLocaleDateString("pt-BR");
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-serif text-base text-foreground">{c.nome}</div>
                        {c.email && (
                          <div className="text-xs text-muted-foreground mt-0.5">{c.email}</div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-serif italic">
                        {dataConv}
                      </td>
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
                            className="border-border hover:bg-muted"
                            onClick={() => abrirWhatsapp(c.telefone, c.nome)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1 text-emerald-600" />
                            WhatsApp
                          </Button>
                          {c.telefone && (
                            <Button size="sm" variant="ghost" className="rounded-none" asChild>
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
