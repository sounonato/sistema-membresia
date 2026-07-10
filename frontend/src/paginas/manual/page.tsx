import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { Send, Loader2, BookText, MessagesSquare, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MANUAL, buscarSecoes, buscarSecaoPorId, listarSecoes } from "@/lib/manual";

const SUGESTOES = [
  "O que é a Igreja do Nazareno?",
  "Quais são os artigos de fé?",
  "Como é o processo de batismo?",
  "O que diz o manual sobre dízimo?",
  "O que é santificação inteira?",
];

type Msg = { role: "user" | "assistant"; content: string };

export function ManualPage() {
  const search = useSearch({ from: "/_auth/manual" }) as { secao?: string; tab?: string };
  const navigate = useNavigate({ from: "/_auth/manual" });
  const initialTab = search.secao ? "conteudo" : (search.tab as string) || "conteudo";
  const [tab, setTab] = useState<string>(initialTab);
  const [secaoAtiva, setSecaoAtiva] = useState<string>(
    search.secao ?? listarSecoes()[0]?.id ?? "",
  );
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    if (search.secao && search.secao !== secaoAtiva) setSecaoAtiva(search.secao);
  }, [search.secao]);

  const secao = useMemo(() => buscarSecaoPorId(secaoAtiva), [secaoAtiva]);

  const filtrado = useMemo(() => {
    if (!filtro.trim()) return null;
    return buscarSecoes(filtro);
  }, [filtro]);

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <div className="grid place-content-center h-10 w-10 rounded-2xl bg-primary text-primary-foreground">
          <BookText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-primary">Manual da Igreja do Nazareno</h1>
          <p className="text-xs text-muted-foreground">
            Leia o conteúdo ou converse com a IA para tirar dúvidas
          </p>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); navigate({ search: { ...search, tab: v } as any }); }}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="conteudo" className="rounded-lg gap-2">
            <BookText className="h-4 w-4" /> Conteúdo
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-lg gap-2">
            <MessagesSquare className="h-4 w-4" /> Chat IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conteudo" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
            <Card className="rounded-2xl p-3 h-[calc(100vh-15rem)] overflow-y-auto">
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar no manual…"
                  className="pl-8 h-9 rounded-xl"
                />
              </div>
              {filtrado ? (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground px-2 mb-1">
                    {filtrado.length} resultado(s)
                  </p>
                  {filtrado.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSecaoAtiva(s.id); setFiltro(""); }}
                      className={cn(
                        "block w-full text-left rounded-lg px-2 py-2 text-sm hover:bg-accent transition-colors",
                        secaoAtiva === s.id && "bg-accent",
                      )}
                    >
                      <p className="font-medium">{s.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.capituloTitulo}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <nav className="space-y-3">
                  {MANUAL.map((p) => (
                    <div key={p.id}>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground px-2">
                        {p.titulo}
                      </p>
                      {p.capitulos.map((c) => (
                        <div key={c.id} className="mt-1">
                          <p className="text-xs font-medium text-foreground/70 px-2 mt-1">
                            {c.titulo}
                          </p>
                          {c.secoes.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => setSecaoAtiva(s.id)}
                              className={cn(
                                "block w-full text-left rounded-lg px-3 py-1.5 text-sm transition-colors",
                                secaoAtiva === s.id
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent",
                              )}
                            >
                              {s.titulo}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </nav>
              )}
            </Card>

            <Card className="rounded-2xl p-6 h-[calc(100vh-15rem)] overflow-y-auto">
              {secao ? (
                <article className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-primary">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground m-0">
                    {secao.parteTitulo} · {secao.capituloTitulo}
                  </p>
                  <h2 className="mt-1">{secao.titulo}</h2>
                  <ReactMarkdown>{secao.conteudo}</ReactMarkdown>
                  {secao.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-4 not-prose">
                      {secao.tags.map((t) => (
                        <span key={t} className="text-xs rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione uma seção.</p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <ChatManual onAbrirSecao={(id) => { setSecaoAtiva(id); setTab("conteudo"); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChatManual({ onAbrirSecao }: { onAbrirSecao: (id: string) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  async function enviar(pergunta: string) {
    if (!pergunta.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: pergunta.trim() };
    const historico = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, userMsg]);
    setTexto("");
    setLoading(true);

    // Busca local no manual para citar trechos
    const referencias = buscarSecoes(userMsg.content);

    try {
      const res = await api.chatManual(userMsg.content, historico).catch(() => null);
      let resposta: string;
      if (res) {
        resposta = String(
          typeof res === "string" ? res : (res as any)?.resposta ?? (res as any)?.answer ?? (res as any)?.content ?? "",
        );
      } else if (referencias.length > 0) {
        // Fallback offline: usa trechos do manual local
        resposta = `Com base no manual:\n\n${referencias
          .map((r) => `**${r.titulo}**\n${r.conteudo}`)
          .join("\n\n")}`;
      } else {
        resposta = "Não encontrei referência no manual. Tente reformular sua pergunta.";
      }
      const ref =
        referencias.length > 0
          ? `\n\n📖 _Referências: ${referencias.map((r) => r.titulo).join(", ")}_`
          : "";
      setMsgs((m) => [...m, { role: "assistant", content: resposta + ref }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
      setMsgs((m) => [...m, { role: "assistant", content: "Desculpe, ocorreu um erro." }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); enviar(texto); }

  return (
    <Card className="rounded-2xl flex flex-col h-[calc(100vh-15rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-secondary/40">
        {msgs.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            Faça uma pergunta para começar.
          </div>
        )}
        {msgs.map((m, i) => {
          const refs = m.role === "assistant" ? buscarSecoes(m.content) : [];
          return (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm",
                  m.role === "user"
                    ? "bg-accent text-accent-foreground rounded-br-sm"
                    : "bg-card text-foreground border border-border rounded-bl-sm",
                )}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>
                {refs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/60">
                    {refs.slice(0, 3).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onAbrirSecao(r.id)}
                        className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 hover:bg-primary/20"
                      >
                        📖 {r.titulo}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 sm:p-4 space-y-3 bg-card">
        <div className="flex flex-wrap gap-2">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => enviar(s)}
              disabled={loading}
              className="text-xs rounded-full border border-border bg-secondary px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite sua pergunta…"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !texto.trim()} className="rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </Card>
  );
}