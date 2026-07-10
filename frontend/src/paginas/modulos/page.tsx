import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar } from "@/lib/api";
import {
  useCreateModulo, useDeleteModulo, useModulos, useUpdateModulo, type Modulo,
} from "./hooks";

export function ModulosPage() {
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const { data, isLoading } = useModulos();
  const create = useCreateModulo();
  const update = useUpdateModulo();
  const del = useDeleteModulo();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Modulo | null>(null);
  const [form, setForm] = useState<Partial<Modulo>>({});

  function abrirNovo() { setEdit(null); setForm({}); setOpen(true); }
  function abrirEdit(m: Modulo) { setEdit(m); setForm(m); setOpen(true); }

  async function salvar() {
    try {
      if (edit) await update.mutateAsync({ id: edit.id, data: form });
      else await create.mutateAsync(form);
      toast.success("Salvo");
      setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }
  async function excluir(m: Modulo) {
    if (!window.confirm(`Excluir módulo ${m.nome}?`)) return;
    try { await del.mutateAsync(m.id); toast.success("Excluído"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-primary">Módulos</h1>
          <p className="text-sm text-muted-foreground">Conteúdos do discipulado</p>
        </div>
        {editor && <Button className="rounded-xl" onClick={abrirNovo}><Plus className="h-4 w-4" /> Novo Módulo</Button>}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : !data || data.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Nenhum módulo.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Aulas</TableHead>
                    {editor && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.ordem ?? "—"}</TableCell>
                      <TableCell className="font-medium">{m.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md truncate">{m.descricao}</TableCell>
                      <TableCell>{m.total_aulas ?? 0}</TableCell>
                      {editor && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => abrirEdit(m)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => excluir(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle className="font-serif text-primary">{edit ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Nome</Label><Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea rows={3} value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Total de Aulas</Label><Input type="number" min={0} value={form.total_aulas ?? ""} onChange={(e) => setForm({ ...form, total_aulas: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Ordem</Label><Input type="number" min={0} value={form.ordem ?? ""} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} /></div>
            </div>
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