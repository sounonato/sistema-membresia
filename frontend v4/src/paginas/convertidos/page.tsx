import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, ArrowUpRight, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { podeEditar } from "@/lib/api";
import { useConvertidos, useDeleteConvertido } from "./hooks";

const PAGE_SIZE = 10;

export function ConvertidosPage() {
  const { usuario } = useAuth();
  const editor = podeEditar(usuario?.perfil);
  const { data, isLoading } = useConvertidos();
  const del = useDeleteConvertido();
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase().trim();
    const list = data ?? [];
    if (!t) return list;
    return list.filter(
      (c) =>
        c.nome?.toLowerCase().includes(t) || (c.telefone ?? "").toLowerCase().includes(t),
    );
  }, [data, busca]);

  const totalPag = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pagSegura = Math.min(pagina, totalPag);
  const itens = filtrados.slice((pagSegura - 1) * PAGE_SIZE, pagSegura * PAGE_SIZE);

  async function onExcluir(id: string, nome: string) {
    if (!window.confirm(`Excluir convertido "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await del.mutateAsync(id);
      toast.success("Convertido excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <div className="space-y-12 text-foreground">
      <header className="border-b border-border pb-8">
        <div className="flex items-baseline justify-between text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-6">
          <span>Registro pastoral</span>
          <span className="font-editorial italic normal-case tracking-normal text-muted-foreground text-sm">
            {filtrados.length} {filtrados.length === 1 ? "nome" : "nomes"} sob nossa mesa
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-[-0.03em] font-light">
              Convertidos<span className="font-editorial italic text-primary">.</span>
            </h1>
            <p className="mt-4 max-w-lg text-muted-foreground font-editorial italic text-lg">
              &mdash; cada linha, uma história que ainda está sendo escrita.
            </p>
          </div>
          {editor && (
            <Button asChild className="rounded-none bg-primary text-primary-foreground hover:opacity-90 h-12 px-6 gap-3">
              <Link to="/convertidos/novo">
                <Plus className="h-4 w-4" /> Registrar convertido
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Search bar as editorial */}
      <div className="flex items-center border-b border-border pb-3 gap-3">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          placeholder="Buscar por nome ou telefone..."
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 font-serif text-lg placeholder:text-muted-foreground placeholder:italic"
        />
      </div>

      {isLoading ? (
        <div className="grid place-content-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : itens.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-editorial italic text-2xl text-muted-foreground">
            &mdash; a mesa ainda está por ser posta.
          </p>
          <p className="text-sm text-muted-foreground mt-3">Nenhum convertido encontrado.</p>
        </div>
      ) : (
        <ul className="border-t border-foreground">
          {itens.map((c, i) => (
            <li
              key={c.id}
              className="group grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_2fr_1.2fr_1fr_auto] gap-4 sm:gap-6 items-baseline py-5 border-b border-border hover:bg-muted/50 transition-colors -mx-4 sm:-mx-6 px-4 sm:px-6"
            >
              <span className="font-editorial italic text-primary/70 text-sm tabular-nums">
                {String((pagSegura - 1) * PAGE_SIZE + i + 1).padStart(2, "0")}
              </span>
              <div>
                <Link
                  to="/convertidos/$id"
                  params={{ id: c.id }}
                  className="font-serif text-xl sm:text-2xl tracking-tight text-foreground hover:text-primary transition-colors"
                >
                  {c.nome}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                  {c.telefone ?? "—"} · {formatDate(c.data_conversao)}
                </p>
              </div>
              <span className="hidden sm:block text-sm text-muted-foreground tabular-nums">
                {c.telefone ?? "—"}
              </span>
              <span className="hidden sm:block text-sm font-editorial italic text-muted-foreground">
                {formatDate(c.data_conversao)}
              </span>
              <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                <Button asChild size="icon" variant="ghost" title="Ver">
                  <Link to="/convertidos/$id" params={{ id: c.id }}>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                {editor && (
                  <>
                    <Button asChild size="icon" variant="ghost" title="Editar">
                      <Link to="/convertidos/$id/editar" params={{ id: c.id }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Excluir"
                      onClick={() => onExcluir(c.id, c.nome)}
                      disabled={del.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-700" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {filtrados.length > PAGE_SIZE && (
        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground font-editorial italic">
            Fólio {pagSegura} de {totalPag} &middot; {filtrados.length} registros
          </p>
          <div className="flex gap-6 text-sm">
            <button
              className="hover:text-primary disabled:opacity-30"
              disabled={pagSegura === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              &larr; Anterior
            </button>
            <button
              className="hover:text-primary disabled:opacity-30"
              disabled={pagSegura === totalPag}
              onClick={() => setPagina((p) => Math.min(totalPag, p + 1))}
            >
              Próxima &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("pt-BR");
}