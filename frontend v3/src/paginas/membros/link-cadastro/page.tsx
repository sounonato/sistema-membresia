import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, Download, Link as LinkIcon, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export function MembroLinkCadastroPage() {
  const { igreja, slug } = useAuth();
  const slugAtivo = igreja?.slug ?? slug ?? "";
  const canvasRef = useRef<HTMLDivElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = slugAtivo ? `${origin}/cadastro-membro/${slugAtivo}` : "";

  function copiarLink() {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  function copiarWhatsApp() {
    const texto = `✝️ *${igreja?.nome ?? "Nossa Igreja"}*\n\nFaça parte oficialmente da nossa membresia! Clique no link abaixo e preencha seu cadastro:\n\n${url}`;
    navigator.clipboard.writeText(texto);
    toast.success("Mensagem copiada! Cole no grupo do WhatsApp.");
  }

  function baixarPNG() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-membresia-${slugAtivo}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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
          chapter="03"
          eyebrow="Membresia · Cadastro público"
          title="Link de cadastro"
          lede="Compartilhe no grupo da igreja — qualquer pessoa com o link pode se cadastrar como membro."
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
        {/* Painel de ações */}
        <div className="bg-white border border-stone-200 p-6 space-y-6 print:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 flex items-center gap-2 mb-3">
              <LinkIcon className="h-3.5 w-3.5" /> Link de cadastro
            </p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-stone-50 border border-stone-200 px-3 py-2 truncate break-all">
                {url}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-none border-stone-400 shrink-0"
                onClick={copiarLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs italic font-serif text-stone-500 mt-2">
              Qualquer pessoa que abrir este link poderá se cadastrar na membresia sem precisar fazer login.
            </p>
          </div>

          <div className="border-t border-stone-200 pt-6 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Compartilhar</p>
            <Button
              onClick={copiarWhatsApp}
              className="w-full gap-2 rounded-none bg-stone-900 hover:bg-amber-800 text-amber-50 justify-start"
            >
              <Copy className="h-4 w-4" />
              Copiar mensagem para WhatsApp
            </Button>
            <Button
              onClick={baixarPNG}
              variant="outline"
              className="w-full gap-2 rounded-none border-stone-400 justify-start"
            >
              <Download className="h-4 w-4" />
              Baixar QR Code (PNG)
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="w-full gap-2 rounded-none border-stone-400 justify-start"
            >
              <Printer className="h-4 w-4" />
              Imprimir QR Code
            </Button>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white border border-stone-300 p-10 flex flex-col items-center justify-center text-center print:shadow-none print:border-0 relative">
          <div className="absolute top-4 left-4 right-4 border-t border-b border-stone-200 h-2" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-stone-500">
            {igreja?.nome ?? "Igreja do Nazareno"}
          </p>
          <h2 className="font-serif text-4xl text-stone-900 mt-3 leading-tight">
            Cadastro de membros
          </h2>
          <p className="font-[Instrument_Serif,serif] italic text-lg text-stone-600 mt-2">
            a sua história faz parte da nossa.
          </p>
          <div ref={canvasRef} className="mt-8 bg-white p-6 border border-stone-900">
            <QRCodeCanvas
              value={url || origin}
              size={260}
              level="H"
              includeMargin={false}
              fgColor="#92400e"
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-4 max-w-sm">
            Aponte a câmera do celular
          </p>
          <p className="text-[10px] text-stone-400 mt-1 break-all max-w-sm">{url}</p>
        </div>
      </div>
    </div>
  );
}
