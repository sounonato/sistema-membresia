import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Plus, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar, type Membro } from "@/lib/api";
import { useMembros, useExcluirMembro } from "./hooks";
import { useMinisterios } from "@/paginas/ministerios/hooks";

const STATUS_STYLES: Record<string, string> = {
  ativo: "bg-primary/10 text-primary border border-primary/20",
  inativo: "bg-muted text-muted-foreground border border-border",
  transferido: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  falecido: "bg-muted text-muted-foreground border border-border",
  excluido: "bg-muted text-muted-foreground border border-border",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "rounded-none capitalize text-[10px] tracking-widest uppercase font-normal",
        STATUS_STYLES[status] ?? STATUS_STYLES.inativo,
      )}
    >
      {status}
    </Badge>
  );
}

function ContatoCell({ m }: { m: Membro }) {
  const dias = m.dias_sem_contato ?? 0;
  if (dias > 90)
    return (
      <Badge className="rounded-none bg-destructive/10 text-destructive border border-destructive/20 font-normal">
        {dias} dias — urgente
      </Badge>
    );
  if (dias > 60)
    return (
      <Badge className="rounded-none bg-primary/10 text-primary border border-primary/20 font-normal">
        {dias} dias
      </Badge>
    );
  return <span className="text-sm text-muted-foreground">{formatDate(m.ultimo_contato)}</span>;
}

export function MembrosPage() {
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const isAdmin = usuario?.perfil === "admin";

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("__todos");
  const [ministerioId, setMinisterioId] = useState("__todos");
  const [pagina, setPagina] = useState(1);

  const { data: resultado, isLoading } = useMembros({
    busca,
    status,
    ministerio_id: ministerioId,
    pagina,
    por_pagina: 50,
  });
  const data = resultado?.data ?? [];
  const totalPaginas = resultado?.paginas ?? 1;
  const { data: ministerios } = useMinisterios();
  const excluir = useExcluirMembro();

  async function onExcluir(m: Membro) {
    if (!window.confirm(`Excluir "${m.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await excluir.mutateAsync(m.id);
      toast.success("Membro excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <div className="text-foreground">
      <PageHeader
        chapter="04"
        eyebrow="Pastoral · Cadastro"
        title="Membros"
        lede="Registro formal da membresia da igreja."
        actions={
          editor && (
            <Button
              asChild
              className="rounded-none bg-primary text-primary-foreground hover:opacity-90 h-11 px-5 gap-2"
            >
              <Link to="/membros/novo">
                <Plus className="h-4 w-4" /> Novo membro
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-[1fr_200px_240px] mb-8 print:hidden">
        <div className="flex items-center border-b border-border pb-2 gap-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 font-serif text-base h-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="rounded-none border-border h-11">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="transferido">Transferidos</SelectItem>
            <SelectItem value="falecido">Falecidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ministerioId} onValueChange={setMinisterioId}>
          <SelectTrigger className="rounded-none border-border h-11">
            <SelectValue placeholder="Ministério" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos">Todos os ministérios</SelectItem>
            {(ministerios ?? []).map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin mx-auto my-16 text-muted-foreground" />
      ) : data.length === 0 ? (
        <p className="text-center py-16 font-serif italic text-muted-foreground">
          Nenhum membro encontrado — tente ajustar os filtros.
        </p>
      ) : (
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="px-4 py-3 font-normal">Telefone</th>
                <th className="px-4 py-3 font-normal">Entrada</th>
                <th className="px-4 py-3 font-normal">Último contato</th>
                <th className="px-4 py-3 font-normal">Ministérios</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => {
                const mins = m.ministerios ?? [];
                return (
                  <tr key={m.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        to="/membros/$id"
                        params={{ id: m.id }}
                        className="font-serif text-base text-foreground hover:text-primary"
                      >
                        {m.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{m.telefone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(m.data_entrada)}</td>
                    <td className="px-4 py-3">
                      <ContatoCell m={m} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {mins.slice(0, 2).map((mm) => (
                          <span
                            key={mm.id}
                            className="text-xs px-2 py-0.5 border border-border bg-muted text-foreground"
                          >
                            {mm.ministerio_nome}
                          </span>
                        ))}
                        {mins.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{mins.length - 2}</span>
                        )}
                        {mins.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" title="Ver">
                          <Link to="/membros/$id" params={{ id: m.id }}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {editor && (
                          <Button asChild size="icon" variant="ghost" title="Editar">
                            <Link to="/membros/$id/editar" params={{ id: m.id }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Excluir"
                            onClick={() => onExcluir(m)}
                            disabled={excluir.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-700" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
          <span>
            Página {pagina} de {totalPaginas} · {resultado?.total} membros
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-3 py-1.5 border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="px-3 py-1.5 border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}