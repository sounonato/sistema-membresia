import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Loader2,
  Phone,
  Mail,
  AlertTriangle,
  MessageCircle,
  Pencil,
  Check,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  cn,
  formatDate,
  calcularIdade,
  formatTipoEntrada,
  formatEstadoCivil,
} from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar, type Membro } from "@/lib/api";
import { useMinisterios } from "@/paginas/ministerios/hooks";
import {
  useMembro,
  useViHoje,
  useEnviarWhatsapp,
  useAddMembroMinisterio,
  useRemoveMembroMinisterio,
  useAddCargo,
  useEncerrarCargo,
} from "../hooks";

const STATUS_STYLES: Record<string, string> = {
  ativo: "bg-amber-50 text-amber-800 border border-amber-200",
  inativo: "bg-stone-100 text-stone-600 border border-stone-200",
  transferido: "bg-blue-50 text-blue-700 border border-blue-200",
  falecido: "bg-stone-200 text-stone-500 border border-stone-300",
  excluido: "bg-stone-200 text-stone-500 border border-stone-300",
};

export function MembroDetalhe() {
  const { id } = useParams({ from: "/_auth/membros/$id/" });
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const { data: m, isLoading } = useMembro(id);
  const viHoje = useViHoje();
  const [waOpen, setWaOpen] = useState(false);

  if (isLoading || !m)
    return <Loader2 className="h-6 w-6 animate-spin mx-auto my-16 text-stone-400" />;

  const dias = m.dias_sem_contato ?? 0;
  const alerta = dias > 60;

  return (
    <div className="text-stone-900 space-y-10">
      <PageHeader
        chapter="04"
        eyebrow="Membro"
        title={m.nome}
        lede={m.status === "ativo" ? "Membro ativo" : `Status: ${m.status}`}
        actions={
          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              onClick={async () => {
                try {
                  await viHoje.mutateAsync(m.id);
                  toast.success("Presença registrada! ✓");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Erro");
                }
              }}
              disabled={viHoje.isPending}
              className="rounded-none bg-amber-800 hover:bg-amber-900 text-white h-11 px-5 gap-2"
            >
              {viHoje.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Vi hoje
            </Button>
            <Button
              variant="outline"
              onClick={() => setWaOpen(true)}
              className="rounded-none border-stone-300 h-11 gap-2"
            >
              <MessageCircle className="h-4 w-4" /> Enviar WhatsApp
            </Button>
            {editor && (
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/membros/$id/editar", params: { id } })}
                className="rounded-none border-stone-300 h-11 gap-2"
              >
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <Badge
          className={cn(
            "rounded-none text-[10px] tracking-widest uppercase font-normal",
            STATUS_STYLES[m.status] ?? STATUS_STYLES.inativo,
          )}
        >
          {m.status}
        </Badge>
        {alerta && (
          <span className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Sem contato há {dias} dias
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card title="Contato">
            <div className="flex items-center gap-4 mb-4">
              <div className="grid place-content-center h-20 w-20 rounded-full bg-amber-100 text-amber-800 font-serif text-3xl">
                {m.nome?.[0]?.toUpperCase() ?? "?"}
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <Info label="Telefone">
                <a
                  href={`tel:${m.telefone}`}
                  className="flex items-center gap-2 hover:text-amber-800"
                >
                  <Phone className="h-3.5 w-3.5" /> {m.telefone}
                </a>
              </Info>
              {m.email && (
                <Info label="E-mail">
                  <a
                    href={`mailto:${m.email}`}
                    className="flex items-center gap-2 hover:text-amber-800"
                  >
                    <Mail className="h-3.5 w-3.5" /> {m.email}
                  </a>
                </Info>
              )}
              {m.data_nascimento && (
                <Info label="Nascimento">
                  {formatDate(m.data_nascimento)}
                  {calcularIdade(m.data_nascimento) != null &&
                    ` (${calcularIdade(m.data_nascimento)} anos)`}
                </Info>
              )}
              {m.estado_civil && (
                <Info label="Estado civil">{formatEstadoCivil(m.estado_civil)}</Info>
              )}
              {m.profissao && <Info label="Profissão">{m.profissao}</Info>}
              {(m.cidade || m.estado) && (
                <Info label="Cidade">
                  {[m.cidade, m.estado].filter(Boolean).join(" / ")}
                </Info>
              )}
            </dl>
          </Card>

          <Card title="Vínculo pastoral">
            <dl className="space-y-2 text-sm">
              <Info label="Último contato">
                <span className={cn(dias > 60 && "text-red-700 font-medium")}>
                  {formatDate(m.ultimo_contato)} — há {dias} dias
                </span>
              </Info>
              {m.convertido_id && (
                <Info label="Convertido de origem">
                  <Link
                    to="/convertidos/$id"
                    params={{ id: m.convertido_id }}
                    className="text-amber-800 hover:underline"
                  >
                    Ver convertido
                  </Link>
                </Info>
              )}
              <Info label="Status">
                <Badge
                  className={cn(
                    "rounded-none text-[10px] tracking-widest uppercase font-normal",
                    STATUS_STYLES[m.status] ?? STATUS_STYLES.inativo,
                  )}
                >
                  {m.status}
                </Badge>
              </Info>
            </dl>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="eclesiastico">
            <TabsList className="rounded-none border border-stone-200 bg-white h-auto p-0">
              <TabsTrigger value="eclesiastico" className="rounded-none">
                Eclesiástico
              </TabsTrigger>
              <TabsTrigger value="ministerios" className="rounded-none">
                Ministérios
              </TabsTrigger>
              <TabsTrigger value="cargos" className="rounded-none">
                Cargos
              </TabsTrigger>
              <TabsTrigger value="familia" className="rounded-none">
                Família
              </TabsTrigger>
              {m.status === "transferido" && (
                <TabsTrigger value="transferencia" className="rounded-none">
                  Transferência
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="eclesiastico" className="mt-4">
              <Card>
                <dl className="space-y-2 text-sm">
                  <Info label="Data de entrada">
                    {formatDate(m.data_entrada)} via {formatTipoEntrada(m.tipo_entrada)}
                  </Info>
                  <Info label="Batizado">
                    {m.batizado ? `Sim — ${formatDate(m.data_batismo)}` : "Não"}
                  </Info>
                  <Info label="Fez discipulado">{m.fez_discipulado ? "Sim" : "Não"}</Info>
                  {m.carta_entrada_origem && (
                    <Info label="Carta de entrada">{m.carta_entrada_origem}</Info>
                  )}
                  {m.observacoes && (
                    <Info label="Observações">
                      <span className="font-serif italic">{m.observacoes}</span>
                    </Info>
                  )}
                </dl>
              </Card>
            </TabsContent>

            <TabsContent value="ministerios" className="mt-4">
              <MinisteriosTab membro={m} editor={editor} />
            </TabsContent>

            <TabsContent value="cargos" className="mt-4">
              <CargosTab membro={m} editor={editor} />
            </TabsContent>

            <TabsContent value="familia" className="mt-4">
              <Card>
                <dl className="space-y-2 text-sm">
                  <Info label="Cônjuge">
                    {m.nome_conjuge || m.conjuge_nome_cadastrado || "—"}
                  </Info>
                  <Info label="Filhos">
                    {m.tem_filhos ? `Sim (${m.qtd_filhos})` : "Não"}
                  </Info>
                </dl>
              </Card>
            </TabsContent>

            {m.status === "transferido" && (
              <TabsContent value="transferencia" className="mt-4">
                <Card>
                  <dl className="space-y-2 text-sm">
                    <Info label="Igreja de destino">{m.carta_saida_destino ?? "—"}</Info>
                    <Info label="Data de saída">{formatDate(m.data_saida)}</Info>
                    <Info label="Motivo">{m.motivo_saida ?? "—"}</Info>
                  </dl>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <WhatsappModal membro={m} open={waOpen} onClose={() => setWaOpen(false)} />
    </div>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="border border-stone-200 bg-white p-6">
      {title && (
        <h3 className="text-[10px] tracking-widest uppercase text-stone-500 mb-4">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 items-baseline">
      <dt className="text-[10px] tracking-widest uppercase text-stone-500">{label}</dt>
      <dd className="text-stone-800">{children}</dd>
    </div>
  );
}

function MinisteriosTab({ membro, editor }: { membro: Membro; editor: boolean }) {
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState("");
  const [cargo, setCargo] = useState("");
  const { data: ministerios } = useMinisterios();
  const add = useAddMembroMinisterio(membro.id);
  const remove = useRemoveMembroMinisterio(membro.id);

  const lista = (membro.ministerios ?? []).slice().sort((a, b) => Number(b.ativo) - Number(a.ativo));

  return (
    <Card>
      {lista.length === 0 ? (
        <p className="text-sm text-stone-500 italic">Sem vínculos ministeriais.</p>
      ) : (
        <ul className="space-y-2">
          {lista.map((mm) => (
            <li
              key={mm.id}
              className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif">{mm.ministerio_nome}</span>
                {mm.cargo && (
                  <span className="text-xs text-stone-500">— {mm.cargo}</span>
                )}
                <Badge
                  className={cn(
                    "rounded-none text-[10px] tracking-widest uppercase font-normal",
                    mm.ativo
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-stone-100 text-stone-500 border border-stone-200",
                  )}
                >
                  {mm.ativo ? "ativo" : "inativo"}
                </Badge>
              </div>
              {editor && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={async () => {
                    if (!window.confirm(`Remover de ${mm.ministerio_nome}?`)) return;
                    try {
                      await remove.mutateAsync(mm.ministerio_id);
                      toast.success("Removido do ministério");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Erro");
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editor && (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="rounded-none border-stone-300 mt-4 gap-2"
        >
          <Plus className="h-4 w-4" /> Adicionar a ministério
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar a ministério</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500">
                Ministério
              </Label>
              <Select value={selId} onValueChange={setSelId}>
                <SelectTrigger className="rounded-none border-stone-300 mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(ministerios ?? [])
                    .filter((m) => m.ativo)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500">
                Cargo (opcional)
              </Label>
              <Input
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="rounded-none border-stone-300 mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-none"
            >
              Cancelar
            </Button>
            <Button
              disabled={!selId || add.isPending}
              onClick={async () => {
                try {
                  await add.mutateAsync({
                    ministerio_id: selId,
                    cargo: cargo || undefined,
                  });
                  toast.success("Adicionado ao ministério");
                  setOpen(false);
                  setSelId("");
                  setCargo("");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Erro");
                }
              }}
              className="rounded-none bg-stone-900 hover:bg-amber-800 text-amber-50"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CargosTab({ membro, editor }: { membro: Membro; editor: boolean }) {
  const [open, setOpen] = useState(false);
  const [cargo, setCargo] = useState("");
  const [dataPosse, setDataPosse] = useState("");
  const add = useAddCargo(membro.id);
  const enc = useEncerrarCargo(membro.id);

  return (
    <Card>
      {(membro.cargos ?? []).length === 0 ? (
        <p className="text-sm text-stone-500 italic">Sem cargos registrados.</p>
      ) : (
        <ul className="space-y-2">
          {(membro.cargos ?? []).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif">{c.cargo}</span>
                {c.data_posse && (
                  <span className="text-xs text-stone-500">
                    desde {formatDate(c.data_posse)}
                  </span>
                )}
                <Badge
                  className={cn(
                    "rounded-none text-[10px] tracking-widest uppercase font-normal",
                    c.ativo
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-stone-100 text-stone-500 border border-stone-200",
                  )}
                >
                  {c.ativo ? "ativo" : "encerrado"}
                </Badge>
              </div>
              {editor && c.ativo && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!window.confirm(`Encerrar cargo ${c.cargo}?`)) return;
                    try {
                      await enc.mutateAsync({
                        cargoId: c.id,
                        data: { data_fim: new Date().toISOString().slice(0, 10) },
                      });
                      toast.success("Cargo encerrado");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Erro");
                    }
                  }}
                >
                  Encerrar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editor && (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="rounded-none border-stone-300 mt-4 gap-2"
        >
          <Plus className="h-4 w-4" /> Adicionar cargo
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar cargo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500">
                Cargo
              </Label>
              <Input
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex.: Diácono, Presbítero, Pastor"
                className="rounded-none border-stone-300 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500">
                Data de posse
              </Label>
              <Input
                type="date"
                value={dataPosse}
                onChange={(e) => setDataPosse(e.target.value)}
                className="rounded-none border-stone-300 mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-none"
            >
              Cancelar
            </Button>
            <Button
              disabled={!cargo || add.isPending}
              onClick={async () => {
                try {
                  await add.mutateAsync({
                    cargo,
                    data_posse: dataPosse || undefined,
                  });
                  toast.success("Cargo adicionado");
                  setOpen(false);
                  setCargo("");
                  setDataPosse("");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Erro");
                }
              }}
              className="rounded-none bg-stone-900 hover:bg-amber-800 text-amber-50"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function WhatsappModal({
  membro,
  open,
  onClose,
}: {
  membro: Membro;
  open: boolean;
  onClose: () => void;
}) {
  const enviar = useEnviarWhatsapp();
  const dias = membro.dias_sem_contato ?? 0;
  const inativo = dias >= 60;

  const template = inativo
    ? `Olá, ${membro.nome}! 😊\n\nA gente sente sua falta por aqui! 💛\n\nComo você está? Estamos com saudade e pensando em você.\n\nQue Deus te abençoe! 🙏\n— Igreja do Nazareno`
    : `Olá, ${membro.nome}! 😊\n\nPassando pra dar um oi e saber como você está.\n\nQue Deus continue te abençoando! 🙏\n— Igreja do Nazareno`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar follow-up pastoral</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-stone-700">
          <p>
            <span className="text-stone-500">Para:</span> {membro.nome}
          </p>
          <p>
            <span className="text-stone-500">Número:</span> {membro.telefone}
          </p>
          <p>
            <span className="text-stone-500">Último contato:</span> há {dias} dias
          </p>
          <p className="text-[10px] tracking-widest uppercase text-stone-500 pt-2">
            {inativo ? "Mensagem de saudade" : "Mensagem de contato"}
          </p>
          <blockquote className="border-l-2 border-amber-400 pl-4 py-2 bg-amber-50 font-serif italic text-stone-700 whitespace-pre-line">
            {template}
          </blockquote>
          <p className="text-xs text-stone-500">
            A mensagem será enviada via WhatsApp para o número cadastrado.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-none">
            Cancelar
          </Button>
          <Button
            disabled={enviar.isPending}
            onClick={async () => {
              try {
                const res = (await enviar.mutateAsync(membro.id)) as {
                  sucesso?: boolean;
                  aviso?: string;
                };
                if (res?.sucesso === false) {
                  toast.error(res.aviso || "Erro ao enviar");
                } else {
                  toast.success("Mensagem enviada com sucesso!");
                }
                onClose();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Erro ao enviar");
              }
            }}
            className="rounded-none bg-amber-800 hover:bg-amber-900 text-white gap-2"
          >
            {enviar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar envio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}