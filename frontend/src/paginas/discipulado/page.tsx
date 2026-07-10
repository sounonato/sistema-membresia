import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useDiscipuladores } from "@/paginas/discipuladores/hooks";
import { useModulos } from "@/paginas/modulos/hooks";
import { useCreateGrupo, useGrupos } from "./hooks";

export function DiscipuladoPage() {
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const { data, isLoading } = useGrupos();
  const [open, setOpen] = useState(false);
  const create = useCreateGrupo();
  const { data: discipuladores } = useDiscipuladores();
  const { data: modulos } = useModulos();

  const [form, setForm] = useState({
    nome: "",
    discipulador_id: "",
    modulo_id: "",
    data_inicio: "",
    status: "ativo",
  });

  async function salvar() {
    try {
      await create.mutateAsync(form);
      toast.success("Grupo criado");
      setOpen(false);
      setForm({ nome: "", discipulador_id: "", modulo_id: "", data_inicio: "", status: "ativo" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-primary">Discipulado</h1>
          <p className="text-sm text-muted-foreground">Grupos e progresso</p>
        </div>
        {editor && (
          <Button className="rounded-xl" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Grupo
          </Button>
        )}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data || data.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum grupo cadastrado.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Discipulador</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((g) => (
                    <TableRow key={g.id} className="cursor-pointer">
                      <TableCell>
                        <Link to="/discipulado/$id" params={{ id: g.id }} className="font-medium text-primary hover:underline">
                          {g.nome}
                        </Link>
                      </TableCell>
                      <TableCell>{g.discipulador_nome ?? g.discipulador ?? "—"}</TableCell>
                      <TableCell>{g.modulo_nome ?? g.modulo ?? "—"}</TableCell>
                      <TableCell>{g.qtd_membros ?? g.membros?.length ?? 0}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            g.status === "ativo"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-stone-200 text-stone-700 hover:bg-stone-200"
                          }
                        >
                          {g.status ?? "ativo"}
                        </Badge>
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
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Novo Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Discipulador</Label>
              <Select value={form.discipulador_id} onValueChange={(v) => setForm({ ...form, discipulador_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(discipuladores ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Módulo</Label>
              <Select value={form.modulo_id} onValueChange={(v) => setForm({ ...form, modulo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(modulos ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data de início</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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