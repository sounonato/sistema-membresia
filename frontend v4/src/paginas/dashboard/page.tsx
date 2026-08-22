import { type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Loader2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  UserRoundCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats, useMembrosStats } from "./hooks";
import DashboardDiscipulador from "./dashboard-discipulador";

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

type Kpi = {
  label: string;
  value: number;
  note: string;
  tone: "primary" | "amber" | "emerald" | "slate";
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value}%`;
}

function Panel({
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-border bg-card ${className}`}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{eyebrow}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-2xl text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function KpiTile({ label, value, note, tone }: Kpi) {
  const toneClasses = {
    primary: "border-primary/25 bg-primary/10 text-primary",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    slate: "border-border bg-muted/40 text-foreground",
  }[tone];

  return (
    <div className={`min-w-0 border-t px-5 py-5 sm:px-6 ${toneClasses}`}>
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-[clamp(2.1rem,4vw,3.75rem)] font-semibold leading-none tabular-nums text-foreground">
        {formatNumber(value)}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

function SignalRow({
  label,
  value,
  note,
  status,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  status: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 sm:px-6">
      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-content-center border border-border bg-muted/60 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            {status}
          </span>
        </div>
        <p className="mt-2 text-[clamp(1.4rem,3vw,2.2rem)] font-semibold leading-none tabular-nums text-foreground">
          {value}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { usuario, igreja } = useAuth();
  const { data, isLoading } = useDashboardStats();
  const { data: membrosStats } = useMembrosStats();

  if (usuario?.perfil === "discipulador") {
    return <DashboardDiscipulador />;
  }

  if (isLoading) {
    return (
      <div className="grid place-content-center py-32 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const stats = data ?? {};
  const porMes = stats.por_mes ?? [];
  const porGenero = stats.por_genero ?? [];
  const porFaixaEtaria = stats.por_faixa_etaria ?? [];
  const agora = new Date();
  const dateLabel = agora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const totalMes = porMes.reduce((sum, item) => sum + item.total, 0);
  const ultimoMes = porMes.at(-1)?.total ?? 0;
  const penultimoMes = porMes.at(-2)?.total ?? ultimoMes;
  const variacaoMensal =
    penultimoMes > 0 ? Math.round(((ultimoMes - penultimoMes) / penultimoMes) * 100) : 0;
  const mediaMensal = porMes.length > 0 ? Math.round(totalMes / porMes.length) : 0;
  const mesTopo = porMes.reduce(
    (melhor, atual) => (atual.total > melhor.total ? atual : melhor),
    porMes[0] ?? { mes: "Sem dados", total: 0 },
  ) ?? { mes: "Sem dados", total: 0 };

  const aguardando = stats.aguardando_discipulado ?? 0;
  const totalConvertidos = stats.total_convertidos ?? 0;
  const gruposAtivos = stats.grupos_ativos ?? 0;
  const batizados = stats.batizados ?? 0;
  const semContato = membrosStats?.sem_contato_60 ?? 0;
  const membrosTotal = membrosStats?.total ?? 0;
  const membrosAtivos = membrosStats?.ativos ?? 0;
  const totalGenero = porGenero.reduce((sum, item) => sum + item.total, 0);
  const generoTopo = porGenero.reduce(
    (melhor, atual) => (atual.total > melhor.total ? atual : melhor),
    porGenero[0] ?? { genero: "sem dados", total: 0 },
  ) ?? { genero: "sem dados", total: 0 };
  const totalFaixaEtaria = porFaixaEtaria.reduce((sum, item) => sum + item.total, 0);
  const faixaTopo = porFaixaEtaria.reduce(
    (melhor, atual) => (atual.total > melhor.total ? atual : melhor),
    porFaixaEtaria[0] ?? { faixa: "Sem dados", total: 0 },
  ) ?? { faixa: "Sem dados", total: 0 };

  const kpis: Kpi[] = [
    {
      label: "Convertidos",
      value: totalConvertidos,
      note: "Base consolidada de novos acompanhamentos.",
      tone: "primary",
    },
    {
      label: "Grupos ativos",
      value: gruposAtivos,
      note: "Frentes de discipulado em andamento.",
      tone: "emerald",
    },
    {
      label: "Batizados",
      value: batizados,
      note: "Marco público já registrado.",
      tone: "slate",
    },
    {
      label: "Aguardando",
      value: aguardando,
      note: "Pessoas sem discipulador atribuído.",
      tone: "amber",
    },
  ];

  const signals = [
    {
      label: "Pendências de atenção",
      value: formatNumber(aguardando),
      note: "Se esse número sobe, o time precisa redistribuir acompanhamento.",
      status: aguardando > 0 ? "Alerta" : "Estável",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      label: "Membros sem contato",
      value: formatNumber(semContato),
      note: "Janela de 60 dias sem retorno ou contato ativo.",
      status: semContato > 0 ? "Prioridade" : "Ok",
      icon: <ShieldAlert className="h-4 w-4" />,
    },
    {
      label: "Membros ativos",
      value: formatNumber(membrosAtivos),
      note: "Pessoas em comunhão no cadastro principal.",
      status:
        membrosTotal > 0 ? `${Math.round((membrosAtivos / membrosTotal) * 100)}%` : "Sem base",
      icon: <UserRoundCheck className="h-4 w-4" />,
    },
  ];

  const quickActions = [
    {
      label: "Abrir membros",
      note: "Ir direto para a base operacional.",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Ver relatórios",
      note: "Conferir consolidados e tendências.",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: "Revisar conversões",
      note: "Checar o fluxo mais recente.",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-8 text-foreground">
      <section className="overflow-hidden border border-border bg-card">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.85fr)]">
          <div className="px-5 py-6 sm:px-6 sm:py-7">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              <span className="inline-flex items-center gap-2 border border-border bg-muted/30 px-3 py-2 text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Centro de comando
              </span>
              <span className="inline-flex items-center gap-2 border border-border px-3 py-2">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {dateLabel}
              </span>
            </div>

            <h1 className="mt-6 text-[clamp(2.4rem,5vw,5rem)] font-semibold leading-[0.95] tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Leitura operacional da {igreja?.nome ?? "igreja"} para entender fluxo, atenção e
              próxima ação sem precisar caçar informação em várias telas.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                {formatNumber(totalMes)} registros no período
              </span>
              <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-primary" />
                {formatNumber(totalConvertidos)} convertidos totais
              </span>
              <span className="inline-flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                <UserRoundCheck className="h-3.5 w-3.5 text-primary" />
                {formatNumber(membrosTotal)} membros na base
              </span>
            </div>
          </div>

          <div className="border-t border-border bg-muted/30 px-5 py-6 xl:border-l xl:border-t-0 sm:px-6">
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Leitura executiva
            </p>
            <div className="mt-5 grid grid-cols-1 gap-px border border-border bg-border">
              <div className="bg-card px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Crescimento mensal
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                  {formatPercent(variacaoMensal)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comparado ao mês anterior, com base nos últimos lançamentos.
                </p>
              </div>
              <div className="bg-card px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Pico do período
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                  {formatNumber(mesTopo.total)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mesTopo.mes} foi o mês mais forte na série mostrada.
                </p>
              </div>
              <div className="bg-card px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Média mensal
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                  {formatNumber(mediaMensal)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Linha de referência para calibrar ritmo e distribuição.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-px border-t border-border bg-border md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <KpiTile key={k.label} {...k} />
          ))}
        </div>
      </section>

      {/* Citação Bíblica do Print - Atos 2:46-47 */}
      <section className="border border-border bg-card p-6 sm:p-7">
        <div className="flex flex-col gap-2">
          <p className="font-serif text-lg italic leading-relaxed text-foreground sm:text-xl">
            “Todos os dias, continuavam a reunir-se no templo e nas casas, partiam o pão com alegria
            e generosidade, louvando a Deus e contando com a simpatia de todo o povo. E o Senhor
            lhes acrescentava diariamente os que iam sendo salvos.”
          </p>
          <p className="text-xs uppercase tracking-[0.28em] font-semibold text-primary">
            Atos 2:46-47
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)]">
        <div className="space-y-6">
          <Panel
            eyebrow="Fluxo mensal"
            title="Movimento de convertidos"
            subtitle={`Atualizado em ${dateLabel}`}
          >
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_18rem]">
              <div className="border-b border-border xl:border-b-0 xl:border-r">
                <div className="h-[22rem] px-3 py-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porMes} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                      <XAxis
                        dataKey="mes"
                        stroke="var(--color-muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "var(--color-border)" }}
                      />
                      <YAxis
                        stroke="var(--color-muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(59,130,246,0.08)" }}
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 0,
                          color: "var(--color-card-foreground)",
                          fontFamily: "Instrument Sans, sans-serif",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="total"
                        fill="var(--color-primary)"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="divide-y divide-border bg-muted/25">
                <div className="px-5 py-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    Leitura rápida
                  </p>
                  <p className="mt-2 text-2xl font-semibold leading-none tabular-nums text-foreground">
                    {formatNumber(ultimoMes)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Último mês consolidado na série de conversões.
                  </p>
                </div>
                <div className="px-5 py-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    Tendência
                  </p>
                  <p className="mt-2 text-2xl font-semibold leading-none tabular-nums text-foreground">
                    {formatPercent(variacaoMensal)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Variação em relação ao mês anterior.
                  </p>
                </div>
                <div className="px-5 py-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    Ponto alto
                  </p>
                  <p className="mt-2 text-2xl font-semibold leading-none tabular-nums text-foreground">
                    {formatNumber(mesTopo.total)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {mesTopo.mes} foi o mês mais forte do período exibido.
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Demografia" title="Conversão por faixa etária" subtitle="Faixas de idade">
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_18rem]">
              <div className="border-b border-border xl:border-b-0 xl:border-r">
                <div className="h-[20rem] px-3 py-4">
                  {porFaixaEtaria.length === 0 ? (
                    <div className="grid h-full place-content-center text-sm text-muted-foreground">
                      Nenhum registro de idade disponível
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={porFaixaEtaria}
                        margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="faixa"
                          stroke="var(--color-muted-foreground)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: "var(--color-border)" }}
                        />
                        <YAxis
                          stroke="var(--color-muted-foreground)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(59,130,246,0.08)" }}
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 0,
                            color: "var(--color-card-foreground)",
                            fontFamily: "Instrument Sans, sans-serif",
                            fontSize: 12,
                          }}
                        />
                        <Bar
                          dataKey="total"
                          fill="var(--color-chart-2, #3b82f6)"
                          radius={[0, 0, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="divide-y divide-border bg-muted/25">
                <div className="px-5 py-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    Faixa predominante
                  </p>
                  <p className="mt-2 text-2xl font-semibold leading-none tabular-nums text-foreground">
                    {faixaTopo.faixa}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {formatNumber(faixaTopo.total)} pessoas nessa faixa.
                  </p>
                </div>
                <div className="px-5 py-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    Total computado
                  </p>
                  <p className="mt-2 text-2xl font-semibold leading-none tabular-nums text-foreground">
                    {formatNumber(totalFaixaEtaria)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Convertidos classificados por faixa de idade.
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          {membrosStats && membrosStats.total > 0 && (
            <Panel eyebrow="Membresia" title="Base de membros" subtitle="Fluxo consolidado">
              <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Total de membros",
                    value: membrosStats.total,
                    note: "Ativos + inativos",
                  },
                  { label: "Membros ativos", value: membrosStats.ativos, note: "Em comunhão" },
                  { label: "Batizados", value: membrosStats.batizados, note: "Marco público" },
                  {
                    label: "Sem contato (60d)",
                    value: membrosStats.sem_contato_60,
                    note: "Precisam de atenção",
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-card px-5 py-5 sm:px-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-none tabular-nums text-foreground">
                      {formatNumber(item.value)}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <aside className="space-y-6">
          <Panel eyebrow="Sinais do dia" title="Leitura de agora" subtitle="O que pede atenção">
            <div className="divide-y divide-border">
              <SignalRow
                label={signals[0].label}
                value={signals[0].value}
                note={signals[0].note}
                status={signals[0].status}
                icon={signals[0].icon}
              />
              <SignalRow
                label={signals[1].label}
                value={signals[1].value}
                note={signals[1].note}
                status={signals[1].status}
                icon={signals[1].icon}
              />
              <SignalRow
                label={signals[2].label}
                value={signals[2].value}
                note={signals[2].note}
                status={signals[2].status}
                icon={signals[2].icon}
              />
            </div>
          </Panel>

          <Panel eyebrow="Distribuição" title="Perfil por gênero" subtitle="Composição">
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_12rem]">
              <div className="border-b border-border px-3 py-4 xl:border-b-0 xl:border-r">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={porGenero}
                        dataKey="total"
                        nameKey="genero"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={2}
                        stroke="var(--color-background)"
                        strokeWidth={3}
                      >
                        {porGenero.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 0,
                          color: "var(--color-card-foreground)",
                          fontFamily: "Instrument Sans, sans-serif",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="divide-y divide-border bg-muted/25">
                <div className="px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    Maior fatia
                  </p>
                  <p className="mt-2 text-xl font-semibold text-foreground capitalize">
                    {generoTopo.genero}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {formatNumber(generoTopo.total)} pessoas, de um total de{" "}
                    {formatNumber(totalGenero)}.
                  </p>
                </div>

                <div className="space-y-1 px-4 py-4">
                  {porGenero.map((item, i) => (
                    <div
                      key={item.genero}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex items-center gap-2 text-foreground">
                        <span
                          className="h-2.5 w-2.5 shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="capitalize">{item.genero}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatNumber(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Ações" title="Próximos movimentos" subtitle="Atalhos úteis">
            <div className="divide-y divide-border">
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-9 w-9 place-content-center border border-border bg-muted/50 text-primary">
                      {action.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{action.note}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}
