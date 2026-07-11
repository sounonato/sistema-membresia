import { useState, type FormEvent } from "react";
import { useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, type Igreja } from "@/lib/api";

const inputClass =
  "border-0 border-b border-stone-300 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-amber-800 font-serif text-base h-11";

export function CadastroMembroPublicoPage() {
  const { slug } = useParams({ from: "/cadastro-membro/$slug" });
  const igrejaQ = useQuery<{ igreja: Igreja } | Igreja>({
    queryKey: ["igreja-publica-membro", slug],
    queryFn: () => api.getIgrejaCadastroMembro(slug),
    enabled: !!slug,
  });
  const cadastrar = useMutation({
    mutationFn: (data: unknown) => api.cadastroPublicoMembro(slug, data),
  });

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [genero, setGenero] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) return;
    try {
      await cadastrar.mutateAsync({
        nome,
        telefone,
        email: email || undefined,
        data_nascimento: dataNascimento || undefined,
        genero: genero || undefined,
      });
      setSucesso(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao cadastrar");
    }
  }

  if (igrejaQ.isLoading)
    return (
      <div className="min-h-screen bg-[#faf7f2] grid place-content-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );

  if (igrejaQ.isError)
    return (
      <div className="min-h-screen bg-[#faf7f2] grid place-content-center">
        <p className="font-serif italic text-stone-500">Igreja não encontrada.</p>
      </div>
    );

  const raw = igrejaQ.data as { igreja?: Igreja } & Igreja;
  const igreja: Igreja | undefined = raw?.igreja ?? (raw as Igreja);

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-900">
      <div className="max-w-lg mx-auto px-6 py-12">
        <header className="text-center mb-10">
          {igreja?.logo_url ? (
            <img
              src={igreja.logo_url}
              alt={igreja.nome}
              className="h-20 w-20 rounded-full object-cover mx-auto mb-4"
            />
          ) : (
            <div className="grid place-content-center h-20 w-20 rounded-full bg-amber-100 text-amber-800 font-serif text-3xl mx-auto mb-4">
              {igreja?.nome?.[0] ?? "?"}
            </div>
          )}
          <h1 className="font-serif text-3xl leading-tight">{igreja?.nome}</h1>
          <p className="font-serif italic text-stone-600 mt-1">
            Cadastre-se na nossa membresia
          </p>
          {(igreja?.cidade || igreja?.estado) && (
            <p className="text-xs uppercase tracking-widest text-stone-500 mt-2">
              {[igreja?.cidade, igreja?.estado].filter(Boolean).join(" / ")}
            </p>
          )}
        </header>

        {sucesso ? (
          <div className="text-center border border-stone-200 bg-white p-10 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-amber-700 mx-auto" />
            <h2 className="font-serif text-3xl">Bem-vindo à membresia!</h2>
            <p className="text-stone-700">
              Seu cadastro foi recebido. Em breve entraremos em contato por
              telefone.
            </p>
            <p className="font-serif italic text-stone-500">
              Que Deus abençoe cada passo da sua jornada.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="border border-stone-200 bg-white p-8 space-y-6"
          >
            <h2 className="text-[10px] tracking-widest uppercase text-stone-500">
              Seus dados
            </h2>

            <Field label="Nome">
              <Input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Telefone">
              <Input
                required
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Data de nascimento">
              <Input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Gênero">
              <Select value={genero} onValueChange={setGenero}>
                <SelectTrigger className="rounded-none border-stone-300 h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Button
              type="submit"
              disabled={cadastrar.isPending}
              className="w-full h-14 rounded-none bg-stone-900 text-amber-50 hover:bg-amber-800 gap-2"
            >
              {cadastrar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Solicitar cadastro
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-1 block">
        {label}
      </Label>
      {children}
    </div>
  );
}