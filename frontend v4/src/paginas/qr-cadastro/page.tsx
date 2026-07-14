import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, Download, Copy } from "lucide-react";
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

type Tipo = "convertido" | "membro";

function QrCard({
  tipo,
  url,
  igrejaNome,
  grupoNome,
}: {
  tipo: Tipo;
  url: string;
  igrejaNome: string;
  grupoNome?: string | null;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  function copiar() {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  function baixar() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${tipo}-${igrejaNome.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  const titulo = tipo === "convertido"
    ? (grupoNome ?? "Faça parte")
    : "Seja membro";

  const subtitulo = tipo === "convertido"
    ? "uma cadeira já está posta no seu nome."
    : "formalize sua membresia na igreja.";

  const label = tipo === "convertido" ? "Novo Convertido" : "Cadastro de Membro";

  return (
    <div className="bg-card border border-border flex flex-col">
      {/* Header do card */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</span>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copiar} title="Copiar link">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={baixar} title="Baixar PNG">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.print()} title="Imprimir">
            <Printer className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* QR */}
      <div className="flex flex-col items-center justify-center text-center p-8 flex-1">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{igrejaNome}</p>
        <h2 className="font-serif text-3xl text-foreground mt-2 leading-tight">{titulo}</h2>
        <p className="font-[Instrument_Serif,serif] italic text-base text-muted-foreground mt-1">{subtitulo}</p>
        <div ref={canvasRef} className="mt-6 bg-white p-4 border border-foreground">
          <QRCodeCanvas value={url} size={200} level="H" includeMargin={false} fgColor="#92400e" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 break-all max-w-xs">{url}</p>
      </div>
    </div>
  );
}

export function QrCadastroPage() {
  const { igreja, slug } = useAuth();
  const slugAtivo = igreja?.slug ?? slug ?? "";
  const { data: grupos } = useGrupos();
  const [grupoId, setGrupoId] = useState<string>("__geral");

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const urlConvertido = slugAtivo
    ? grupoId !== "__geral"
      ? `${origin}/cadastro/${slugAtivo}?grupo=${grupoId}`
      : `${origin}/cadastro/${slugAtivo}`
    : "";

  const urlMembro = slugAtivo ? `${origin}/cadastro-membro/${slugAtivo}` : "";

  const igrejaNome = igreja?.nome ?? "Ovile";
  const grupoNome = grupoId !== "__geral"
    ? grupos?.find((g) => g.id === grupoId)?.nome
    : null;

  if (!slugAtivo) {
    return <div className="text-muted-foreground italic font-serif">Nenhuma igreja vinculada à sua conta.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <PageHeader
          chapter="02"
          eyebrow="Ministério · Ponte digital"
          title="QR de cadastro"
          lede="Dois QR Codes: um para novos convertidos, outro para registro de membros."
        />
      </div>

      {/* Filtro de grupo — só afeta o QR de convertido */}
      <div className="print:hidden max-w-xs">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Grupo para o QR de convertido
        </Label>
        <Select value={grupoId} onValueChange={setGrupoId}>
          <SelectTrigger className="mt-2 rounded-none border-0 border-b border-stone-400 focus:ring-0 bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__geral">Geral da igreja</SelectItem>
            {(grupos ?? []).map((g) => (
              <SelectItem key={g.id} value={g.id}>Grupo: {g.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs italic font-serif text-muted-foreground mt-1">
          O QR de grupo já vincula o convertido ao grupo de discipulado.
        </p>
      </div>

      {/* Os dois QR Codes lado a lado */}
      <div className="grid md:grid-cols-2 gap-6">
        <QrCard tipo="convertido" url={urlConvertido} igrejaNome={igrejaNome} grupoNome={grupoNome} />
        <QrCard tipo="membro" url={urlMembro} igrejaNome={igrejaNome} />
      </div>
    </div>
  );
}
