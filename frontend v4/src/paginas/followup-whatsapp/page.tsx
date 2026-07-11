import { useState } from "react";
import { Loader2, MessageCircle, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Membro } from "@/lib/api";
import { useMembrosSemContato, useViHoje } from "@/paginas/membros/hooks";

export function FollowupWhatsappPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === "admin";
  const { data: urgentes, isLoading: l1 } = useMembrosSemContato(90);
  const { data: atencao, isLoading: l2 } = useMembrosSemContato(60);
  const somenteAtencao = (atencao ?? []).filter(
    (m) => (m.dias_sem_contato ?? 0) <= 90,
  );
  const urg = urgentes ?? [];

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress, setProgress] = useState<{ atual: number; total: number } | null>(
    null,
  );

  async function dispararTodos() {
    setConfirmOpen(false);
    let ok = 0;
    let err = 0;
    setProgress({ atual: 0, total: urg.length });
    for (let i = 0; i < urg.length; i++) {
      try {
        const res = (await api.enviarWhatsapp(urg[i].id)) as { sucesso?: boolean };
        if (res?.sucesso === false) err++;
        else ok++;
      } catch {
        err++;
      }
      setProgress({ atual: i + 1, total: urg.length });
    }
    setProgress(null);
    toast.success(`Follow-up concluído: ${ok} enviados, ${err} erros`);
  }

  return (
    <div className="text-stone-900 space-y-10">
      <PageHeader
        chapter="06"
        eyebrow="Pastoral · Cuidado"
        title="Follow-up"
        lede="Membros que estão precisando de contato pastoral."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Kpi
          n={urg.length}
          label="mais de 90 dias"
          tone="red"
        />
        <Kpi
          n={somenteAtencao.length}
          label="entre 60 e 90 dias"
          tone="amber"
        />
      </div>

      {isAdmin && urg.length > 0 && (
        <div>
          <Button
            onClick={() => setConfirmOpen(true)}
            className="rounded-none bg-red-700 hover:bg-red-800 text-white gap-2"
            disabled={!!progress}
          >
            {progress ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando {progress.atual} de {progress.total}...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Disparar follow-up para todos os urgentes
              </>
            )}
          </Button>
        </div>
      )}

      <Section
        label="Urgente — sem contato há mais de 90 dias"
        tone="red"
        loading={l1}
        membros={urg}
      />
      <Section
        label="Atenção — entre 60 e 90 dias"
        tone="amber"
        loading={l2}
        membros={somenteAtencao}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar disparo em massa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-700">
            Você está prestes a enviar WhatsApp para {urg.length} membros sem
            contato há mais de 90 dias. Confirmar?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="rounded-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={dispararTodos}
              className="rounded-none bg-red-700 hover:bg-red-800 text-white"
            >
              Sim, enviar todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: "red" | "amber";
}) {
  const styles =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-800"
      : "border-amber-300 bg-amber-50 text-amber-800";
  return (
    <div className={`border ${styles} p-6`}>
      <p className="font-serif text-5xl tabular-nums">{n}</p>
      <p className="text-xs uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function Section({
  label,
  tone,
  loading,
  membros,
}: {
  label: string;
  tone: "red" | "amber";
  loading: boolean;
  membros: Membro[];
}) {
  const border = tone === "red" ? "border-l-red-400" : "border-l-amber-400";
  return (
    <section>
      <div
        className={`border-l-4 ${border} pl-4 mb-4 flex items-center gap-2 text-sm text-stone-700`}
      >
        <AlertTriangle className="h-4 w-4" />
        <h2 className="font-serif text-lg">{label}</h2>
      </div>
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin mx-auto my-8 text-stone-400" />
      ) : membros.length === 0 ? (
        <p className="text-sm text-stone-500 italic pl-4">
          Ninguém nesta categoria — glória a Deus.
        </p>
      ) : (
        <ul className="space-y-2">
          {membros.map((m) => (
            <MembroCard key={m.id} membro={m} tone={tone} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MembroCard({ membro, tone }: { membro: Membro; tone: "red" | "amber" }) {
  const viHoje = useViHoje();
  const [waOpen, setWaOpen] = useState(false);
  const dias = membro.dias_sem_contato ?? 0;
  const diasColor = tone === "red" ? "text-red-700" : "text-amber-800";

  return (
    <li className="border border-stone-200 bg-white p-4 flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="font-serif text-lg truncate">{membro.nome}</p>
        <p className={`text-sm ${diasColor} ${dias > 90 ? "font-bold" : ""}`}>
          Sem contato há {dias} dias
        </p>
        <p className="text-xs text-stone-500">{membro.telefone}</p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            try {
              await viHoje.mutateAsync(membro.id);
              toast.success("Presença registrada! ✓");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Erro");
            }
          }}
          className="rounded-none bg-amber-800 hover:bg-amber-900 text-white gap-2"
          disabled={viHoje.isPending}
        >
          <Check className="h-3.5 w-3.5" /> Vi hoje
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setWaOpen(true)}
          className="rounded-none border-stone-300 gap-2"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </Button>
      </div>
      <WhatsappMiniModal membro={membro} open={waOpen} onClose={() => setWaOpen(false)} />
    </li>
  );
}

function WhatsappMiniModal({
  membro,
  open,
  onClose,
}: {
  membro: Membro;
  open: boolean;
  onClose: () => void;
}) {
  const [sending, setSending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar WhatsApp para {membro.nome}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-stone-600">
          Será enviada uma mensagem de saudade para {membro.telefone}.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-none">
            Cancelar
          </Button>
          <Button
            disabled={sending}
            onClick={async () => {
              setSending(true);
              try {
                const res = (await api.enviarWhatsapp(membro.id)) as {
                  sucesso?: boolean;
                  aviso?: string;
                };
                if (res?.sucesso === false) toast.error(res.aviso || "Erro");
                else toast.success("Mensagem enviada!");
                onClose();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Erro");
              } finally {
                setSending(false);
              }
            }}
            className="rounded-none bg-amber-800 hover:bg-amber-900 text-white"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}