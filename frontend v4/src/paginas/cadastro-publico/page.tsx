import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Igreja = { id: string; nome: string; slug: string };
type GrupoLite = { id: string; nome: string };

export function CadastroPublicoPage() {
  const { slug } = useParams({ from: "/cadastro/$slug" });
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const grupoInicial = search?.get("grupo") ?? "";

  const igrejaQ = useQuery<Igreja>({
    queryKey: ["publico", "igreja", slug],
    queryFn: () => api.getIgrejaPublica(slug),
  });
  const gruposQ = useQuery<GrupoLite[]>({
    queryKey: ["publico", "grupos", slug],
    queryFn: () => api.getGruposPublicos(slug),
  });

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    data_nascimento: "",
    sexo: "",
    endereco: "",
    cidade: "",
    grupo_id: grupoInicial,
    decisao: "",
    como_conheceu: "",
    deseja_batismo: "",
    pedido_oracao: "",
    avaliacao_curso: "",
    observacoes: "",
  });

  function up<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const m = useMutation({
    mutationFn: () => api.cadastroPublico(slug, form),
    onError: (e: Error) => toast.error(e.message),
  });

  if (igrejaQ.isLoading) {
    return (
      <div className="min-h-screen grid place-content-center text-stone-500 bg-stone-50">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <span className="italic font-serif">Carregando…</span>
      </div>
    );
  }

  if (igrejaQ.isError || !igrejaQ.data) {
    return (
      <div className="min-h-screen grid place-content-center px-6 text-center bg-stone-50">
        <div className="bg-white border border-stone-200 p-10 max-w-md">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Erro 404</p>
          <h1 className="mt-2 font-serif text-3xl text-stone-900">Igreja não encontrada</h1>
          <p className="mt-3 font-[Instrument_Serif,serif] italic text-stone-600">
            Verifique o QR ou o link recebido.
          </p>
        </div>
      </div>
    );
  }

  if (m.isSuccess) {
    return (
      <div className="min-h-screen grid place-content-center px-6 bg-stone-50">
        <div className="bg-white border border-stone-200 p-12 max-w-lg text-center">
          <div className="mx-auto grid place-content-center h-14 w-14 rounded-full border border-primary text-primary mb-6">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-stone-500">Recebido</p>
          <h1 className="mt-3 font-serif text-4xl text-stone-900 leading-tight">
            Bem-vindo(a),<br/><em className="font-[Instrument_Serif,serif] text-primary">{form.nome.split(" ")[0]}</em>.
          </h1>
          <p className="mt-4 font-[Instrument_Serif,serif] italic text-lg text-stone-600">
            Uma cadeira já foi posta no seu nome — em breve alguém desta casa entra em contato.
          </p>
        </div>
      </div>
    );
  }

  const igreja = igrejaQ.data;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-950 text-stone-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-[10px] uppercase tracking-[0.4em] text-stone-400">
            {igreja.nome}
          </p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05]">
            Faça parte<br/>
            <em className="font-[Instrument_Serif,serif] text-primary">desta casa.</em>
          </h1>
          <p className="mt-4 font-[Instrument_Serif,serif] italic text-lg text-stone-300 max-w-md">
            Preencha em silêncio, sem pressa. Cada resposta é uma linha da sua história aqui.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.nome || !form.telefone) {
              toast.error("Nome e telefone são obrigatórios");
              return;
            }
            m.mutate();
          }}
          className="space-y-14"
        >
          <Chapter n="I" title="Seus dados" lede="O básico para achar você quando a próxima carta chegar.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome completo *">
                <Input value={form.nome} onChange={(e) => up("nome", e.target.value)} required />
              </Field>
              <Field label="Telefone / WhatsApp *">
                <Input value={form.telefone} onChange={(e) => up("telefone", e.target.value)} required />
              </Field>
              <Field label="E-mail">
                <Input type="email" value={form.email} onChange={(e) => up("email", e.target.value)} />
              </Field>
              <Field label="Data de nascimento">
                <Input type="date" value={form.data_nascimento} onChange={(e) => up("data_nascimento", e.target.value)} />
              </Field>
              <Field label="Sexo">
                <Select value={form.sexo} onValueChange={(v) => up("sexo", v)}>
                  <SelectTrigger className="rounded-none border-0 border-b border-stone-400 focus:ring-0 focus:border-primary bg-transparent"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cidade">
                <Input value={form.cidade} onChange={(e) => up("cidade", e.target.value)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Endereço">
                <Input value={form.endereco} onChange={(e) => up("endereco", e.target.value)} />
              </Field>
            </div>
          </Chapter>

          <Chapter n="II" title="Grupo de discipulado" lede="Onde a fé deixa de ser assunto e vira mesa comum.">
            <Field label="Em qual grupo você está participando?">
              <Select value={form.grupo_id} onValueChange={(v) => up("grupo_id", v)}>
                <SelectTrigger className="rounded-none border-0 border-b border-stone-400 focus:ring-0 focus:border-primary bg-transparent"><SelectValue placeholder="Selecione o grupo (opcional)" /></SelectTrigger>
                <SelectContent>
                  {(gruposQ.data ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Chapter>

          <Chapter n="III" title="Sua história" lede="Nada aqui é prova — é conversa. Responda como se conte a alguém que te espera.">
            <div className="space-y-6">
            <Field label="Você tomou uma decisão por Jesus?">
              <RadioGroup value={form.decisao} onValueChange={(v) => up("decisao", v)} className="flex gap-6 flex-wrap pt-2">
                {["Sim, primeira vez", "Reconciliação", "Já era convertido", "Ainda pensando"].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm text-stone-700">
                    <RadioGroupItem value={o} /> {o}
                  </label>
                ))}
              </RadioGroup>
            </Field>

            <Field label="Deseja ser batizado(a)?">
              <RadioGroup value={form.deseja_batismo} onValueChange={(v) => up("deseja_batismo", v)} className="flex gap-6 flex-wrap pt-2">
                {["Sim", "Não", "Quero conversar"].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm text-stone-700">
                    <RadioGroupItem value={o} /> {o}
                  </label>
                ))}
              </RadioGroup>
            </Field>

            <Field label="Como avalia o curso?">
              <RadioGroup value={form.avaliacao_curso} onValueChange={(v) => up("avaliacao_curso", v)} className="flex gap-4 flex-wrap pt-2">
                {["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-base">
                    <RadioGroupItem value={o} /> {o}
                  </label>
                ))}
              </RadioGroup>
            </Field>

            <Field label="Como conheceu a igreja?">
              <Input value={form.como_conheceu} onChange={(e) => up("como_conheceu", e.target.value)} placeholder="Convite, redes sociais, evento…" />
            </Field>

            <Field label="Pedido de oração">
              <Textarea value={form.pedido_oracao} onChange={(e) => up("pedido_oracao", e.target.value)} rows={3} />
            </Field>

            <Field label="Observações">
              <Textarea value={form.observacoes} onChange={(e) => up("observacoes", e.target.value)} rows={2} />
            </Field>
            </div>
          </Chapter>

          <div className="border-t border-stone-300 pt-6">
            <Button type="submit" size="lg" className="w-full rounded-none bg-stone-950 hover:bg-stone-900 h-14 text-base tracking-wide" disabled={m.isPending}>
              {m.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enviar meu nome
            </Button>
            <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-stone-500">
              Fim · página {igreja.nome}
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}

function Chapter({ n, title, lede, children }: { n: string; title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section>
      <header className="border-b border-stone-300 pb-4 mb-6">
        <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-500">
          <span className="font-serif italic text-primary text-xl leading-none">{n}</span>
          <span className="h-px w-6 bg-stone-400" />
          Capítulo
        </p>
        <h2 className="mt-2 font-serif text-3xl text-stone-900">{title}</h2>
        {lede && (
          <p className="mt-1 font-[Instrument_Serif,serif] italic text-stone-600">{lede}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-widest text-stone-500">{label}</Label>
      {children}
    </div>
  );
}