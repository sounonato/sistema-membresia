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
import { PageHeader } from "@/components/layout/PageHeader";

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
    <div>
      <PageHeader
        chapter="02"
        eyebrow="Ministério · Grupos"
        title="Discipulado"
        lede="Cada grupo é um pequeno círculo de mesa onde a fé é masticada e passada adiante."
        actions={editor && (
          <Button className="rounded-none border border-foreground bg-stone-900 hover:bg-stone-800" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo grupo
          </Button>
        )}
      />

      <div className="bg-white border border-border">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid place-content-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data || data.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground italic font-serif">Nenhum grupo cadastrado — o primeiro círculo ainda espera por uma cadeira posta.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground w-10">Nº</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Grupo</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Discipulador</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Módulo</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground text-right">Membros</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((g, i) => (
                    <TableRow key={g.id} className="border-border hover:bg-muted">
                      <TableCell className="font-serif italic text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</TableCell>
                      <TableCell>
                        <Link to="/discipulado/$id" params={{ id: g.id }} className="font-serif text-lg text-foreground hover:text-primary underline-offset-4 hover:underline">
                          {g.nome}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{g.discipulador_nome ?? g.discipulador ?? "—"}</TableCell>
                      <TableCell className="text-sm italic text-muted-foreground">{g.modulo_nome ?? g.modulo ?? "—"}</TableCell>
                      <TableCell className="text-right font-serif text-lg tabular-nums text-foreground">{g.qtd_membros ?? g.membros?.length ?? 0}</TableCell>
                      <TableCell>
                        <span className={
                          g.status === "ativo"
                            ? "text-[10px] uppercase tracking-widest text-emerald-700 border-b border-emerald-600 pb-0.5"
                            : "text-[10px] uppercase tracking-widest text-muted-foreground border-b border-stone-400 pb-0.5"
                        }>
                          {g.status ?? "ativo"}
                        </span>
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