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
} from "recharts";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "./hooks";

const PIE_COLORS = ["#b45309", "#d97706", "#f59e0b", "#fbbf24"];

export function DashboardPage() {
  const { usuario, igreja } = useAuth();
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid place-content-center py-32 text-stone-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const stats = data ?? {};
  const porMes = stats.por_mes ?? [];
  const porGenero = stats.por_genero ?? [];
  const now = new Date();
  const dateLabel = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const kpis = [
    { n: "01", label: "Convertidos", value: stats.total_convertidos ?? 0, note: "Total registrado" },
    { n: "02", label: "Grupos ativos", value: stats.grupos_ativos ?? 0, note: "Em andamento" },
    { n: "03", label: "Batizados", value: stats.batizados ?? 0, note: "Testemunho público" },
    { n: "04", label: "Aguardando", value: stats.aguardando_discipulado ?? 0, note: "Sem discipulador" },
  ];

  return (
    <div className="space-y-16 text-stone-900">
      {/* Editorial masthead */}
      <header className="border-b border-stone-300 pb-8">
        <div className="flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-6">
          <span>Panorama pastoral</span>
          <span className="font-editorial italic normal-case tracking-normal text-stone-600 text-sm">
            {dateLabel}
          </span>
        </div>
        <h1 className="font-serif text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.03em] font-light">
          Bom te ver,<br />
          <span className="font-editorial italic text-amber-800">{usuario?.nome?.split(" ")[0] ?? "irmão"}</span>.
        </h1>
        <p className="mt-6 max-w-xl text-stone-600 leading-relaxed">
          Um retrato honesto de como {igreja?.nome ?? "a casa"} tem crescido &mdash;
          em pessoas, em jornadas, em decisões.
        </p>
      </header>

      {/* KPIs — editorial table row */}
      <section>
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-6 flex items-center gap-3">
          <span className="tabular-nums">I.</span>
          <span className="h-px w-8 bg-stone-400" />
          Números da casa
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-stone-900">
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className={
                "py-8 pr-4 border-b border-stone-300 " +
                (i < 3 ? "lg:border-r lg:border-stone-200 lg:pr-8 " : "") +
                (i % 2 === 0 ? "border-r border-stone-200 pr-6 lg:pr-8" : "")
              }
            >
              <p className="font-editorial italic text-amber-800 text-sm mb-3">{k.n}</p>
              <p className="font-serif text-[clamp(3rem,6vw,5rem)] leading-none tabular-nums text-stone-900 font-light">
                {k.value}
              </p>
              <p className="mt-4 text-sm text-stone-900 font-medium">{k.label}</p>
              <p className="text-xs text-stone-500 mt-1">{k.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chart section — editorial two-column */}
      <section className="grid lg:grid-cols-12 gap-x-8 gap-y-12">
        <div className="lg:col-span-8">
          <div className="flex items-baseline justify-between mb-6 border-b border-stone-300 pb-4">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-1">
                <span className="tabular-nums">II.</span> — Colheita mensal
              </p>
              <h2 className="font-serif text-3xl tracking-tight">Novos convertidos por mês</h2>
            </div>
            <p className="font-editorial italic text-stone-500 text-sm hidden sm:block">
              &mdash; os últimos 12 meses
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMes} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
                  cursor={{ fill: "rgba(180, 83, 9, 0.06)" }}
                  contentStyle={{
                    background: "#0c0a09",
                    border: "none",
                    borderRadius: 0,
                    color: "#fef3c7",
                    fontFamily: "Instrument Sans, sans-serif",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="#b45309" radius={[0, 0, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="mb-6 border-b border-stone-300 pb-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-1">
              <span className="tabular-nums">III.</span> — Retrato
            </p>
            <h2 className="font-serif text-3xl tracking-tight">Por gênero</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porGenero}
                  dataKey="total"
                  nameKey="genero"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="#faf7f2"
                  strokeWidth={3}
                >
                  {porGenero.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0c0a09",
                    border: "none",
                    borderRadius: 0,
                    color: "#fef3c7",
                    fontFamily: "Instrument Sans, sans-serif",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-2">
            {porGenero.map((g, i) => (
              <li
                key={g.genero}
                className="flex items-baseline justify-between border-b border-stone-200 py-2 text-sm"
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="capitalize">{g.genero}</span>
                </span>
                <span className="font-serif tabular-nums text-lg">{g.total}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Editorial pull quote */}
      <section className="border-y border-stone-900 py-16">
        <p className="font-editorial italic text-amber-800 text-sm mb-6 tracking-widest uppercase text-[10px] not-italic">
          &mdash; Palavra da semana
        </p>
        <p className="font-serif text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.15] tracking-[-0.02em] font-light max-w-4xl">
          &ldquo;Não somos administradores de&nbsp;
          <span className="font-editorial italic text-amber-800">números</span>.
          Cada linha desta tabela é um nome que Deus conhece.&rdquo;
        </p>
      </section>
    </div>
  );
}