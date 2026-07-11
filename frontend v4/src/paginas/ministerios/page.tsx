import { useState } from "react";
import { Loader2, Users, User, Pencil, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar, type Ministerio, type Membro } from "@/lib/api";
import { useMembros, useRemoveMembroMinisterio } from "@/paginas/membros/hooks";
import {
  useMinisterios,
  useMinisterio,
  useCriarMinisterio,
  useEditarMinisterio,
  useExcluirMinisterio,
} from "./hooks";

export function MinisteriosPage() {
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const { data, isLoading } = useMinisterios();
  const excluir = useExcluirMinisterio();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ministerio | undefined>();
  const [detalheId, setDetalheId] = useState<string | null>(null);

  async function onExcluir(m: Ministerio) {
    if (!window.confirm(`Excluir "${m.nome}"?`)) return;
    try {
      await excluir.mutateAsync(m.id);
      toast.success("Ministério excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="text-stone-900">
      <PageHeader
        chapter="05"
        eyebrow="Ministério · Organização"
        title="Ministérios"
        lede="Os grupos de serviço e atuação da casa."
        actions={
          editor && (
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
              className="rounded-none bg-stone-900 text-amber-50 hover:bg-amber-800 h-11 px-5 gap-2"
            >
              <Plus className="h-4 w-4" /> Novo ministério
            </Button>
          )
        }
      />

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin mx-auto my-16 text-stone-400" />
      ) : !data || data.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <p className="font-serif italic text-stone-500">
            Nenhum ministério cadastrado ainda.
          </p>
          {editor && (
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
              className="rounded-none bg-stone-900 text-amber-50 hover:bg-amber-800"
            >
              Criar primeiro ministério
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <article
              key={m.id}
              className="border border-stone-200 border-l-4 border-l-amber-700 bg-white p-6 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-serif text-xl leading-tight">{m.nome}</h3>
                <Badge
                  className={cn(
                    "rounded-none text-[10px] tracking-widest uppercase font-normal",
                    m.ativo
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-stone-100 text-stone-500 border border-stone-200",
                  )}
                >
                  {m.ativo ? "ativo" : "inativo"}
                </Badge>
              </div>
              <p className="text-sm text-stone-600 flex items-center gap-2 mb-1">
                <User className="h-3.5 w-3.5 text-stone-400" />
                {m.lider_nome ?? "Sem líder definido"}
              </p>
              <p className="text-sm text-stone-600 flex items-center gap-2 mb-4">
                <Users className="h-3.5 w-3.5 text-stone-400" />
                {m.total_membros ?? 0} membro(s)
              </p>
              <div className="mt-auto flex items-center gap-1 pt-4 border-t border-stone-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetalheId(m.id)}
                  className="rounded-none"
                >
                  Ver membros
                </Button>
                {editor && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(m);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onExcluir(m)}
                      disabled={excluir.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-stone-500 hover:text-red-700" />
                    </Button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <MinisterioFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
      />
      {detalheId && (
        <MinisterioDetalheModal
          id={detalheId}
          onClose={() => setDetalheId(null)}
          editor={editor}
        />
      )}
    </div>
  );
}

function MinisterioFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Ministerio;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [liderId, setLiderId] = useState<string>("");
  const criar = useCriarMinisterio();
  const editar = useEditarMinisterio(editing?.id ?? "");
  const { data: membrosAtivosPaginado } = useMembros({ status: "ativo", por_pagina: 100 });
  const membrosAtivos = membrosAtivosPaginado?.data;

  const isEdit = !!editing;

  // reset on open
  if (open && editing && nome === "" && editing.nome) {
    setNome(editing.nome);
    setDescricao(editing.descricao ?? "");
    setLiderId(editing.lider_id ?? "");
  }

  async function onSave() {
    if (!nome.trim()) return;
    const payload = {
      nome,
      descricao: descricao || undefined,
      lider_id: liderId || null,
    };
    try {
      if (isEdit) await editar.mutateAsync(payload);
      else await criar.mutateAsync(payload);
      toast.success(isEdit ? "Ministério atualizado" : "Ministério criado");
      setNome("");
      setDescricao("");
      setLiderId("");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setNome("");
          setDescricao("");
          setLiderId("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ministério" : "Novo ministério"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500">Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-none border-stone-300 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500">
              Descrição
            </Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="rounded-none border-stone-300 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500">Líder</Label>
            <Select value={liderId} onValueChange={setLiderId}>
              <SelectTrigger className="rounded-none border-stone-300 mt-1">
                <SelectValue placeholder="Sem líder" />
              </SelectTrigger>
              <SelectContent>
                {(membrosAtivos ?? []).map((m: Membro) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-none">
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={criar.isPending || editar.isPending}
            className="rounded-none bg-stone-900 hover:bg-amber-800 text-amber-50"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MinisterioDetalheModal({
  id,
  onClose,
  editor,
}: {
  id: string;
  onClose: () => void;
  editor: boolean;
}) {
  const { data, isLoading } = useMinisterio(id);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {data?.nome ?? "Carregando..."}
          </DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto my-8 text-stone-400" />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              <span className="text-stone-500">Líder:</span>{" "}
              {data.lider_nome ?? "—"}
            </p>
            {data.descricao && (
              <p className="text-sm font-serif italic text-stone-700">
                {data.descricao}
              </p>
            )}
            <div>
              <h4 className="text-[10px] tracking-widest uppercase text-stone-500 mb-2">
                Membros
              </h4>
              {(data.membros ?? []).filter((m) => m.ativo).length === 0 ? (
                <p className="text-sm text-stone-500 italic">Sem membros ativos.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {(data.membros ?? [])
                    .filter((m) => m.ativo)
                    .map((m) => (
                      <MembroLinha
                        key={m.vinculo_id}
                        vinculoId={m.vinculo_id}
                        membroId={m.membro_id}
                        ministerioId={data.id}
                        nome={m.membro_nome}
                        cargo={m.cargo}
                        telefone={m.telefone}
                        editor={editor}
                      />
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-none">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MembroLinha({
  membroId,
  ministerioId,
  nome,
  cargo,
  telefone,
  editor,
}: {
  vinculoId: string;
  membroId: string;
  ministerioId: string;
  nome: string;
  cargo?: string | null;
  telefone: string;
  editor: boolean;
}) {
  const remove = useRemoveMembroMinisterio(membroId);
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="grid place-content-center h-8 w-8 rounded-full bg-amber-100 text-amber-800 font-serif">
        {nome[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-serif truncate">{nome}</p>
        <p className="text-xs text-stone-500 truncate">
          {cargo ? `${cargo} · ` : ""}
          {telefone}
        </p>
      </div>
      {editor && (
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            if (!window.confirm(`Remover ${nome} do ministério?`)) return;
            try {
              await remove.mutateAsync(ministerioId);
              toast.success("Removido");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Erro");
            }
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </li>
  );
}