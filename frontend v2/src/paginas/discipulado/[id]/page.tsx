import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
      <div className="grid place-content-center py-16 text-stone-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <header className="border-b border-stone-300/70 pb-6 mb-8">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-none text-stone-500 -ml-2 mt-2">
            <Link to="/discipulado"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex-1">
            <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-stone-500">
              <span className="font-serif text-2xl italic text-primary leading-none">§</span>
              <span className="h-px w-6 bg-stone-400" />
              Grupo de discipulado
            </p>
            <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05] text-stone-900">{grupo.nome}</h1>
            <p className="mt-2 font-[Instrument_Serif,serif] italic text-lg text-stone-600">
              conduzido por {grupo.discipulador_nome ?? grupo.discipulador ?? "—"} · {grupo.modulo_nome ?? grupo.modulo ?? "—"}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 mb-10 border-b border-stone-200">
        <Info label="Discipulador" value={grupo.discipulador_nome ?? grupo.discipulador} />
        <Info label="Módulo" value={grupo.modulo_nome ?? grupo.modulo} />
        <Info label="Início" value={fmt(grupo.data_inicio)} />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Status</p>
          <p className={`mt-1 text-sm uppercase tracking-widest ${grupo.status === "ativo" ? "text-primary" : "text-stone-500"}`}>
            {grupo.status}
          </p>
        </div>
      </div>

      <section className="mb-14">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-6">
          <span className="font-serif italic text-primary text-sm">01</span>
          <span className="h-px flex-1 bg-stone-300" />
          Membros
        </div>

          {(grupo.membros ?? []).length === 0 && (
            <p className="italic font-serif text-stone-500 text-lg">Nenhum nome nesta página, ainda.</p>
          )}
          <ul className="divide-y divide-stone-200 border-t border-b border-stone-200">
            {(grupo.membros ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between py-4 px-2">
                <span className="font-serif text-xl text-stone-900">{m.nome}</span>
                {adminLider && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none text-[10px] uppercase tracking-widest text-stone-500 hover:text-destructive"
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
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {adminLider && (
            <div className="mt-6 space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-stone-500">Adicionar convertido</Label>
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome…" />
              {candidatos.length > 0 && (
                <ul className="border border-stone-200 divide-y divide-stone-200 bg-stone-50">
                  {candidatos.map((c) => (
                    <li key={c.id} className="flex items-center justify-between p-3">
                      <span className="font-serif text-lg text-stone-900">{c.nome}</span>
                      <Button
                        size="sm"
                        className="rounded-none bg-stone-900 hover:bg-stone-800"
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
      </section>

      <section>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-6">
          <span className="font-serif italic text-primary text-sm">02</span>
          <span className="h-px flex-1 bg-stone-300" />
          Progresso das aulas
        </div>

          {!progresso || progresso.length === 0 ? (
            <p className="italic font-serif text-stone-500 text-lg">Nenhuma aula registrada — a primeira página ainda está em branco.</p>
          ) : (
            <ul className="border-t border-b border-stone-200 divide-y divide-stone-200">
              {progresso.map((a) => (
                <li key={a.id ?? a.numero} className="py-5 px-2 flex items-start gap-6">
                  <div className="font-serif italic text-3xl text-primary tabular-nums leading-none w-12">
                    {a.numero}
                  </div>
                  <div className="flex-1">
                    <p className="font-serif text-xl text-stone-900 flex items-center gap-3">
                      Aula {a.numero}
                      {a.concluida && <Check className="h-4 w-4 text-primary" />}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">{fmt(a.data)}</p>
                    {a.observacoes && <p className="text-sm text-stone-600 mt-2 italic font-serif">{a.observacoes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {editor && (
            <div className="mt-6 border-t border-stone-300 pt-6 space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-500">Nova aula</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-stone-500">Número</Label>
                  <Input
                    type="number"
                    min={1}
                    value={novaAula.numero}
                    onChange={(e) => setNovaAula({ ...novaAula, numero: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-stone-500">Data</Label>
                  <Input
                    type="date"
                    value={novaAula.data}
                    onChange={(e) => setNovaAula({ ...novaAula, data: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 mt-6 text-sm text-stone-700">
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
                  className="rounded-none bg-stone-900 hover:bg-stone-800"
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
                  Registrar aula
                </Button>
              </div>
            </div>
          )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-lg text-stone-900">{value || "—"}</p>
    </div>
  );
}

function fmt(d?: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("pt-BR");
}