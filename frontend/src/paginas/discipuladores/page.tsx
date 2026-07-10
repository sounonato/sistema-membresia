import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar } from "@/lib/api";
import {
  useCreateDiscipulador, useDeleteDiscipulador, useDiscipuladores, useUpdateDiscipulador,
  type Discipulador,
} from "./hooks";

export function DiscipuladoresPage() {
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const { data, isLoading } = useDiscipuladores();
  const create = useCreateDiscipulador();
  const update = useUpdateDiscipulador();
  const del = useDeleteDiscipulador();

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Discipulador | null>(null);
  const [form, setForm] = useState<Partial<Discipulador>>({});

  function abrirNovo() { setEdit(null); setForm({ ativo: true }); setOpen(true); }
  function abrirEdit(d: Discipulador) { setEdit(d); setForm(d); setOpen(true); }

  async function salvar() {
    try {
      if (edit) await update.mutateAsync({ id: edit.id, data: form });
      else await create.mutateAsync(form);
      toast.success("Salvo");
      setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }
  async function excluir(d: Discipulador) {
    if (!window.confirm(`Excluir ${d.nome}?`)) return;
    try { await del.mutateAsync(d.id); toast.success("Excluído"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-primary">Discipuladores</h1>
          <p className="text-sm text-muted-foreground">Gestão dos líderes de grupos</p>
        </div>
        {editor && (
          <Button className="rounded-xl" onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo Discipulador
          </Button>
        )}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : !data || data.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Nenhum discipulador.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Grupos</TableHead>
                    <TableHead>Ativo</TableHead>
                    {editor && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.nome}</TableCell>
                      <TableCell>{d.telefone ?? "—"}</TableCell>
                      <TableCell>{d.email ?? "—"}</TableCell>
                      <TableCell>{d.qtd_grupos ?? 0}</TableCell>
                      <TableCell>
                        <Badge className={d.ativo === false ? "bg-stone-200 text-stone-700" : "bg-green-100 text-green-800"}>
                          {d.ativo === false ? "Não" : "Sim"}
                        </Badge>
                      </TableCell>
                      {editor && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => abrirEdit(d)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => excluir(d)} disabled={del.isPending}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">
              {edit ? "Editar Discipulador" : "Novo Discipulador"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Campo label="Nome"><Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Campo>
            <Campo label="Telefone"><Input value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Campo>
            <Campo label="E-mail"><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Campo>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}