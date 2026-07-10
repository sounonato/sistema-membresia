import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, Download, QrCode, Link as LinkIcon, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useGrupos } from "@/paginas/discipulado/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function QrCadastroPage() {
  const { usuario, igreja } = useAuth();
  const slugAtivo = (usuario as any)?.igreja_slug ?? igreja?.slug ?? "";
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
      <div className="text-muted-foreground">Nenhuma igreja vinculada à sua conta.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <div className="grid place-content-center h-10 w-10 rounded-2xl bg-primary text-primary-foreground">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-foreground">QR Code de Cadastro</h1>
          <p className="text-sm text-muted-foreground">
            Gere e imprima o QR Code para que novos convertidos se cadastrem
            sozinhos ao final do curso.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <Card className="rounded-2xl p-6 space-y-5 print:hidden">
          <div>
            <Label className="text-sm">Tipo de QR Code</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger className="mt-1.5">
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
            <p className="text-xs text-muted-foreground mt-2">
              O QR de grupo já vincula o novo convertido àquele grupo de discipulado.
            </p>
          </div>

          <div>
            <Label className="text-sm flex items-center gap-2">
              <LinkIcon className="h-3.5 w-3.5" /> Link gerado
            </Label>
            <div className="mt-1.5 flex gap-2">
              <code className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 truncate">
                {url}
              </code>
              <Button type="button" variant="outline" size="icon" onClick={copiarLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={baixarPNG} className="flex-1 gap-2">
              <Download className="h-4 w-4" /> Baixar PNG
            </Button>
            <Button onClick={imprimir} variant="outline" className="flex-1 gap-2">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl p-8 flex flex-col items-center justify-center text-center print:shadow-none print:border-0">
          <p className="text-primary text-xs uppercase tracking-widest font-medium">
            {igreja?.nome ?? "Igreja do Nazareno"}
          </p>
          <h2 className="font-serif text-2xl text-foreground mt-1">
            {grupoNome ? `Cadastro · ${grupoNome}` : "Cadastro de Convertido"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Aponte a câmera do seu celular para o QR Code abaixo e preencha o
            formulário para fazer parte da nossa família.
          </p>
          <div
            ref={canvasRef}
            className="mt-6 rounded-2xl bg-white p-5 border border-border shadow-sm"
          >
            <QRCodeCanvas
              value={url || origin}
              size={260}
              level="H"
              includeMargin={false}
              fgColor="#92400e"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-4 break-all max-w-sm">{url}</p>
        </Card>
      </div>
    </div>
  );
}