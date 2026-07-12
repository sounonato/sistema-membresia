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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Igreja = { id: string; nome: string; slug: string };

export function CadastroPublicoPage() {
  const { slug } = useParams({ from: "/cadastro/$slug" });
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const grupoInicial = search?.get("grupo") ?? "";

  const igrejaQ = useQuery<Igreja>({
    queryKey: ["publico", "igreja", slug],
    queryFn: () => api.getIgrejaPublica(slug),
  });

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    data_nascimento: "",
    estado_civil: "",
    genero: "",
    profissao: "",
    tem_filhos: false,
    endereco: "",
    bairro: "",
    cidade: "",
    como_conheceu: "",
    batizado: false,
    quer_batismo: false,
    ja_frequentava_igreja: false,
    ja_fez_discipulado: false,
    pedido_oracao: "",
    grupo_id: grupoInicial,
  });

  function up<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const m = useMutation({
    mutationFn: () => api.cadastroPublico(slug, form),
    onError: (e: Error) => toast.error(e.message),
  });

  if (igrejaQ.isLoading) {
    return (
      <div className="min-h-screen grid place-content-center text-stone-500 bg-amber-50">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <span className="italic font-serif">Carregando…</span>
      </div>
    );
  }

  if (igrejaQ.isError || !igrejaQ.data) {
    return (
      <div className="min-h-screen grid place-content-center px-6 text-center bg-amber-50">
        <div className="bg-white border border-stone-200 p-10 max-w-md rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Erro 404</p>
          <h1 className="mt-2 font-serif text-3xl text-stone-900">Igreja não encontrada</h1>
          <p className="mt-3 italic text-stone-600">Verifique o QR ou o link recebido.</p>
        </div>
      </div>
    );
  }

  if (m.isSuccess) {
    return (
      <div className="min-h-screen grid place-content-center px-6 bg-amber-50">
        <div className="bg-white border border-stone-200 p-12 max-w-lg text-center rounded-2xl shadow-sm">
          <div className="mx-auto grid place-content-center h-16 w-16 rounded-full bg-amber-100 text-amber-700 mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-4xl text-stone-900 leading-tight">
            Bem-vindo(a), <span className="text-amber-700">{form.nome.split(" ")[0]}</span>!
          </h1>
          <p className="mt-4 text-stone-600 text-lg">
            Seus dados foram recebidos. Em breve alguém da nossa equipe entrará em contato.
          </p>
        </div>
      </div>
    );
  }

  const igreja = igrejaQ.data;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 py-6 px-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 grid place-content-center mb-3">
          <span className="text-2xl">⛪</span>
        </div>
        <h1 className="font-serif text-2xl text-stone-900">Bem-vindo(a)!</h1>
        <p className="text-stone-500 text-sm mt-1">Preencha seus dados para começarmos sua jornada</p>
        <p className="text-xs text-amber-700 font-medium mt-1">{igreja.nome}</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.nome || !form.telefone) {
              toast.error("Nome e WhatsApp são obrigatórios");
              return;
            }
            m.mutate();
          }}
        >
          {/* Dados Pessoais */}
          <Section icon="👤" title="Dados Pessoais">
            <Field label="Nome completo *">
              <Input
                value={form.nome}
                onChange={(e) => up("nome", e.target.value)}
                placeholder="Seu nome completo"
                required
                className="rounded-lg border-stone-300"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="WhatsApp *">
                <Input
                  value={form.telefone}
                  onChange={(e) => up("telefone", e.target.value)}
                  placeholder="(88) 99999-9999"
                  required
                  className="rounded-lg border-stone-300"
                />
              </Field>
              <Field label="E-mail">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => up("email", e.target.value)}
                  placeholder="seu@email.com"
                  className="rounded-lg border-stone-300"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Data de nascimento">
                <Input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => up("data_nascimento", e.target.value)}
                  className="rounded-lg border-stone-300"
                />
              </Field>
              <Field label="Estado civil">
                <Select value={form.estado_civil} onValueChange={(v) => up("estado_civil", v)}>
                  <SelectTrigger className="rounded-lg border-stone-300">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União estável</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Gênero / Faixa etária">
                <Select value={form.genero} onValueChange={(v) => up("genero", v)}>
                  <SelectTrigger className="rounded-lg border-stone-300">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Profissão">
                <Input
                  value={form.profissao}
                  onChange={(e) => up("profissao", e.target.value)}
                  placeholder="Sua profissão"
                  className="rounded-lg border-stone-300"
                />
              </Field>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={form.tem_filhos}
                onCheckedChange={(v) => up("tem_filhos", !!v)}
                className="rounded border-stone-300"
              />
              <span className="text-sm text-stone-700">Tem filhos?</span>
            </label>
          </Section>

          {/* Endereço */}
          <Section icon="📍" title="Endereço">
            <Field label="Endereço">
              <Input
                value={form.endereco}
                onChange={(e) => up("endereco", e.target.value)}
                placeholder="Rua, número"
                className="rounded-lg border-stone-300"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bairro">
                <Input
                  value={form.bairro}
                  onChange={(e) => up("bairro", e.target.value)}
                  placeholder="Seu bairro"
                  className="rounded-lg border-stone-300"
                />
              </Field>
              <Field label="Cidade">
                <Input
                  value={form.cidade}
                  onChange={(e) => up("cidade", e.target.value)}
                  placeholder="Sua cidade"
                  className="rounded-lg border-stone-300"
                />
              </Field>
            </div>
          </Section>

          {/* Informações de Fé */}
          <Section icon="❤️" title="Informações de Fé">
            <Field label="Como conheceu nossa igreja?">
              <Select value={form.como_conheceu} onValueChange={(v) => up("como_conheceu", v)}>
                <SelectTrigger className="rounded-lg border-stone-300">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="convite_amigo">Convite de um amigo</SelectItem>
                  <SelectItem value="familiar">Familiar</SelectItem>
                  <SelectItem value="redes_sociais">Redes sociais</SelectItem>
                  <SelectItem value="evento">Evento / Culto especial</SelectItem>
                  <SelectItem value="passando">Passando em frente</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 bg-stone-50 rounded-lg p-3 cursor-pointer border border-stone-200">
                <Checkbox
                  checked={form.batizado}
                  onCheckedChange={(v) => up("batizado", !!v)}
                  className="rounded border-stone-300"
                />
                <span className="text-sm text-stone-700">Sou batizado(a)</span>
              </label>

              <label className="flex items-center gap-3 bg-stone-50 rounded-lg p-3 cursor-pointer border border-stone-200">
                <Checkbox
                  checked={form.quer_batismo}
                  onCheckedChange={(v) => up("quer_batismo", !!v)}
                  className="rounded border-stone-300"
                />
                <span className="text-sm text-stone-700">Quero me batizar</span>
              </label>

              <label className="flex items-center gap-3 bg-stone-50 rounded-lg p-3 cursor-pointer border border-stone-200">
                <Checkbox
                  checked={form.ja_frequentava_igreja}
                  onCheckedChange={(v) => up("ja_frequentava_igreja", !!v)}
                  className="rounded border-stone-300"
                />
                <span className="text-sm text-stone-700">Frequentava outra igreja</span>
              </label>

              <label className="flex items-center gap-3 bg-stone-50 rounded-lg p-3 cursor-pointer border border-stone-200">
                <Checkbox
                  checked={form.ja_fez_discipulado}
                  onCheckedChange={(v) => up("ja_fez_discipulado", !!v)}
                  className="rounded border-stone-300"
                />
                <span className="text-sm text-stone-700">Já fiz discipulado</span>
              </label>
            </div>

            <Field label="Pedido de oração (opcional)">
              <Textarea
                value={form.pedido_oracao}
                onChange={(e) => up("pedido_oracao", e.target.value)}
                placeholder="Deixe aqui seu pedido de oração..."
                rows={4}
                className="rounded-lg border-stone-300 resize-none"
              />
            </Field>
          </Section>

          <Button
            type="submit"
            disabled={m.isPending}
            className="w-full h-14 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-base font-medium"
          >
            {m.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : null}
            Enviar meus dados ✨
          </Button>
          <p className="text-center text-xs text-stone-500 pb-4">
            Seus dados são sigilosos e serão usados apenas pela equipe pastoral.
          </p>
        </form>
      </main>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
      <h2 className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-stone-500 font-medium">{label}</Label>
      {children}
    </div>
  );
}
