import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, Download, Link as LinkIcon, Copy, QrCode } from "lucide-react";
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
  const { usuario, igreja } = useAuth();
  // usa igreja_slug retornado pelo /me
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

  const nomeIgreja = igreja?.nome ?? (usuario as any)?.igreja_nome ?? "Igreja";

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
    <div className="space-y-8">
      <div className="print:hidden">
        <PageHeader
          chapter="02"
          eyebrow="Ministério · Ponte digital"
          title="QR de cadastro"
          lede="Escolha o modelo e compartilhe — link direto ou QR code para imprimir."
        />
      </div>

      {/* Filtro de grupo */}
      <div className="print:hidden max-w-sm">
        <Label className="text-xs uppercase tracking-widest text-stone-500">Grupo de destino</Label>
        <Select value={grupoId} onValueChange={setGrupoId}>
          <SelectTrigger className="mt-2 rounded-none border-0 border-b border-stone-400 focus:ring-0 focus:border-primary bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__geral">Cadastro geral da igreja</SelectItem>
            {(grupos ?? []).map((g) => (
              <SelectItem key={g.id} value={g.id}>
                Grupo: {g.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs italic font-serif text-stone-500 mt-1">
          O QR de grupo já vincula o convertido àquele grupo de discipulado.
        </p>
      </div>

      {/* Dois modelos lado a lado */}
      <div className="grid lg:grid-cols-2 gap-6 print:grid-cols-1">

        {/* Modelo 1 — Link */}
        <div className="print:hidden border border-stone-200 bg-white p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-200 pb-5">
            <div className="grid place-content-center h-10 w-10 rounded-full bg-stone-100">
              <LinkIcon className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-500">Modelo</p>
              <h2 className="font-serif text-xl text-stone-900">Link de cadastro</h2>
            </div>
          </div>

          <div>
            <p className="text-sm text-stone-600 mb-4">
              Envie este link pelo WhatsApp, Instagram ou e-mail. O convertido preenche o formulário direto do celular.
            </p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-stone-50 border border-stone-200 px-3 py-2.5 truncate text-stone-700 rounded-sm">
                {url}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-sm border-stone-300 shrink-0"
                onClick={copiarLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-sm p-4">
            <p className="text-xs text-stone-500 mb-1 uppercase tracking-widest">Preview</p>
            <p className="font-serif text-lg text-stone-900">{grupoNome ? grupoNome : "Cadastro — " + nomeIgreja}</p>
            <p className="text-sm text-stone-500 mt-0.5 italic font-serif">uma cadeira já está posta no seu nome.</p>
          </div>

          <Button
            onClick={copiarLink}
            className="w-full gap-2 rounded-sm bg-stone-900 hover:bg-amber-800"
          >
            <Copy className="h-4 w-4" /> Copiar link
          </Button>
        </div>

        {/* Modelo 2 — QR Code */}
        <div className="border border-stone-200 bg-white p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-200 pb-5 print:hidden">
            <div className="grid place-content-center h-10 w-10 rounded-full bg-stone-100">
              <QrCode className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-500">Modelo</p>
              <h2 className="font-serif text-xl text-stone-900">QR Code para imprimir</h2>
            </div>
          </div>

          {/* Área imprimível */}
          <div className="flex flex-col items-center text-center py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
              {nomeIgreja}
            </p>
            <h3 className="font-serif text-3xl text-stone-900 mt-2 leading-tight">
              {grupoNome ? grupoNome : "Faça parte"}
            </h3>
            <p className="font-[Instrument_Serif,serif] italic text-base text-stone-600 mt-1">
              uma cadeira já está posta no seu nome.
            </p>

            <div ref={canvasRef} className="mt-6 bg-white p-5 border border-stone-900">
              <QRCodeCanvas
                value={url || origin}
                size={220}
                level="H"
                includeMargin={false}
                fgColor="#92400e"
              />
            </div>

            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-4">
              Aponte a câmera do celular
            </p>
            <p className="text-[10px] text-stone-400 mt-1 break-all max-w-xs">{url}</p>
          </div>

          <div className="flex gap-2 print:hidden">
            <Button
              onClick={baixarPNG}
              className="flex-1 gap-2 rounded-sm bg-stone-900 hover:bg-amber-800"
            >
              <Download className="h-4 w-4" /> Baixar PNG
            </Button>
            <Button
              onClick={imprimir}
              variant="outline"
              className="flex-1 gap-2 rounded-sm border-stone-300"
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
