import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar, type Perfil } from "@/lib/api";
import { useCreateUsuario, useToggleUsuario, useUsuarios } from "./hooks";
import { PageHeader } from "@/components/layout/PageHeader";

const PERFIS: Perfil[] = ["admin", "lider", "pastor", "discipulador"];

export function UsuariosPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (usuario && !podeEditar(usuario.perfil)) navigate({ to: "/dashboard" });
  }, [usuario, navigate]);

  const { data, isLoading } = useUsuarios();
  const create = useCreateUsuario();
  const toggle = useToggleUsuario();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ nome: string; email: string; senha: string; perfil: Perfil }>(
    { nome: "", email: "", senha: "", perfil: "discipulador" },
  );

  async function salvar() {
    try {
      await create.mutateAsync(form);
      toast.success("Usuário criado");
      setOpen(false);
      setForm({ nome: "", email: "", senha: "", perfil: "discipulador" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div>
      <PageHeader
        chapter="03"
        eyebrow="Administração · Acessos"
        title="Usuários"
        lede="As chaves de casa — quem entra pela porta dos fundos do sistema."
        actions={(
          <Button className="rounded-none bg-primary text-primary-foreground hover:opacity-90" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Criar usuário
          </Button>
        )}
      />

      <div className="bg-card border border-border">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : !data || data.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground italic font-serif">Nenhum usuário cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground w-10">Nº</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">E-mail</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Perfil</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground text-right">Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((u, i) => (
                    <TableRow key={u.id} className="border-border hover:bg-muted">
                      <TableCell className="font-serif italic text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</TableCell>
                      <TableCell className="font-serif text-lg text-foreground">{u.nome}</TableCell>
                      <TableCell className="text-sm italic text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <span className="text-[10px] uppercase tracking-widest text-primary border-b border-primary/60 pb-0.5 capitalize">
                          {u.perfil}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={u.ativo !== false}
                          onCheckedChange={async () => {
                            try { await toggle.mutateAsync(u.id); toast.success("Atualizado"); }
                            catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
                          }}
                        />
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
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif text-primary">Criar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Senha</Label><Input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={form.perfil} onValueChange={(v) => setForm({ ...form, perfil: v as Perfil })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERFIS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}