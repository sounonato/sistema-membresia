import { useState, useRef } from "react";
import { Plus, Loader2, Pencil, Trash2, UserPlus, Upload, X, Check, XCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Igreja, SolicitacaoIgreja } from "@/lib/api";
import {
  useIgrejas, useCreateIgreja, useUpdateIgreja, useDeleteIgreja, useCreateAdminIgreja, useUploadLogoIgreja,
  useSolicitacoes, useAprovarSolicitacao, useRejeitarSolicitacao,
} from "./hooks";
import { PageHeader } from "@/components/layout/PageHeader";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

type FormState = {
  nome: string;
  slug: string;
  cor_primaria: string;
  logo_url: string;
  descricao: string;
  cidade: string;
  estado: string;
};

const emptyForm: FormState = {
  nome: "", slug: "", cor_primaria: "#b45309", logo_url: "",
  descricao: "", cidade: "", estado: "",
};

export function IgrejasPage() {
  const { data, isLoading } = useIgrejas();
  const create = useCreateIgreja();
  const update = useUpdateIgreja();
  const del = useDeleteIgreja();
  const createAdmin = useCreateAdminIgreja();
  const uploadLogo = useUploadLogoIgreja();
  const { data: solicitacoes, isLoading: loadingSol } = useSolicitacoes("pendente");
  const aprovar = useAprovarSolicitacao();
  const rejeitar = useRejeitarSolicitacao();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Igreja | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminFor, setAdminFor] = useState<Igreja | null>(null);
  const [adminForm, setAdminForm] = useState({ nome: "", email: "", senha: "" });

  const [aprovacaoResult, setAprovacaoResult] = useState<{ igreja: Igreja; usuario: { nome: string; email: string }; senha_temporaria: string } | null>(null);
  const [rejeitarOpen, setRejeitarOpen] = useState(false);
  const [rejeitarId, setRejeitarId] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  function openNova() {
    setEditing(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(null);
    setOpen(true);
  }
  function openEditar(ig: Igreja) {
    setEditing(ig);
    setForm({
      nome: ig.nome,
      slug: ig.slug,
      cor_primaria: ig.cor_primaria ?? "#b45309",
      logo_url: ig.logo_url ?? "",
      descricao: ig.descricao ?? "",
      cidade: ig.cidade ?? "",
      estado: ig.estado ?? "",
    });
    setLogoFile(null);
    setLogoPreview(ig.logo_url ?? null);
    setOpen(true);
  }

  async function salvar() {
    try {
      const payload: Partial<Igreja> = {
        nome: form.nome.trim(),
        slug: form.slug.trim().toLowerCase(),
        cor_primaria: form.cor_primaria,
        descricao: form.descricao.trim() || undefined,
        cidade: form.cidade.trim() || undefined,
        estado: form.estado || undefined,
      };
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload });
        if (logoFile) await uploadLogo.mutateAsync({ id: editing.id, file: logoFile });
        toast.success("Igreja atualizada");
      } else {
        const created = await create.mutateAsync(payload as { nome: string; slug: string });
        if (logoFile && created?.id) await uploadLogo.mutateAsync({ id: created.id, file: logoFile });
        toast.success("Igreja criada");
      }
      setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  function onPickLogo(f: File | null) {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("Logo deve ter até 2MB"); return; }
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result));
    reader.readAsDataURL(f);
  }
  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    setForm((f) => ({ ...f, logo_url: "" }));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function excluir(ig: Igreja) {
    if (!window.confirm(`Excluir igreja "${ig.nome}"?`)) return;
    try { await del.mutateAsync(ig.id); toast.success("Igreja excluída"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  function openAdmin(ig: Igreja) {
    setAdminFor(ig);
    setAdminForm({ nome: "", email: "", senha: "" });
    setAdminOpen(true);
  }
  async function salvarAdmin() {
    if (!adminFor) return;
    try {
      await createAdmin.mutateAsync({ igrejaId: adminFor.id, data: adminForm });
      toast.success("Admin criado");
      setAdminOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  async function handleAprovar(sol: SolicitacaoIgreja) {
    try {
      const res = await aprovar.mutateAsync(sol.id);
      setAprovacaoResult(res);
      toast.success(`Igreja "${sol.nome}" aprovada`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao aprovar"); }
  }

  async function handleRejeitar() {
    if (!rejeitarId) return;
    try {
      await rejeitar.mutateAsync({ id: rejeitarId, motivo: motivoRejeicao });
      toast.success("Solicitação rejeitada");
      setRejeitarOpen(false);
      setMotivoRejeicao("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao rejeitar"); }
  }

  const pendentesCount = solicitacoes?.length ?? 0;

  return (
    <div>
      <PageHeader
        chapter="00"
        eyebrow="Painel superadmin"
        title="Igrejas da rede"
        lede="Cada linha aqui é uma comunidade viva — com sua cor, sua praça e seu próprio cheiro de café no domingo."
        actions={(
          <Button className="rounded-none border border-foreground bg-stone-900 hover:bg-stone-800" onClick={openNova}>
            <Plus className="h-4 w-4" /> Nova igreja
          </Button>
        )}
      />

      <Tabs defaultValue="igrejas">
        <TabsList className="rounded-none border border-border bg-card mb-0 h-10">
          <TabsTrigger value="igrejas" className="rounded-none text-xs uppercase tracking-widest">
            Igrejas ativas
          </TabsTrigger>
          <TabsTrigger value="solicitacoes" className="rounded-none text-xs uppercase tracking-widest relative">
            Solicitações pendentes
            {pendentesCount > 0 && (
              <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] text-white font-bold">
                {pendentesCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ABA IGREJAS */}
        <TabsContent value="igrejas" className="mt-0">
          <div className="bg-card border border-border border-t-0">
            <div className="p-4 sm:p-6">
              {isLoading ? (
                <div className="grid place-content-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : !data || data.length === 0 ? (
                <p className="text-center py-10 text-sm text-muted-foreground italic font-serif">Nenhuma igreja cadastrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground w-10">Nº</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground w-10">Cor</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Igreja</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Slug</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Localização</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="text-right text-[10px] uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((ig, i) => (
                        <TableRow key={ig.id} className="border-border hover:bg-muted">
                          <TableCell className="font-serif italic text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</TableCell>
                          <TableCell>
                            <span className="inline-block h-5 w-5 rounded-full border border-border" style={{ backgroundColor: ig.cor_primaria ?? "#b45309" }} />
                          </TableCell>
                          <TableCell className="font-serif text-lg text-foreground">{ig.nome}</TableCell>
                          <TableCell><code className="text-xs text-muted-foreground">/{ig.slug}</code></TableCell>
                          <TableCell className="text-sm italic text-muted-foreground">
                            {[ig.cidade, ig.estado].filter(Boolean).join(", ") || "—"}
                          </TableCell>
                          <TableCell>
                            <span className={ig.ativa === false
                              ? "text-[10px] uppercase tracking-widest text-muted-foreground border-b border-stone-400 pb-0.5"
                              : "text-[10px] uppercase tracking-widest text-emerald-700 border-b border-emerald-600 pb-0.5"}>
                              {ig.ativa === false ? "inativa" : "ativa"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openAdmin(ig)} title="Criar admin">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openEditar(ig)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => excluir(ig)} title="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ABA SOLICITAÇÕES */}
        <TabsContent value="solicitacoes" className="mt-0">
          <div className="bg-card border border-border border-t-0">
            <div className="p-4 sm:p-6">
              {loadingSol ? (
                <div className="grid place-content-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : !solicitacoes || solicitacoes.length === 0 ? (
                <p className="text-center py-10 text-sm text-muted-foreground italic font-serif">Nenhuma solicitação pendente.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Igreja</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Slug</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Responsável</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Contato</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Plano</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Data</TableHead>
                        <TableHead className="text-right text-[10px] uppercase tracking-widest text-muted-foreground">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solicitacoes.map((sol) => (
                        <TableRow key={sol.id} className="border-border hover:bg-muted">
                          <TableCell className="font-serif text-base text-foreground">{sol.nome}</TableCell>
                          <TableCell><code className="text-xs text-muted-foreground">/{sol.slug}</code></TableCell>
                          <TableCell className="text-sm">
                            <div>{sol.responsavel_nome}</div>
                            {sol.cargo_responsavel && <div className="text-xs text-muted-foreground">{sol.cargo_responsavel}</div>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>{sol.responsavel_email}</div>
                            {sol.responsavel_telefone && <div className="text-xs text-muted-foreground">{sol.responsavel_telefone}</div>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wide rounded-none">
                              {sol.plano}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(sol.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                                title="Aprovar"
                                disabled={aprovar.isPending}
                                onClick={() => handleAprovar(sol)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Rejeitar"
                                onClick={() => { setRejeitarId(sol.id); setMotivoRejeicao(""); setRejeitarOpen(true); }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">
              {editing ? "Editar Igreja" : "Nova Igreja"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="dados">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="dados">Dados gerais</TabsTrigger>
              <TabsTrigger value="branding">Identidade visual</TabsTrigger>
            </TabsList>
            <TabsContent value="dados" className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="nazareno-centro"
                  autoCapitalize="none"
                />
                <p className="text-xs text-muted-foreground">Identificador único usado na URL pública e login.</p>
              </div>
            </TabsContent>
            <TabsContent value="branding" className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label>Cor primária</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.cor_primaria}
                    onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                    className="h-10 w-14 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    value={form.cor_primaria}
                    onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                    placeholder="#b45309"
                    className="font-mono"
                  />
                  <button
                    type="button"
                    style={{ backgroundColor: form.cor_primaria }}
                    className="rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm"
                  >
                    Preview
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-md object-contain border border-border bg-card" />
                  ) : (
                    <div className="h-16 w-16 rounded-md border border-dashed border-border grid place-content-center text-xs text-muted-foreground">sem logo</div>
                  )}
                  <div className="flex flex-col gap-1">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Enviar logo
                    </Button>
                    {logoPreview && (
                      <Button type="button" size="sm" variant="ghost" onClick={removeLogo}>
                        <X className="h-4 w-4" /> Remover
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP, até 2MB.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Uma breve descrição da igreja"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={create.isPending || update.isPending || uploadLogo.isPending}>
              {(create.isPending || update.isPending || uploadLogo.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">
              Novo Admin {adminFor ? `— ${adminFor.nome}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={adminForm.nome} onChange={(e) => setAdminForm({ ...adminForm, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input type="password" value={adminForm.senha} onChange={(e) => setAdminForm({ ...adminForm, senha: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminOpen(false)}>Cancelar</Button>
            <Button onClick={salvarAdmin} disabled={createAdmin.isPending}>
              {createAdmin.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: resultado da aprovação (exibe senha temporária) */}
      <Dialog open={!!aprovacaoResult} onOpenChange={() => setAprovacaoResult(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-emerald-700">Igreja aprovada</DialogTitle>
          </DialogHeader>
          {aprovacaoResult && (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                A igreja <strong className="font-serif text-foreground">{aprovacaoResult.igreja.nome}</strong> foi criada com sucesso.
              </p>
              <div className="border border-border p-4 space-y-2 bg-muted">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Acesso do admin</p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">E-mail</span>
                  <code className="text-foreground">{aprovacaoResult.usuario.email}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Senha temporária</span>
                  <code className="text-primary font-bold tracking-widest">{aprovacaoResult.senha_temporaria}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Acesso</span>
                  <code className="text-muted-foreground">/{aprovacaoResult.igreja.slug}</code>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Anote ou copie a senha temporária — ela não será exibida novamente.</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setAprovacaoResult(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: rejeitar solicitação */}
      <Dialog open={rejeitarOpen} onOpenChange={setRejeitarOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-red-700">Rejeitar solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Informe opcionalmente o motivo da rejeição.</p>
            <Textarea
              rows={3}
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              placeholder="Ex: Slug já em uso por outra denominação..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejeitarOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejeitar} disabled={rejeitar.isPending}>
              {rejeitar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}