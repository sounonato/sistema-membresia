import { useState, useRef } from "react";
import { Plus, Loader2, Pencil, Trash2, UserPlus, Upload, X } from "lucide-react";
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
import type { Igreja } from "@/lib/api";
import {
  useIgrejas, useCreateIgreja, useUpdateIgreja, useDeleteIgreja, useCreateAdminIgreja, useUploadLogoIgreja,
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

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Igreja | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminFor, setAdminFor] = useState<Igreja | null>(null);
  const [adminForm, setAdminForm] = useState({ nome: "", email: "", senha: "" });

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

  return (
    <div>
      <PageHeader
        chapter="00"
        eyebrow="Painel superadmin"
        title="Igrejas da rede"
        lede="Cada linha aqui é uma comunidade viva — com sua cor, sua praça e seu próprio cheiro de café no domingo."
        actions={(
          <Button className="rounded-none border border-stone-900 bg-stone-900 hover:bg-stone-800" onClick={openNova}>
            <Plus className="h-4 w-4" /> Nova igreja
          </Button>
        )}
      />

      <div className="bg-white border border-stone-200">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data || data.length === 0 ? (
            <p className="text-center py-10 text-sm text-stone-500 italic font-serif">Nenhuma igreja cadastrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-stone-300">
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500 w-10">Nº</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500 w-10">Cor</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500">Igreja</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500">Slug</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500">Localização</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-stone-500">Status</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-widest text-stone-500">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((ig, i) => (
                    <TableRow key={ig.id} className="border-stone-200 hover:bg-stone-50">
                      <TableCell className="font-serif italic text-stone-400 tabular-nums">{String(i + 1).padStart(2, "0")}</TableCell>
                      <TableCell>
                        <span className="inline-block h-5 w-5 rounded-full border border-stone-300" style={{ backgroundColor: ig.cor_primaria ?? "#b45309" }} />
                      </TableCell>
                      <TableCell className="font-serif text-lg text-stone-900">{ig.nome}</TableCell>
                      <TableCell><code className="text-xs text-stone-500">/{ig.slug}</code></TableCell>
                      <TableCell className="text-sm italic text-stone-600">
                        {[ig.cidade, ig.estado].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <span className={ig.ativa === false
                          ? "text-[10px] uppercase tracking-widest text-stone-500 border-b border-stone-400 pb-0.5"
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
                    <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-md object-contain border border-border bg-white" />
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
    </div>
  );
}