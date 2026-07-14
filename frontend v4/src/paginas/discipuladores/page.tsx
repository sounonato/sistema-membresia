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
import { api, podeEditar } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
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

  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Discipulador | null>(null);
  const [form, setForm] = useState<Partial<Discipulador>>({});

  // Acesso login discipulador
  const [acessoOpen, setAcessoOpen] = useState(false);
  const [acessoDiscipulador, setAcessoDiscipulador] = useState<Discipulador | null>(null);
  const [acessoEmail, setAcessoEmail] = useState("");
  const [acessoSenha, setAcessoSenha] = useState("");
  const [acessoLoading, setAcessoLoading] = useState(false);

  function abrirNovo() { setEdit(null); setForm({ ativo: true }); setOpen(true); }
  function abrirEdit(d: Discipulador) { setEdit(d); setForm(d); setOpen(true); }

  function abrirCriarAcesso(d: Discipulador) {
    setAcessoDiscipulador(d);
    setAcessoEmail(d.email ?? "");
    setAcessoSenha("");
    setAcessoOpen(true);
  }

  async function salvarAcesso() {
    if (!acessoDiscipulador) return;
    if (!acessoEmail || !acessoSenha) {
      toast.error("Email e senha são obrigatórios");
      return;
    }
    setAcessoLoading(true);
    try {
      await api.criarAcessoDiscipulador(acessoDiscipulador.id, {
        email: acessoEmail,
        senha: acessoSenha,
      });
      toast.success("Acesso criado com sucesso");
      setAcessoOpen(false);
      qc.invalidateQueries({ queryKey: ["discipuladores"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar acesso");
    } finally {
      setAcessoLoading(false);
    }
  }

  async function revogarAcesso(d: Discipulador) {
    if (!window.confirm(`Revogar acesso de ${d.nome}? A conta de usuário será desativada.`)) return;
    try {
      await api.revogarAcessoDiscipulador(d.id);
      toast.success("Acesso revogado com sucesso");
      qc.invalidateQueries({ queryKey: ["discipuladores"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao revogar acesso");
    }
  }

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
          <Button className="rounded-none bg-primary text-primary-foreground hover:opacity-90" onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo discipulador
          </Button>
        )}
      />

      <div className="bg-card border border-border">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : !data || data.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground italic font-serif">Ninguém cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground w-10">Nº</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Telefone</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">E-mail</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground text-right">Grupos</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Acesso</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Ativo</TableHead>
                    {editor && <TableHead className="text-right text-[10px] uppercase tracking-widest text-muted-foreground">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((d, i) => (
                    <TableRow key={d.id} className="border-border hover:bg-muted">
                      <TableCell className="font-serif italic text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</TableCell>
                      <TableCell className="font-serif text-lg text-foreground">{d.nome}</TableCell>
                      <TableCell className="text-sm text-foreground">{d.telefone ?? "—"}</TableCell>
                      <TableCell className="text-sm italic text-muted-foreground">{d.email ?? "—"}</TableCell>
                      <TableCell className="text-right font-serif text-lg tabular-nums text-foreground">{d.qtd_grupos ?? 0}</TableCell>
                      <TableCell>
                        {d.usuario_email ? (
                          <div className="flex flex-col gap-0.5 items-start">
                            <span className="text-[10px] uppercase tracking-widest text-emerald-700 border-b border-emerald-600 pb-0.5 font-medium">
                              Com acesso
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">{d.usuario_email}</span>
                            {editor && (
                              <button
                                onClick={() => revogarAcesso(d)}
                                className="text-[10px] text-red-600 hover:text-red-800 underline mt-0.5 cursor-pointer bg-transparent border-0 p-0"
                              >
                                Revogar
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5 items-start">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-stone-400 pb-0.5">
                              Sem acesso
                            </span>
                            {editor && (
                              <button
                                onClick={() => abrirCriarAcesso(d)}
                                className="text-[10px] text-primary hover:text-amber-900 underline mt-0.5 cursor-pointer bg-transparent border-0 p-0"
                              >
                                Criar acesso
                              </button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={d.ativo === false
                          ? "text-[10px] uppercase tracking-widest text-muted-foreground border-b border-stone-400 pb-0.5"
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
      <Dialog open={acessoOpen} onOpenChange={setAcessoOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">
              Criar Acesso ao Sistema
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Crie uma conta de login para o discipulador <strong>{acessoDiscipulador?.nome}</strong>.
            </div>
            <Campo label="E-mail">
              <Input
                type="email"
                value={acessoEmail}
                onChange={(e) => setAcessoEmail(e.target.value)}
                placeholder="exemplo@igreja.org"
              />
            </Campo>
            <Campo label="Senha">
              <Input
                type="password"
                value={acessoSenha}
                onChange={(e) => setAcessoSenha(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </Campo>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcessoOpen(false)}>Cancelar</Button>
            <Button onClick={salvarAcesso} disabled={acessoLoading}>
              {acessoLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar acesso
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