import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";

type Row = Record<string, string | number | null | undefined>;

function fmtDate(d?: string | null) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("pt-BR");
}

function formatGender(g?: string | null) {
  if (g === "feminino") return "Feminino";
  if (g === "masculino") return "Masculino";
  if (g === "outro") return "Outro";
  return "Não informado";
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
  const igrejaNome = igreja?.nome ?? "Ovile";
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");
  const [diasSemContato, setDiasSemContato] = useState(60);

  const search = useSearch({ from: "/_auth/relatorios" }) as { tab?: string };
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(search.tab || "convertidos");

  useEffect(() => {
    if (search.tab && search.tab !== activeTab) {
      setActiveTab(search.tab);
    }
  }, [search.tab]);

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

  // Queries para relatórios de membros
  const membrosQuery = useQuery<any>({
    queryKey: ["membros-relatorio"],
    queryFn: () => api.getMembros("?status=ativo&por_pagina=1000"),
    enabled: activeTab === "membros",
  });
  const metricasQuery = useQuery<any>({
    queryKey: ["membros-metricas-relatorio"],
    queryFn: () => api.getMembrosMetricas(),
    enabled: activeTab === "aniversariantes-membros" || activeTab === "por-ministerio",
  });
  const semContatoQuery = useQuery<any[]>({
    queryKey: ["membros-sem-contato", diasSemContato],
    queryFn: () => api.getMembrosSemContato(diasSemContato),
    enabled: activeTab === "sem-contato",
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

  // Membros ativos por período
  const membrosFiltrados = useMemo<Row[]>(() => {
    const list = membrosQuery.data?.data ?? [];
    return list
      .filter((m: any) => dentroPeriodo(m.data_entrada, ini, fim))
      .map((m: any) => {
        const minList = Array.isArray(m.ministerios)
          ? m.ministerios.map((x: any) => x.nome).join(", ")
          : "";
        return {
          Nome: m.nome,
          Telefone: m.telefone ?? "",
          Gênero: formatGender(m.genero),
          "Data Entrada": fmtDate(m.data_entrada),
          "Tipo Entrada": m.tipo_entrada
            ? m.tipo_entrada === "batismo"
              ? "Batismo"
              : m.tipo_entrada === "transferencia"
                ? "Transferência"
                : m.tipo_entrada === "aclamacao"
                  ? "Aclamação"
                  : "Reconciliação"
            : "—",
          Batizado: m.batizado ? "Sim" : "Não",
          Ministérios: minList || "Nenhum",
        };
      });
  }, [membrosQuery.data, ini, fim]);

  // Aniversariantes de membros
  const aniversariantesMembros = useMemo<Row[]>(() => {
    const list = metricasQuery.data?.aniversariantes_mes ?? [];
    return list.map((m: any) => {
      const dia = m.data_nascimento ? new Date(m.data_nascimento).getDate() : "—";
      return {
        Dia: dia,
        Nome: m.nome,
        Telefone: m.telefone ?? "",
        Idade: m.idade !== undefined ? `${m.idade} anos` : "—",
      };
    });
  }, [metricasQuery.data]);

  // Membros sem contato
  const semContatoFiltrados = useMemo<Row[]>(() => {
    const list = semContatoQuery.data ?? [];
    return list.map((m: any) => ({
      Nome: m.nome,
      Telefone: m.telefone ?? "",
      "Último Contato": fmtDate(m.ultimo_contato),
      "Dias sem contato": m.dias_sem_contato !== undefined ? `${m.dias_sem_contato} dias` : "—",
    }));
  }, [semContatoQuery.data]);

  // Membros por ministério
  const ministeriosMembros = useMemo<Row[]>(() => {
    const list = metricasQuery.data?.por_ministerio ?? [];
    return list.map((m: any) => ({
      Ministério: m.ministerio,
      "Total de Membros": m.quantidade,
    }));
  }, [metricasQuery.data]);

  if (convertidos.isLoading) {
    return (
      <div className="grid place-content-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        chapter="03"
        eyebrow="Administração · Prestação de contas"
        title="Relatórios"
        lede="Números vira memória — memória vira estratégia. Escolha o intervalo e exporte a página do livro."
      />

      <div className="flex flex-wrap items-end gap-6 pb-6 mb-8 border-b border-stone-300/70">
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-stone-500">Início</Label>
          <Input type="date" value={ini} onChange={(e) => setIni(e.target.value)}
            className="mt-1 rounded-none border-0 border-b border-stone-400 focus-visible:ring-0 focus-visible:border-primary bg-transparent h-9 w-44" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-stone-500">Fim</Label>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)}
            className="mt-1 rounded-none border-0 border-b border-stone-400 focus-visible:ring-0 focus-visible:border-primary bg-transparent h-9 w-44" />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-stone-500 ml-auto max-w-xs italic font-serif normal-case tracking-normal text-sm">
          Filtros aplicam-se aos relatórios com período.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          navigate({ search: { tab: val } as any });
        }}
      >
        <TabsList className="rounded-none bg-transparent border-b border-stone-300 p-0 h-auto gap-6 flex-wrap justify-start">
          {[
            ["convertidos", "Convertidos"],
            ["aniversariantes", "Aniversariantes (Conv.)"],
            ["decisoes", "Decisões / Batismos"],
            ["modulos", "Módulos"],
            ["grupos", "Grupos"],
            ["membros", "Membros"],
            ["aniversariantes-membros", "Aniversariantes (Membros)"],
            ["sem-contato", "Sem Contato"],
            ["por-ministerio", "Por Ministério"],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-2 text-[11px] uppercase tracking-widest shadow-none">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="convertidos" className="mt-6">
          <RelatorioTabela
            titulo="Convertidos por período"
            igreja={igrejaNome}
            linhas={convertidosFiltrados}
          />
        </TabsContent>
        <TabsContent value="aniversariantes" className="mt-6">
          <RelatorioTabela
            titulo="Aniversariantes do mês (Novos Convertidos)"
            igreja={igrejaNome}
            linhas={aniversariantes}
          />
        </TabsContent>
        <TabsContent value="decisoes" className="mt-6">
          <RelatorioTabela
            titulo="Decisões e batismos"
            igreja={igrejaNome}
            linhas={decisoesBatismos}
          />
        </TabsContent>
        <TabsContent value="modulos" className="mt-6">
          <RelatorioTabela
            titulo="Progresso por módulo"
            igreja={igrejaNome}
            linhas={progressoModulos}
          />
        </TabsContent>
        <TabsContent value="grupos" className="mt-6">
          <RelatorioTabela
            titulo="Grupos de discipulado"
            igreja={igrejaNome}
            linhas={resumoGrupos}
          />
        </TabsContent>
        <TabsContent value="membros" className="mt-6">
          {membrosQuery.isLoading ? (
            <div className="grid place-content-center py-12 text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <RelatorioTabela
              titulo="Membros Ativos"
              igreja={igrejaNome}
              linhas={membrosFiltrados}
            />
          )}
        </TabsContent>
        <TabsContent value="aniversariantes-membros" className="mt-6">
          {metricasQuery.isLoading ? (
            <div className="grid place-content-center py-12 text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <RelatorioTabela
              titulo="Aniversariantes do Mês (Membros)"
              igreja={igrejaNome}
              linhas={aniversariantesMembros}
            />
          )}
        </TabsContent>
        <TabsContent value="sem-contato" className="mt-6">
          <div className="bg-white border border-stone-200 p-6 mb-6 rounded-none flex items-center gap-4 max-w-sm">
            <Label className="text-xs uppercase tracking-wider text-stone-500 shrink-0">Período sem contato:</Label>
            <select
              value={diasSemContato}
              onChange={(e) => setDiasSemContato(Number(e.target.value))}
              className="w-full rounded-none border border-stone-300 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:border-amber-800"
            >
              <option value={30}>Mais de 30 dias</option>
              <option value={60}>Mais de 60 dias</option>
              <option value={90}>Mais de 90 dias</option>
            </select>
          </div>
          {semContatoQuery.isLoading ? (
            <div className="grid place-content-center py-12 text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <RelatorioTabela
              titulo={`Membros sem contato há ${diasSemContato}+ dias`}
              igreja={igrejaNome}
              linhas={semContatoFiltrados}
            />
          )}
        </TabsContent>
        <TabsContent value="por-ministerio" className="mt-6">
          {metricasQuery.isLoading ? (
            <div className="grid place-content-center py-12 text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <RelatorioTabela
              titulo="Membros por Ministério"
              igreja={igrejaNome}
              linhas={ministeriosMembros}
            />
          )}
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
    <div className="bg-white border border-stone-200">
      <div className="flex flex-row items-end justify-between gap-3 flex-wrap p-6 border-b border-stone-200">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Folha</p>
          <h2 className="mt-1 font-serif text-2xl text-stone-900">{titulo}</h2>
          <p className="text-xs italic text-stone-500 mt-1">{linhas.length} registro(s)</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none border-stone-400"
            onClick={() => exportExcel(titulo.replace(/\s+/g, "_").toLowerCase(), linhas)}
            disabled={linhas.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button
            size="sm"
            className="rounded-none bg-stone-900 hover:bg-stone-800"
            onClick={() => exportPDF(titulo, igreja, linhas)}
            disabled={linhas.length === 0}
          >
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>
      <div className="p-6">
        {linhas.length === 0 ? (
          <p className="text-sm italic font-serif text-stone-500 text-center py-12">
            Nenhum dado para o período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-300">
                  {colunas.map((c) => (
                    <th key={c} className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-stone-500 font-normal">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b border-stone-100 hover:bg-stone-50">
                    {colunas.map((c) => (
                      <td key={c} className="px-3 py-2.5 text-stone-800">
                        {String(r[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {linhas.length > 50 && (
              <p className="text-xs italic text-stone-500 px-3 py-3 border-t border-stone-200">
                Mostrando 50 de {linhas.length}. Exporte para ver todos.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}