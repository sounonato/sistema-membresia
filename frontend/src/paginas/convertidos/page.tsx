import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar } from "@/lib/api";
import { useConvertidos, useDeleteConvertido } from "./hooks";

const PAGE_SIZE = 10;

export function ConvertidosPage() {
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const { data, isLoading } = useConvertidos();
  const del = useDeleteConvertido();
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase().trim();
    const list = data ?? [];
    if (!t) return list;
    return list.filter(
      (c) =>
        c.nome?.toLowerCase().includes(t) || (c.telefone ?? "").toLowerCase().includes(t),
    );
  }, [data, busca]);

  const totalPag = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pagSegura = Math.min(pagina, totalPag);
  const itens = filtrados.slice((pagSegura - 1) * PAGE_SIZE, pagSegura * PAGE_SIZE);

  async function onExcluir(id: string, nome: string) {
    if (!window.confirm(`Excluir convertido "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await del.mutateAsync(id);
      toast.success("Convertido excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-primary">Convertidos</h1>
          <p className="text-sm text-muted-foreground">Cadastro e acompanhamento</p>
        </div>
        {editor && (
          <Button asChild className="rounded-xl">
            <Link to="/convertidos/novo">
              <Plus className="h-4 w-4" /> Novo Convertido
            </Link>
          </Button>
        )}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nome ou telefone"
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : itens.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Nenhum convertido encontrado.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data da Conversão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.telefone}</TableCell>
                      <TableCell>{formatDate(c.data_conversao)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{c.status ?? "ativo"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="icon" variant="ghost" title="Ver">
                            <Link to="/convertidos/$id" params={{ id: c.id }}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {editor && (
                            <>
                              <Button asChild size="icon" variant="ghost" title="Editar">
                                <Link to="/convertidos/$id/editar" params={{ id: c.id }}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Excluir"
                                onClick={() => onExcluir(c.id, c.nome)}
                                disabled={del.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filtrados.length > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Página {pagSegura} de {totalPag} — {filtrados.length} registros
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagSegura === 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagSegura === totalPag}
                  onClick={() => setPagina((p) => Math.min(totalPag, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("pt-BR");
}