import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, FileText, BarChart3, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Row = Record<string, string | number | null | undefined>;

function fmtDate(d?: string | null) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("pt-BR");
}

function dentroPeriodo(d: string | null | undefined, ini?: string, fim?: string) {
  if (!d) return !ini && !fim;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return false;
  if (ini && dt < new Date(ini)) return false;
  if (fim && dt > new Date(fim + "T23:59:59")) return false;
  return true;
}

function exportExcel(nome: string, linhas: Row[]) {
  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, `${nome}.xlsx`);
}

function exportPDF(titulo: string, igreja: string, linhas: Row[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text(titulo, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${igreja} · ${new Date().toLocaleDateString("pt-BR")}`, 14, 25);
  const colunas = linhas.length > 0 ? Object.keys(linhas[0]) : [];
  autoTable(doc, {
    startY: 30,
    head: [colunas],
    body: linhas.map((r) => colunas.map((c) => String(r[c] ?? ""))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [180, 83, 9], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 249] },
  });
  doc.save(`${titulo.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}

export function RelatoriosPage() {
  const { igreja } = useAuth();
  const igrejaNome = igreja?.nome ?? "Igreja do Nazareno";
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");

  const convertidos = useQuery<any[]>({
    queryKey: ["convertidos"],
    queryFn: () => api.getConvertidos(),
  });
  const modulos = useQuery<any[]>({
    queryKey: ["modulos"],
    queryFn: () => api.getModulos(),
  });
  const grupos = useQuery<any[]>({
    queryKey: ["grupos"],
    queryFn: () => api.getGrupos(),
  });

  const lista = convertidos.data ?? [];

  // Convertidos por período
  const convertidosFiltrados = useMemo<Row[]>(
    () =>
      lista
        .filter((c) =>
          dentroPeriodo(c.data_conversao ?? c.created_at, ini, fim),
        )
        .map((c) => ({
          Nome: c.nome,
          Telefone: c.telefone ?? "",
          Bairro: c.bairro ?? "",
          "Data conversão": fmtDate(c.data_conversao),
          Batizado: c.batizado ? "Sim" : "Não",
          "Quer batizar": c.quer_batizar ? "Sim" : "Não",
          "Fez discipulado": c.fez_discipulado ? "Sim" : "Não",
        })),
    [lista, ini, fim],
  );

  // Aniversariantes do mês
  const aniversariantes = useMemo<Row[]>(() => {
    const mes = new Date().getMonth();
    return lista
      .filter((c) => {
        if (!c.data_nascimento) return false;
        const d = new Date(c.data_nascimento);
        return !isNaN(d.getTime()) && d.getMonth() === mes;
      })
      .sort((a, b) => {
        const da = new Date(a.data_nascimento).getDate();
        const db = new Date(b.data_nascimento).getDate();
        return da - db;
      })
      .map((c) => ({
        Dia: new Date(c.data_nascimento).getDate(),
        Nome: c.nome,
        Telefone: c.telefone ?? "",
        Idade: new Date().getFullYear() - new Date(c.data_nascimento).getFullYear(),
      }));
  }, [lista]);

  // Decisões e batismos por período
  const decisoesBatismos = useMemo<Row[]>(() => {
    const decisoes = lista.filter((c) => dentroPeriodo(c.data_conversao, ini, fim)).length;
    const batismos = lista.filter(
      (c) => c.batizado && dentroPeriodo((c as any).data_batismo, ini, fim),
    ).length;
    const querBatizar = lista.filter((c) => !c.batizado && c.quer_batizar).length;
    return [
      { Indicador: "Decisões registradas", Quantidade: decisoes },
      { Indicador: "Batismos realizados", Quantidade: batismos },
      { Indicador: "Aguardando batismo", Quantidade: querBatizar },
    ];
  }, [lista, ini, fim]);

  // Progresso por módulo (resumo)
  const progressoModulos = useMemo<Row[]>(() => {
    const mods = modulos.data ?? [];
    return mods.map((m: any) => {
      const concluidos = lista.filter((c: any) =>
        Array.isArray(c.modulos_concluidos) && c.modulos_concluidos.includes(m.id),
      ).length;
      return {
        Módulo: m.nome,
        "Alunos concluídos": concluidos,
        "Total de alunos": lista.length,
        "% conclusão": lista.length ? `${Math.round((concluidos / lista.length) * 100)}%` : "0%",
      };
    });
  }, [modulos.data, lista]);

  // Resumo por grupo
  const resumoGrupos = useMemo<Row[]>(() => {
    const gs = grupos.data ?? [];
    return gs.map((g: any) => ({
      Grupo: g.nome,
      Discipulador: g.discipulador?.nome ?? g.discipulador_nome ?? "—",
      Membros: Array.isArray(g.membros) ? g.membros.length : g.total_membros ?? 0,
    }));
  }, [grupos.data]);

  if (convertidos.isLoading) {
    return (
      <div className="grid place-content-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid place-content-center h-10 w-10 rounded-2xl bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-3xl text-primary">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Exporte dados para PDF e Excel
          </p>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Período inicial</Label>
            <Input type="date" value={ini} onChange={(e) => setIni(e.target.value)} className="rounded-xl h-9" />
          </div>
          <div>
            <Label className="text-xs">Período final</Label>
            <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="rounded-xl h-9" />
          </div>
          <p className="text-xs text-muted-foreground ml-auto">
            Filtros aplicam-se aos relatórios marcados com período
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="convertidos">
        <TabsList className="rounded-xl flex-wrap h-auto">
          <TabsTrigger value="convertidos" className="rounded-lg">Convertidos</TabsTrigger>
          <TabsTrigger value="aniversariantes" className="rounded-lg">Aniversariantes</TabsTrigger>
          <TabsTrigger value="decisoes" className="rounded-lg">Decisões/Batismos</TabsTrigger>
          <TabsTrigger value="modulos" className="rounded-lg">Progresso de módulos</TabsTrigger>
          <TabsTrigger value="grupos" className="rounded-lg">Grupos</TabsTrigger>
        </TabsList>

        <TabsContent value="convertidos" className="mt-4">
          <RelatorioTabela
            titulo="Convertidos por período"
            igreja={igrejaNome}
            linhas={convertidosFiltrados}
          />
        </TabsContent>
        <TabsContent value="aniversariantes" className="mt-4">
          <RelatorioTabela
            titulo="Aniversariantes do mês"
            igreja={igrejaNome}
            linhas={aniversariantes}
          />
        </TabsContent>
        <TabsContent value="decisoes" className="mt-4">
          <RelatorioTabela
            titulo="Decisões e batismos"
            igreja={igrejaNome}
            linhas={decisoesBatismos}
          />
        </TabsContent>
        <TabsContent value="modulos" className="mt-4">
          <RelatorioTabela
            titulo="Progresso por módulo"
            igreja={igrejaNome}
            linhas={progressoModulos}
          />
        </TabsContent>
        <TabsContent value="grupos" className="mt-4">
          <RelatorioTabela
            titulo="Grupos de discipulado"
            igreja={igrejaNome}
            linhas={resumoGrupos}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RelatorioTabela({
  titulo,
  igreja,
  linhas,
}: {
  titulo: string;
  igreja: string;
  linhas: Row[];
}) {
  const colunas = linhas.length > 0 ? Object.keys(linhas[0]) : [];
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="font-serif text-primary">{titulo}</CardTitle>
          <p className="text-xs text-muted-foreground">{linhas.length} registro(s)</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => exportExcel(titulo.replace(/\s+/g, "_").toLowerCase(), linhas)}
            disabled={linhas.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => exportPDF(titulo, igreja, linhas)}
            disabled={linhas.length === 0}
          >
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Nenhum dado para o período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  {colunas.map((c) => (
                    <th key={c} className="text-left px-3 py-2 font-medium text-foreground">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    {colunas.map((c) => (
                      <td key={c} className="px-3 py-2 text-foreground/80">
                        {String(r[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {linhas.length > 50 && (
              <p className="text-xs text-muted-foreground px-3 py-2 border-t border-border">
                Mostrando 50 de {linhas.length}. Exporte para ver todos.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}