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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-primary">Usuários</h1>
          <p className="text-sm text-muted-foreground">Acessos ao sistema</p>
        </div>
        <Button className="rounded-xl" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Criar Usuário
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : !data || data.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Nenhum usuário.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{u.perfil}</Badge></TableCell>
                      <TableCell>
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
        </CardContent>
      </Card>

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