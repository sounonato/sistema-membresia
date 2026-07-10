import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { Church, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <div className="min-h-screen grid place-content-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Carregando…
      </div>
    );
  }

  if (igrejaQ.isError || !igrejaQ.data) {
    return (
      <div className="min-h-screen grid place-content-center px-6 text-center">
        <Card className="rounded-2xl p-8 max-w-md">
          <h1 className="font-serif text-2xl text-foreground">Igreja não encontrada</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Verifique o QR Code ou o link recebido e tente novamente.
          </p>
        </Card>
      </div>
    );
  }

  if (m.isSuccess) {
    return (
      <div className="min-h-screen grid place-content-center px-6">
        <Card className="rounded-2xl p-10 max-w-md text-center">
          <div className="mx-auto grid place-content-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-2xl text-foreground">Cadastro recebido!</h1>
          <p className="mt-2 text-muted-foreground">
            Que alegria ter você conosco, {form.nome.split(" ")[0]}. Em breve um de nossos
            líderes entrará em contato.
          </p>
        </Card>
      </div>
    );
  }

  const igreja = igrejaQ.data;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex items-center gap-4">
          <div className="grid place-content-center h-12 w-12 rounded-2xl bg-primary-foreground/15">
            <Church className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-primary-foreground/80">
              Cadastro de Convertido
            </p>
            <h1 className="font-serif text-2xl">{igreja.nome}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-muted-foreground mb-6">
          Preencha o formulário abaixo para finalizar seu cadastro e fazer parte da
          nossa comunidade.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.nome || !form.telefone) {
              toast.error("Nome e telefone são obrigatórios");
              return;
            }
            m.mutate();
          }}
          className="space-y-6"
        >
          {/* Dados pessoais */}
          <Card className="rounded-2xl p-6 space-y-4">
            <h2 className="font-serif text-lg text-foreground">Seus dados</h2>
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
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
            <Field label="Endereço">
              <Input value={form.endereco} onChange={(e) => up("endereco", e.target.value)} />
            </Field>
          </Card>

          {/* Grupo */}
          <Card className="rounded-2xl p-6 space-y-4">
            <h2 className="font-serif text-lg text-foreground">Grupo de discipulado</h2>
            <Field label="Em qual grupo você está participando?">
              <Select value={form.grupo_id} onValueChange={(v) => up("grupo_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o grupo (opcional)" /></SelectTrigger>
                <SelectContent>
                  {(gruposQ.data ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Card>

          {/* Questionário */}
          <Card className="rounded-2xl p-6 space-y-5">
            <h2 className="font-serif text-lg text-foreground">Questionário</h2>

            <Field label="Você tomou uma decisão por Jesus?">
              <RadioGroup value={form.decisao} onValueChange={(v) => up("decisao", v)} className="flex gap-6">
                {["Sim, primeira vez", "Reconciliação", "Já era convertido", "Ainda pensando"].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={o} /> {o}
                  </label>
                ))}
              </RadioGroup>
            </Field>

            <Field label="Deseja ser batizado(a)?">
              <RadioGroup value={form.deseja_batismo} onValueChange={(v) => up("deseja_batismo", v)} className="flex gap-6">
                {["Sim", "Não", "Quero conversar"].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={o} /> {o}
                  </label>
                ))}
              </RadioGroup>
            </Field>

            <Field label="Como avalia o curso?">
              <RadioGroup value={form.avaliacao_curso} onValueChange={(v) => up("avaliacao_curso", v)} className="flex gap-6">
                {["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"].map((o) => (
                  <label key={o} className="flex items-center gap-2 text-sm">
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
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={m.isPending}>
            {m.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Finalizar cadastro
          </Button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}