import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Loader2, MessageSquare, AlertCircle, ArrowRight, Cake, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { useMembrosMetricas } from "./hooks";

const GENDER_OPACITIES: Record<string, string> = {
  feminino: "1.0",
  masculino: "0.6",
  nao_informado: "0.2",
  outro: "0.4",
};

const FAIXA_ETARIA_OPACITIES: Record<string, string> = {
  "0-17": "0.3",
  "18-24": "0.4",
  "25-34": "0.5",
  "35-44": "0.6",
  "45-54": "0.7",
  "55-64": "0.8",
  "65+": "1.0",
  "Não informado": "0.2",
};

function formatGender(g: string) {
  if (g === "feminino") return "Feminino";
  if (g === "masculino") return "Masculino";
  if (g === "outro") return "Outro";
  return "Não informado";
}

function formatCivilState(s: string) {
  if (s === "solteiro") return "Solteiro(a)";
  if (s === "casado") return "Casado(a)";
  if (s === "divorciado") return "Divorciado(a)";
  if (s === "viuvo") return "Viúvo(a)";
  if (s === "uniao_estavel") return "União Estável";
  return "Não informado";
}

function formatWhatsAppLink(tel?: string | null) {
  if (!tel) return "";
  const cleaned = tel.replace(/\D/g, "");
  return `https://wa.me/55${cleaned}`;
}

export function MembrosMetricasPage() {
  const { data, isLoading } = useMembrosMetricas();

  if (isLoading) {
    return (
      <div className="grid place-content-center py-32 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const metricas = data ?? {};
  const kpis = metricas.kpis ?? {};
  const crescimento = metricas.crescimento_mensal ?? [];
  const genero = metricas.por_genero ?? [];
  const estadoCivil = metricas.por_estado_civil ?? [];
  const faixaEtaria = metricas.por_faixa_etaria ?? [];
  const ministerios = metricas.por_ministerio ?? [];
  const semContato = metricas.sem_contato ?? {};
  const cidades = metricas.por_cidade ?? [];
  const aniversariantes = metricas.aniversariantes_mes ?? [];

  // Total de cidades para cálculo da porcentagem
  const totalCidadesMembros = cidades.reduce((acc: number, c: any) => acc + c.quantidade, 0);

  const kpisCards = [
    { n: "01", label: "Membros Ativos", value: kpis.ativos ?? 0, note: "Frequência e comunhão" },
    { n: "02", label: "Batizados", value: kpis.batizados ?? 0, note: "Testemunho público" },
    { n: "03", label: "Curso Membresia", value: kpis.fez_discipulado ?? 0, note: "Discipulado concluído" },
    { n: "04", label: "Sem Contato (60d+)", value: semContato.sem_contato_60 ?? 0, note: "Acompanhamento urgente" },
    { n: "05", label: "Membros Inativos", value: kpis.inativos ?? 0, note: "Afastados/Não frequentes" },
    { n: "06", label: "Transferidos", value: kpis.transferidos ?? 0, note: "Outras congregações" },
  ];

  return (
    <div className="space-y-16 text-foreground max-w-6xl">
      <PageHeader
        chapter="02"
        eyebrow="Membresia · Análise"
        title="Métricas de Membros"
        lede="A vitalidade de um corpo está no crescimento e no cuidado de cada membro. Explore a demografia, atividade e acompanhamento do rebanho."
      />

      {/* KPIs Grid */}
      <section>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-6 flex items-center gap-3">
          <span className="tabular-nums">I.</span>
          <span className="h-px w-8 bg-stone-400" />
          Indicadores Chave
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-t border-foreground">
          {kpisCards.map((k, i) => (
            <div
              key={k.label}
              className={
                "py-8 pr-4 border-b border-border " +
                (i % 2 === 0 ? "border-r border-border pr-6 " : "") +
                (i % 3 !== 2 ? "md:border-r md:border-border md:pr-6 " : "md:border-r-0 ") +
                (i % 6 !== 5 ? "lg:border-r lg:border-border lg:pr-8" : "lg:border-r-0")
              }
            >
              <p className="font-editorial italic text-primary text-sm mb-3">{k.n}</p>
              <p className="font-serif text-[clamp(2rem,4vw,3.5rem)] leading-none tabular-nums text-foreground font-light">
                {k.value}
              </p>
              <p className="mt-4 text-xs text-foreground font-semibold uppercase tracking-wider">{k.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{k.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Crescimento Mensal */}
      <section>
        <div className="flex items-baseline justify-between mb-6 border-b border-border pb-4">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
              <span className="tabular-nums">II.</span> — Colheita mensal
            </p>
            <h2 className="font-serif text-3xl tracking-tight">Crescimento de Membros</h2>
          </div>
          <p className="font-editorial italic text-muted-foreground text-sm hidden sm:block">
            &mdash; Entradas de membros nos últimos 12 meses
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={crescimento} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
              <XAxis
                dataKey="mes"
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e7e5e4" }}
              />
              <YAxis
                stroke="#78716c"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--color-muted, rgba(180,83,9,0.06))" }}
                contentStyle={{
                  background: "var(--color-card, #1e0812)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 0,
                  color: "var(--color-card-foreground, #e8dcc8)",
                  fontFamily: "Instrument Sans, sans-serif",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="entradas" fill="var(--color-primary)" radius={[0, 0, 0, 0]} maxBarSize={48} name="Entradas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Gênero e Estado Civil */}
      <section className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="mb-6 border-b border-border pb-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
              <span className="tabular-nums">III.</span> — Demografia
            </p>
            <h2 className="font-serif text-2xl tracking-tight">Distribuição por Sexo</h2>
          </div>
          <div className="h-64 flex flex-col items-center justify-center">
            {genero.length === 0 ? (
              <p className="text-sm italic font-serif text-muted-foreground">Sem dados registrados.</p>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genero}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="quantidade"
                        nameKey="genero"
                      >
                        {genero.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill="var(--color-primary)"
                            fillOpacity={GENDER_OPACITIES[entry.genero as keyof typeof GENDER_OPACITIES] ?? "0.5"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card, #1e0812)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 0,
                          color: "var(--color-card-foreground, #e8dcc8)",
                          fontFamily: "Instrument Sans, sans-serif",
                          fontSize: 12,
                        }}
                        formatter={(val: number, name: string) => [val, formatGender(name)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4 sm:mt-0">
                  {genero.map((item: any) => (
                    <div key={item.genero} className="flex items-center gap-3 text-sm text-foreground">
                      <div
                        className="w-3 h-3"
                        style={{
                          backgroundColor:
                            PIE_COLORS[item.genero as keyof typeof PIE_COLORS] || PIE_COLORS.nao_informado,
                        }}
                      />
                      <span className="font-medium text-foreground">{formatGender(item.genero)}:</span>
                      <span className="tabular-nums font-semibold">{item.quantidade}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-6 border-b border-border pb-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
              <span className="tabular-nums">IV.</span> — Relacionamentos
            </p>
            <h2 className="font-serif text-2xl tracking-tight">Estado Civil</h2>
          </div>
          <div className="h-64">
            {estadoCivil.length === 0 ? (
              <p className="text-sm italic font-serif text-muted-foreground text-center py-20">Sem dados registrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={estadoCivil}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
                  <XAxis type="number" stroke="#78716c" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="estado_civil"
                    type="category"
                    stroke="#78716c"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCivilState}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted, rgba(180,83,9,0.04))" }}
                    contentStyle={{
                      background: "var(--color-card, #1e0812)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 0,
                      color: "var(--color-card-foreground, #e8dcc8)",
                      fontFamily: "Instrument Sans, sans-serif",
                      fontSize: 12,
                    }}
                    formatter={(val: number) => [val, "Quantidade"]}
                    labelFormatter={formatCivilState}
                  />
                  <Bar dataKey="quantidade" fill="var(--color-muted-foreground)" maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Faixa Etária */}
      <section>
        <div className="mb-6 border-b border-border pb-4">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
            <span className="tabular-nums">V.</span> — Gerações
          </p>
          <h2 className="font-serif text-3xl tracking-tight">Faixa Etária (Ativos)</h2>
        </div>
        <div className="h-80">
          {faixaEtaria.length === 0 ? (
            <p className="text-sm italic font-serif text-muted-foreground text-center py-24">Sem dados registrados.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faixaEtaria} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis
                  dataKey="faixa"
                  stroke="#78716c"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e7e5e4" }}
                />
                <YAxis stroke="#78716c" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted, rgba(180,83,9,0.06))" }}
                  contentStyle={{
                    background: "var(--color-card, #1e0812)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 0,
                    color: "var(--color-card-foreground, #e8dcc8)",
                    fontFamily: "Instrument Sans, sans-serif",
                    fontSize: 12,
                  }}
                  formatter={(val: number) => [val, "Membros"]}
                />
                <Bar dataKey="quantidade" radius={[0, 0, 0, 0]} maxBarSize={48}>
                  {faixaEtaria.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill="var(--color-primary)"
                      fillOpacity={FAIXA_ETARIA_OPACITIES[entry.faixa as keyof typeof FAIXA_ETARIA_OPACITIES] ?? "0.5"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Ministérios e Cidades */}
      <section className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="mb-6 border-b border-border pb-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
              <span className="tabular-nums">VI.</span> — Engajamento
            </p>
            <h2 className="font-serif text-2xl tracking-tight">Membros por Ministério</h2>
          </div>
          <div className="h-72">
            {ministerios.length === 0 ? (
              <p className="text-sm italic font-serif text-muted-foreground text-center py-24">Sem ministérios cadastrados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ministerios.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
                  <XAxis type="number" stroke="#78716c" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="ministerio"
                    type="category"
                    stroke="#78716c"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted, rgba(180,83,9,0.04))" }}
                    contentStyle={{
                      background: "var(--color-card, #1e0812)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 0,
                      color: "var(--color-card-foreground, #e8dcc8)",
                      fontFamily: "Instrument Sans, sans-serif",
                      fontSize: 12,
                    }}
                    formatter={(val: number) => [val, "Voluntários"]}
                  />
                  <Bar dataKey="quantidade" fill="var(--color-primary)" maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div>
          <div className="mb-6 border-b border-border pb-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
              <span className="tabular-nums">VII.</span> — Distribuição geográfica
            </p>
            <h2 className="font-serif text-2xl tracking-tight">Top Cidades</h2>
          </div>
          <div className="h-72 overflow-y-auto space-y-4 pr-2">
            {cidades.length === 0 ? (
              <p className="text-sm italic font-serif text-muted-foreground text-center py-24">Sem dados geográficos.</p>
            ) : (
              cidades.map((item: any, i: number) => {
                const percentage = totalCidadesMembros > 0 ? (item.quantidade / totalCidadesMembros) * 100 : 0;
                return (
                  <div key={item.cidade} className="space-y-1">
                    <div className="flex justify-between text-sm text-foreground font-medium">
                      <span>{item.cidade}</span>
                      <span className="tabular-nums font-semibold text-foreground">
                        {item.quantidade} <span className="text-xs font-normal text-muted-foreground">({Math.round(percentage)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-none overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Aniversariantes do Mês */}
      <section>
        <div className="mb-6 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
              <span className="tabular-nums">VIII.</span> — Celebrações
            </p>
            <h2 className="font-serif text-3xl tracking-tight">Aniversariantes do Mês</h2>
          </div>
          <Cake className="h-5 w-5 text-primary" />
        </div>

        {aniversariantes.length === 0 ? (
          <p className="text-sm italic font-serif text-muted-foreground py-6 text-center bg-muted border border-border">
            Nenhum aniversariante de membresia neste mês.
          </p>
        ) : (
          <div className="bg-card border border-border rounded-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider w-16">Dia</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider w-20">Idade</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider w-48">Contato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {aniversariantes.map((m: any, index: number) => {
                    const dia = m.data_nascimento ? new Date(m.data_nascimento).getDate() : "—";
                    return (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-6 py-4 font-serif text-lg font-medium text-primary tabular-nums">
                          {dia}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">{m.nome}</td>
                        <td className="px-6 py-4 tabular-nums text-muted-foreground">{m.idade} anos</td>
                        <td className="px-6 py-4">
                          {m.telefone ? (
                            <a
                              href={formatWhatsAppLink(m.telefone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Enviar Parabéns
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem telefone</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Alerta Sem Contato */}
      <section className="bg-muted border border-border p-8 rounded-none">
        <div className="flex items-start gap-4 mb-6">
          <AlertCircle className="h-6 w-6 text-primary mt-1 shrink-0" />
          <div>
            <h3 className="font-serif text-xl text-foreground">Alerta de Acompanhamento Pastoral</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Membros ativos que não recebem contato ou registro de visita no período selecionado.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { dias: 30, value: semContato.sem_contato_30 ?? 0, title: "Há 30+ dias", color: "border-yellow-500/30 hover:border-yellow-500" },
            { dias: 60, value: semContato.sem_contato_60 ?? 0, title: "Há 60+ dias", color: "border-orange-500/30 hover:border-orange-500" },
            { dias: 90, value: semContato.sem_contato_90 ?? 0, title: "Há 90+ dias", color: "border-red-500/30 hover:border-red-500" },
          ].map((card) => (
            <Link
              key={card.dias}
              to="/relatorios"
              search={{ tab: "sem-contato" }}
              className={`p-5 bg-card border ${card.color} flex flex-col justify-between transition-colors`}
            >
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className="font-serif text-3xl font-light text-foreground mt-2 tabular-nums">
                  {card.value}
                </p>
              </div>
              <span className="text-xs font-semibold text-primary flex items-center gap-1 mt-4 hover:underline">
                Ver lista <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
