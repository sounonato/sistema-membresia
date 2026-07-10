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
import { PageHeader } from "@/components/layout/PageHeader";

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
    <div>
      <PageHeader
        chapter="02"
        eyebrow="Ministério · Pessoas"
        title="Discipuladores"
        lede="Os que caminham ao lado — cada nome aqui carrega um pequeno rebanho."
        actions={editor && (
          <Button className="rounded-none border border-stone-900 bg-stone-900 hover:bg-stone-800" onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo discipulador
          </Button>
        )}
      />

      <div className="bg-white border border-stone-200">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : !data || data.length === 0 ? (
            <p className="text-center py-10 text-sm text-stone-500 italic font-serif">Ninguém cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-stone-300">
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500 w-10">Nº</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500">Nome</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500">Telefone</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500">E-mail</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500 text-right">Grupos</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500">Ativo</TableHead>
                    {editor && <TableHead className="text-right text-[10px] uppercase tracking-widest text-stone-500">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d, i) => (
                    <TableRow key={d.id} className="border-stone-200 hover:bg-stone-50">
                      <TableCell className="font-serif italic text-stone-400 tabular-nums">{String(i + 1).padStart(2, "0")}</TableCell>
                      <TableCell className="font-serif text-lg text-stone-900">{d.nome}</TableCell>
                      <TableCell className="text-sm text-stone-700">{d.telefone ?? "—"}</TableCell>
                      <TableCell className="text-sm italic text-stone-600">{d.email ?? "—"}</TableCell>
                      <TableCell className="text-right font-serif text-lg tabular-nums text-stone-900">{d.qtd_grupos ?? 0}</TableCell>
                      <TableCell>
                        <span className={d.ativo === false
                          ? "text-[10px] uppercase tracking-widest text-stone-500 border-b border-stone-400 pb-0.5"
                          : "text-[10px] uppercase tracking-widest text-emerald-700 border-b border-emerald-600 pb-0.5"}>
                          {d.ativo === false ? "inativo" : "ativo"}
                        </span>
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
        </div>
      </div>

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