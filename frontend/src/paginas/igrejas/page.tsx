import { useState } from "react";
import { Plus, Loader2, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api, type Igreja } from "@/lib/api";
import {
  useIgrejas, useCreateIgreja, useUpdateIgreja, useDeleteIgreja, useCreateAdminIgreja,
} from "./hooks";

const ESTADOS = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export function IgrejasPage() {
  const { data, isLoading } = useIgrejas();
  const create = useCreateIgreja();
  const update = useUpdateIgreja();
  const del = useDeleteIgreja();
  const createAdmin = useCreateAdminIgreja();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Igreja | null>(null);
  
  const [form, setForm] = useState({ 
    nome: "", 
    slug: "",
    cor_primaria: "#b45309",
    logo_url: "",
    descricao: "",
    cidade: "",
    estado: ""
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingLoading, setSavingLoading] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminFor, setAdminFor] = useState<Igreja | null>(null);
  const [adminForm, setAdminForm] = useState({ nome: "", email: "", senha: "" });

  function openNova() {
    setEditing(null);
    setForm({ 
      nome: "", 
      slug: "",
      cor_primaria: "#b45309",
      logo_url: "",
      descricao: "",
      cidade: "",
      estado: ""
    });
    setLogoFile(null);
    setLogoPreview(null);
    setOpen(true);
  }
  
  function openEditar(ig: Igreja) {
    setEditing(ig);
    setForm({ 
      nome: ig.nome, 
      slug: ig.slug,
      cor_primaria: ig.cor_primaria || "#b45309",
      logo_url: ig.logo_url || "",
      descricao: ig.descricao || "",
      cidade: ig.cidade || "",
      estado: ig.estado || ""
    });
    setLogoFile(null);
    setLogoPreview(
      ig.logo_url 
        ? (ig.logo_url.startsWith("http") ? ig.logo_url : `http://localhost:3031${ig.logo_url}`)
        : null
    );
    setOpen(true);
  }

  async function salvar() {
    setSavingLoading(true);
    try {
      const payload = { 
        nome: form.nome.trim(), 
        slug: form.slug.trim().toLowerCase(),
        cor_primaria: form.cor_primaria,
        descricao: form.descricao.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado
      };
      
      let igrejaId = "";
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: payload });
        igrejaId = editing.id;
        toast.success("Igreja atualizada");
      } else {
        const novaIgreja = await create.mutateAsync(payload);
        igrejaId = (novaIgreja as Igreja).id;
        toast.success("Igreja criada");
      }

      // Upload de logo se um arquivo foi selecionado
      if (logoFile && igrejaId) {
        await api.uploadLogoIgreja(igrejaId, logoFile);
        toast.success("Logo atualizada com sucesso");
      }
      
      setOpen(false);
    } catch (e) { 
      toast.error(e instanceof Error ? e.message : "Erro ao salvar igreja"); 
    } finally {
      setSavingLoading(false);
    }
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-primary">Igrejas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as igrejas da rede e seus administradores</p>
        </div>
        <Button className="rounded-xl" onClick={openNova}>
          <Plus className="h-4 w-4" /> Nova Igreja
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data || data.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Nenhuma igreja cadastrada.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((ig) => (
                    <TableRow key={ig.id}>
                      <TableCell className="font-medium">{ig.nome}</TableCell>
                      <TableCell><code className="text-xs">@{ig.slug}</code></TableCell>
                      <TableCell>
                        <Badge variant={ig.ativa === false ? "secondary" : "default"}>
                          {ig.ativa === false ? "Inativa" : "Ativa"}
                        </Badge>
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
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">
              {editing ? "Editar Igreja" : "Nova Igreja"}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4">
              <TabsTrigger value="geral" className="rounded-lg">Dados Gerais</TabsTrigger>
              <TabsTrigger value="identidade" className="rounded-lg">Identidade Visual</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4 py-2">
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
                <p className="text-xs text-muted-foreground">Identificador único usado no login.</p>
              </div>
            </TabsContent>

            <TabsContent value="identidade" className="space-y-4 py-2">
              <div className="flex gap-3 items-end">
                <div className="space-y-1.5 flex-1">
                  <Label>Cor Primária</Label>
                  <Input
                    value={form.cor_primaria}
                    onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                    placeholder="#b45309"
                  />
                </div>
                <div className="h-10 w-12 rounded-xl border border-input overflow-hidden">
                  <input
                    type="color"
                    value={form.cor_primaria.startsWith("#") && form.cor_primaria.length === 7 ? form.cor_primaria : "#b45309"}
                    onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                    className="h-full w-full cursor-pointer p-0 border-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Preview de Botão</Label>
                <div>
                  <Button 
                    style={{ backgroundColor: form.cor_primaria, color: "#fff" }} 
                    className="rounded-xl w-full hover:opacity-90 active:scale-95 transition-all"
                  >
                    Botão de Exemplo
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Logo da Igreja</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Arquivo muito grande. Limite de 2MB.");
                        return;
                      }
                      setLogoFile(file);
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {logoPreview && (
                  <div className="relative mt-2 h-20 w-20 rounded-xl border p-1 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={logoPreview} alt="Preview da logo" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        setForm({ ...form, logo_url: "" });
                      }}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 text-xs hover:bg-destructive/90 cursor-pointer h-5 w-5 flex items-center justify-center font-bold"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descreva a igreja..."
                  className="min-h-[80px] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Select
                    value={form.estado}
                    onValueChange={(val) => setForm({ ...form, estado: val })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((est) => (
                        <SelectItem key={est.value} value={est.value}>
                          {est.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={salvar} disabled={savingLoading || create.isPending || update.isPending}>
              {(savingLoading || create.isPending || update.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
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
            <Button variant="outline" className="rounded-xl" onClick={() => setAdminOpen(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={salvarAdmin} disabled={createAdmin.isPending}>
              {createAdmin.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}