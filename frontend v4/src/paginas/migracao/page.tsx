import { useState, useRef } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet, FileUp, Info, HelpCircle, ArrowRight } from "lucide-react";
import { useImportarMembros } from "./hooks";

type ImportResult = {
  importados: number;
  ignorados: number;
  erros: { linha: number; erro: string }[];
};

export function MigracaoPage() {
  const [sistema, setSistema] = useState<"inchurch">("inchurch");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [resultado, setResultado] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const mutation = useImportarMembros();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        setFile(selectedFile);
      } else {
        toast.error("Por favor, envie apenas arquivos Excel (.xlsx ou .xls)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        setFile(selectedFile);
      } else {
        toast.error("Por favor, envie apenas arquivos Excel (.xlsx ou .xls)");
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append("arquivo", file);
    formData.append("sistema", sistema);

    try {
      const res = await mutation.mutateAsync(formData);
      setResultado(res);
      toast.success("Processamento de importação concluído!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro desconhecido ao importar");
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultado(null);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        chapter="01"
        eyebrow="Ferramentas · Migração"
        title="Migração de Dados"
        lede="Traga seus membros de outros sistemas para o Ovile com rapidez e integridade."
      />

      {!resultado ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Passo 1 — Sistema de Origem */}
          <div className="md:col-span-3 space-y-3">
            <h2 className="font-serif text-xl text-stone-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-sans">1</span>
              Selecione o sistema de origem
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Card InChurch */}
              <button
                onClick={() => setSistema("inchurch")}
                className={`relative flex flex-col p-5 border text-left transition-all duration-300 ${
                  sistema === "inchurch"
                    ? "border-primary bg-amber-50/20 shadow-sm"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="font-serif text-lg font-medium text-stone-950">InChurch</span>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${sistema === "inchurch" ? "bg-primary" : "border border-stone-300"}`}>
                    {sistema === "inchurch" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Importe membros de planilhas exportadas (.xlsx) do sistema InChurch.
                </p>
              </button>

              {/* Card Brevemente */}
              <div className="flex flex-col p-5 border border-dashed border-stone-200 bg-stone-50/50 opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="font-serif text-lg font-medium text-stone-400">Outros sistemas</span>
                  <HelpCircle className="h-4 w-4 text-stone-400" />
                </div>
                <p className="text-xs text-stone-400">
                  Em breve suporte a outros sistemas de gestão eclesial.
                </p>
              </div>
            </div>
          </div>

          {/* Passo 2 — Instruções de Exportação */}
          <div className="md:col-span-1 space-y-3">
            <h2 className="font-serif text-xl text-stone-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-sans">2</span>
              Instruções de exportação
            </h2>
            
            <Card className="border-stone-200 bg-white">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Siga os passos abaixo para obter o arquivo correto do seu painel atual.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="border-l-2 border-primary/20 pl-3">
                    <p className="text-xs font-medium text-stone-900">Passo 2.1</p>
                    <p className="text-xs text-stone-600">Acesse o painel do InChurch com credenciais de administrador.</p>
                  </div>
                  <div className="border-l-2 border-primary/20 pl-3">
                    <p className="text-xs font-medium text-stone-900">Passo 2.2</p>
                    <p className="text-xs text-stone-600">Navegue no menu lateral em <strong>Membros → Exportar</strong>.</p>
                  </div>
                  <div className="border-l-2 border-primary/20 pl-3">
                    <p className="text-xs font-medium text-stone-900">Passo 2.3</p>
                    <p className="text-xs text-stone-600">Escolha a opção de exportação em formato <strong>Excel (.xlsx)</strong>.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Passo 3 — Envio e Upload */}
          <div className="md:col-span-2 space-y-3">
            <h2 className="font-serif text-xl text-stone-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-sans">3</span>
              Envie o arquivo exportado
            </h2>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-primary bg-amber-50/10"
                    : file
                    ? "border-stone-400 bg-stone-50/30"
                    : "border-stone-300 hover:border-primary/50 hover:bg-stone-50/20"
                }`}
              >
                {file ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="p-3 bg-amber-100/50 rounded-full text-primary">
                      <FileSpreadsheet className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">{file.name}</p>
                      <p className="text-xs text-stone-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remover arquivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="p-3 bg-stone-100 rounded-full text-stone-500">
                      <FileUp className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        Arraste seu arquivo Excel aqui ou clique para selecionar
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Formatos aceitos: .xlsx ou .xls (Tamanho máximo: 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleImport}
                  disabled={!file || mutation.isPending}
                  className="rounded-none border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 px-6 py-2 h-auto"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando membros...
                    </>
                  ) : (
                    <>
                      Importar membros
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tela de Resultados da Importação */
        <div className="space-y-6">
          <h2 className="font-serif text-2xl text-stone-950">Resultado da Importação</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sucesso */}
            <div className="flex items-center gap-4 p-5 border border-stone-200 bg-white">
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-serif font-semibold text-stone-900 tabular-nums">
                  {resultado.importados}
                </p>
                <p className="text-xs text-stone-500">Membros importados</p>
              </div>
            </div>

            {/* Ignorados */}
            <div className="flex items-center gap-4 p-5 border border-stone-200 bg-white">
              <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-serif font-semibold text-stone-900 tabular-nums">
                  {resultado.ignorados}
                </p>
                <p className="text-xs text-stone-500">Duplicados (ignorados)</p>
              </div>
            </div>

            {/* Erros */}
            <div className="flex items-center gap-4 p-5 border border-stone-200 bg-white">
              <div className={`p-3 rounded-full ${resultado.erros.length > 0 ? "bg-red-100 text-red-600" : "bg-stone-100 text-stone-500"}`}>
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-serif font-semibold text-stone-900 tabular-nums">
                  {resultado.erros.length}
                </p>
                <p className="text-xs text-stone-500">Erros encontrados</p>
              </div>
            </div>
          </div>

          {resultado.erros.length > 0 && (
            <div className="border border-stone-200 bg-white">
              <div className="px-5 py-4 border-b border-stone-150">
                <h3 className="font-serif text-lg text-stone-950">Log detalhado de inconsistências</h3>
                <p className="text-xs text-stone-500 mt-0.5">As linhas abaixo continham inconsistências e foram puladas.</p>
              </div>
              
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-stone-200">
                      <TableHead className="w-20 text-[10px] uppercase tracking-widest text-stone-500">Linha</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest text-stone-500">Inconsistência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.erros.map((err, idx) => (
                      <TableRow key={idx} className="border-stone-100 hover:bg-stone-50">
                        <TableCell className="font-serif italic text-stone-400 tabular-nums">
                          {String(err.linha).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="text-xs text-red-600 font-mono">
                          {err.erro}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-none border-stone-300"
            >
              Nova Importação
            </Button>
            <Button
              onClick={() => window.location.href = "/membros"}
              className="rounded-none border border-stone-900 bg-stone-900 text-white hover:bg-stone-800"
            >
              Ver Membros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
