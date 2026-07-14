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
import { PageHeader } from "@/components/layout/PageHeader";

const SUGESTOES = [
  "O que é a Igreja do Nazareno?",
  "Quais são os artigos de fé?",
  "Como é o processo de batismo?",
  "O que diz o manual sobre dízimo?",
  "O que é santificação inteira?",
];

type Msg = { role: "user" | "assistant"; content: string };

export function ManualPage() {
  const search = useSearch({ strict: false }) as { secao?: string; tab?: string };
  const navigate = useNavigate();
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
    <div>
      <PageHeader
        chapter="01"
        eyebrow="Pastoral · Doutrina"
        title="Manual da Igreja do Nazareno"
        lede="Um livro aberto ao lado da mesa: leia devagar, ou pergunte alto — alguém sempre responde."
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v); navigate({ search: { ...search, tab: v } as any }); }}>
        <TabsList className="rounded-none bg-transparent border-b border-border p-0 h-auto gap-6">
          <TabsTrigger value="conteudo" className="rounded-none gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-2 text-[11px] uppercase tracking-widest shadow-none">
            <BookText className="h-4 w-4" /> Conteúdo
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-none gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-0 pb-2 text-[11px] uppercase tracking-widest shadow-none">
            <MessagesSquare className="h-4 w-4" /> Chat IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conteudo" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
            <aside className="border-r border-border pr-6 h-[calc(100vh-18rem)] overflow-y-auto">
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar no manual…"
                  className="pl-8 h-9 rounded-none border-0 border-b border-border focus-visible:ring-0 focus-visible:border-primary bg-transparent"
                />
              </div>
              {filtrado ? (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                    {filtrado.length} resultado(s)
                  </p>
                  {filtrado.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSecaoAtiva(s.id); setFiltro(""); }}
                      className={cn(
                        "block w-full text-left py-2 text-sm border-l-2 pl-3 -ml-3 transition-colors",
                        secaoAtiva === s.id ? "border-primary text-primary" : "border-transparent hover:border-stone-400",
                      )}
                    >
                      <p className="font-serif">{s.titulo}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate mt-0.5">{s.capituloTitulo}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <nav className="space-y-5">
                  {MANUAL.map((p, pi) => (
                    <div key={p.id}>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2 mb-2">
                        <span className="font-serif italic text-primary tabular-nums">{String(pi + 1).padStart(2, "0")}</span>
                        <span className="h-px flex-1 bg-stone-200" />
                        {p.titulo}
                      </p>
                      {p.capitulos.map((c) => (
                        <div key={c.id} className="mt-1">
                          <p className="font-serif italic text-sm text-muted-foreground mt-2">
                            {c.titulo}
                          </p>
                          {c.secoes.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => setSecaoAtiva(s.id)}
                              className={cn(
                                "block w-full text-left py-1.5 text-sm border-l-2 pl-3 transition-colors",
                                secaoAtiva === s.id
                                  ? "border-primary text-primary font-medium"
                                  : "border-transparent text-foreground hover:border-stone-400",
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
            </aside>

            <div className="bg-white border border-border p-8 md:p-12 h-[calc(100vh-18rem)] overflow-y-auto">
              {secao ? (
                <article className="prose prose-stone max-w-2xl mx-auto prose-headings:font-serif prose-headings:text-foreground prose-h2:text-4xl prose-h2:leading-tight prose-p:font-[Instrument_Sans,sans-serif] prose-p:text-foreground">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground m-0 flex items-center gap-3">
                    <span className="font-serif italic text-primary text-base">§</span>
                    {secao.parteTitulo} · {secao.capituloTitulo}
                  </p>
                  <h2 className="mt-2">{secao.titulo}</h2>
                  <div className="h-px w-16 bg-primary/60 my-6" />
                  <ReactMarkdown>{secao.conteudo}</ReactMarkdown>
                  {secao.tags && (
                    <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border not-prose">
                      {secao.tags.map((t) => (
                        <span key={t} className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ) : (
                <p className="text-sm italic font-serif text-muted-foreground">Selecione uma seção no sumário.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
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
    <div className="bg-white border border-border flex flex-col h-[calc(100vh-18rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-4">
        {msgs.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif italic text-2xl text-muted-foreground">"Pergunte, e vos será respondido."</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-4">— comece com uma dúvida abaixo —</p>
          </div>
        )}
        {msgs.map((m, i) => {
          const refs = m.role === "assistant" ? buscarSecoes(m.content) : [];
          return (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] px-5 py-3 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-stone-900 text-stone-50"
                    : "bg-muted text-foreground border-l-2 border-primary",
                )}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>
                {refs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/60">
                    {refs.slice(0, 3).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onAbrirSecao(r.id)}
                        className="text-[10px] uppercase tracking-widest text-primary border-b border-primary/60 hover:border-primary"
                      >
                        § {r.titulo}
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
            <div className="bg-muted border-l-2 border-primary px-5 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-4 sm:p-6 space-y-3 bg-muted/50">
        <div className="flex flex-wrap gap-2">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => enviar(s)}
              disabled={loading}
              className="text-[11px] italic font-serif border border-border bg-white px-3 py-1.5 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              "{s}"
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite sua pergunta…"
            disabled={loading}
            className="rounded-none border-0 border-b border-border bg-transparent focus-visible:ring-0 focus-visible:border-primary"
          />
          <Button type="submit" disabled={loading || !texto.trim()} className="rounded-none bg-stone-900 hover:bg-stone-800">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}