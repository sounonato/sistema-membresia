import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar } from "@/lib/api";
import { useConvertidos } from "@/paginas/convertidos/hooks";
import {
  useAddMembro,
  useAddProgresso,
  useGrupo,
  useProgresso,
  useRemoveMembro,
} from "../hooks";

export function GrupoDetalhePage() {
  const { id } = useParams({ from: "/_auth/discipulado/$id" });
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil) || usuario?.perfil === "discipulador";
  const adminLider = podeEditar(usuario?.perfil);

  const { data: grupo, isLoading } = useGrupo(id);
  const { data: progresso } = useProgresso(id);
  const { data: convertidos } = useConvertidos();

  const addMembro = useAddMembro(id);
  const removeMembro = useRemoveMembro(id);
  const addAula = useAddProgresso(id);

  const [busca, setBusca] = useState("");
  const [novaAula, setNovaAula] = useState({ numero: 1, data: "", concluida: false, observacoes: "" });

  const candidatos = useMemo(() => {
    const t = busca.toLowerCase().trim();
    if (!t) return [];
    const ids = new Set((grupo?.membros ?? []).map((m) => m.id));
    return (convertidos ?? [])
      .filter((c) => !ids.has(c.id) && c.nome.toLowerCase().includes(t))
      .slice(0, 6);
  }, [busca, convertidos, grupo]);

  if (isLoading || !grupo) {
    return (
      <div className="grid place-content-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/discipulado"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="font-serif text-3xl text-primary">{grupo.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {grupo.discipulador_nome ?? grupo.discipulador ?? "—"} · {grupo.modulo_nome ?? grupo.modulo ?? "—"}
          </p>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Info label="Discipulador" value={grupo.discipulador_nome ?? grupo.discipulador} />
          <Info label="Módulo" value={grupo.modulo_nome ?? grupo.modulo} />
          <Info label="Início" value={fmt(grupo.data_inicio)} />
          <div>
            <p className="text-xs uppercase text-muted-foreground">Status</p>
            <Badge className={grupo.status === "ativo" ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"}>
              {grupo.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-primary">Membros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(grupo.membros ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum membro ainda.</p>
          )}
          <ul className="divide-y divide-border rounded-xl border border-border">
            {(grupo.membros ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between p-3">
                <span className="text-sm">{m.nome}</span>
                {adminLider && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!window.confirm(`Remover ${m.nome} do grupo?`)) return;
                      try {
                        await removeMembro.mutateAsync(m.id);
                        toast.success("Removido");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Erro");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" /> Remover
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {adminLider && (
            <div className="space-y-2">
              <Label>Adicionar convertido</Label>
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome…" />
              {candidatos.length > 0 && (
                <ul className="rounded-xl border border-border divide-y divide-border">
                  {candidatos.map((c) => (
                    <li key={c.id} className="flex items-center justify-between p-2.5">
                      <span className="text-sm">{c.nome}</span>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await addMembro.mutateAsync(c.id);
                            toast.success("Adicionado");
                            setBusca("");
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Erro");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" /> Adicionar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-primary">Progresso das Aulas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!progresso || progresso.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma aula registrada.</p>
          ) : (
            <ul className="rounded-xl border border-border divide-y divide-border">
              {progresso.map((a) => (
                <li key={a.id ?? a.numero} className="p-3 flex items-start gap-3">
                  <div className="grid place-content-center h-8 w-8 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                    {a.numero}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Aula {a.numero} · {fmt(a.data)}
                      {a.concluida && <Check className="inline h-4 w-4 ml-2 text-green-700" />}
                    </p>
                    {a.observacoes && <p className="text-xs text-muted-foreground mt-1">{a.observacoes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {editor && (
            <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
              <p className="text-sm font-medium">Adicionar Aula</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Número</Label>
                  <Input
                    type="number"
                    min={1}
                    value={novaAula.numero}
                    onChange={(e) => setNovaAula({ ...novaAula, numero: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={novaAula.data}
                    onChange={(e) => setNovaAula({ ...novaAula, data: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 mt-6">
                    <Checkbox
                      checked={novaAula.concluida}
                      onCheckedChange={(v) => setNovaAula({ ...novaAula, concluida: !!v })}
                    />
                    Concluída
                  </Label>
                </div>
              </div>
              <Textarea
                placeholder="Observações"
                value={novaAula.observacoes}
                onChange={(e) => setNovaAula({ ...novaAula, observacoes: e.target.value })}
              />
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    try {
                      await addAula.mutateAsync(novaAula);
                      toast.success("Aula registrada");
                      setNovaAula({ numero: novaAula.numero + 1, data: "", concluida: false, observacoes: "" });
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Erro");
                    }
                  }}
                  disabled={addAula.isPending}
                >
                  {addAula.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

function fmt(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("pt-BR");
}