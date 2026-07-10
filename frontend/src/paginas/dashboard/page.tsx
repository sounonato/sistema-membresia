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
  Legend,
} from "recharts";
import { Users, HeartHandshake, Droplets, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "./hooks";

const PIE_COLORS = ["#b45309", "#d97706", "#92400e", "#fbbf24"];

function Kpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="grid place-content-center h-12 w-12 rounded-2xl bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-serif text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid place-content-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const stats = data ?? {};
  const porMes = (stats.convertidos_por_mes ?? []).map((r: { mes: string; quantidade: number }) => ({
    mes: r.mes?.slice(5) ?? r.mes,
    quantidade: Number(r.quantidade),
  }));
  const porGenero = (stats.por_genero ?? []).map((r: { genero: string; quantidade: number }) => ({
    genero: r.genero ?? "Não informado",
    quantidade: Number(r.quantidade),
  }));
  const porFaixa = (stats.por_faixa_etaria ?? []).map((r: { faixa: string; quantidade: number; nomes: string[] }) => ({
    faixa: r.faixa,
    quantidade: Number(r.quantidade),
    nomes: r.nomes ?? [],
  }));

  function TooltipFaixa({ active, payload }: { active?: boolean; payload?: { payload: { faixa: string; quantidade: number; nomes: string[] } }[] }) {
    if (!active || !payload?.length) return null;
    const { faixa, quantidade, nomes } = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-xl p-3 shadow-md text-sm max-w-xs">
        <p className="font-medium text-primary mb-1">{faixa} — {quantidade} {quantidade === 1 ? "pessoa" : "pessoas"}</p>
        <ul className="space-y-0.5 text-muted-foreground">
          {nomes.map((n, i) => <li key={i}>· {n}</li>)}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da membresia</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total de Convertidos" value={stats.total_convertidos ?? 0} icon={Users} />
        <Kpi label="Grupos Ativos" value={stats.grupos_ativos ?? 0} icon={HeartHandshake} />
        <Kpi label="Batizados" value={stats.batizados ?? 0} icon={Droplets} />
        <Kpi label="Aguardando Discipulado" value={stats.aguardando_discipulado ?? 0} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-primary">Convertidos por mês</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMes}>
                <XAxis dataKey="mes" stroke="#92400e" fontSize={12} />
                <YAxis stroke="#92400e" fontSize={12} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#b45309" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-serif text-primary">Distribuição por gênero</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porGenero}
                  dataKey="quantidade"
                  nameKey="genero"
                  innerRadius={45}
                  outerRadius={80}
                >
                  {porGenero.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-primary">Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porFaixa}>
              <XAxis dataKey="faixa" stroke="#92400e" fontSize={12} />
              <YAxis stroke="#92400e" fontSize={12} allowDecimals={false} />
              <Tooltip content={<TooltipFaixa />} />
              <Bar dataKey="quantidade" fill="#b45309" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}