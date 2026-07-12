import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, Download, Link as LinkIcon, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useGrupos } from "@/paginas/discipulado/hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";

export function QrCadastroPage() {
  const { igreja, slug } = useAuth();
  const slugAtivo = igreja?.slug ?? slug ?? "";
  const { data: grupos } = useGrupos();
  const [grupoId, setGrupoId] = useState<string>("__geral");
  const canvasRef = useRef<HTMLDivElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = useMemo(() => {
    if (!slugAtivo) return "";
    const base = `${origin}/cadastro/${slugAtivo}`;
    return grupoId && grupoId !== "__geral" ? `${base}?grupo=${grupoId}` : base;
  }, [origin, slugAtivo, grupoId]);

  const grupoNome =
    grupoId !== "__geral" ? grupos?.find((g) => g.id === grupoId)?.nome : null;

  function copiarLink() {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  function baixarPNG() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-cadastro-${slugAtivo}${grupoNome ? `-${grupoNome}` : ""}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function imprimir() {
    window.print();
  }

  if (!slugAtivo) {
    return (
      <div className="text-stone-500 italic font-serif">Nenhuma igreja vinculada à sua conta.</div>
    );
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          chapter="02"
          eyebrow="Ministério · Ponte digital"
          title="QR de cadastro"
          lede="Um retângulo de tinta e código: aponte a câmera e a próxima história começa a ser escrita."
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
        <div className="bg-white border border-stone-200 p-6 space-y-6 print:hidden">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-stone-500">Tipo de QR</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger className="mt-2 rounded-none border-0 border-b border-stone-400 focus:ring-0 focus:border-primary bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__geral">QR Geral da igreja</SelectItem>
                {(grupos ?? []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    Grupo: {g.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs italic font-serif text-stone-500 mt-2">
              O QR de grupo já vincula o novo convertido àquele grupo de discipulado.
            </p>
          </div>

          <div>
            <Label className="text-[10px] uppercase tracking-widest text-stone-500 flex items-center gap-2">
              <LinkIcon className="h-3.5 w-3.5" /> Link gerado
            </Label>
            <div className="mt-2 flex gap-2">
              <code className="flex-1 text-xs bg-stone-50 border border-stone-200 px-3 py-2 truncate">
                {url}
              </code>
              <Button type="button" variant="outline" size="icon" className="rounded-none border-stone-400" onClick={copiarLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-stone-200">
            <Button onClick={baixarPNG} className="flex-1 gap-2 rounded-none bg-stone-900 hover:bg-stone-800">
              <Download className="h-4 w-4" /> Baixar PNG
            </Button>
            <Button onClick={imprimir} variant="outline" className="flex-1 gap-2 rounded-none border-stone-400">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>

        <div className="bg-white border border-stone-300 p-10 flex flex-col items-center justify-center text-center print:shadow-none print:border-0 relative">
          <div className="absolute top-4 left-4 right-4 border-t border-b border-stone-200 h-2" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-stone-500">
            {igreja?.nome ?? "Ovile"}
          </p>
          <h2 className="font-serif text-4xl text-stone-900 mt-3 leading-tight">
            {grupoNome ? grupoNome : "Faça parte"}
          </h2>
          <p className="font-[Instrument_Serif,serif] italic text-lg text-stone-600 mt-2">
            uma cadeira já está posta no seu nome.
          </p>
          <div
            ref={canvasRef}
            className="mt-8 bg-white p-6 border border-stone-900"
          >
            <QRCodeCanvas
              value={url || origin}
              size={260}
              level="H"
              includeMargin={false}
              fgColor="#92400e"
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-4 max-w-sm">Aponte a câmera do celular</p>
          <p className="text-[10px] text-stone-400 mt-1 break-all max-w-sm">{url}</p>
        </div>
      </div>
    </div>
  );
}