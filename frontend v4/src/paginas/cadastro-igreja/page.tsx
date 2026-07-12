import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
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
import { solicitarCadastroIgreja } from "@/lib/api-publico";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function CadastroIgrejaPage() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});

  // etapa 1
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditado, setSlugEditado] = useState(false);
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [plano, setPlano] = useState<"basico" | "pro">("basico");

  // etapa 2
  const [respNome, setRespNome] = useState("");
  const [respEmail, setRespEmail] = useState("");
  const [respTel, setRespTel] = useState("");
  const [cargo, setCargo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [aceite, setAceite] = useState(false);

  function validarEtapa1() {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Informe o nome da igreja.";
    if (!slug.trim()) e.slug = "Informe o slug de acesso.";
    else if (!/^[a-z0-9-]+$/.test(slug))
      e.slug = "Use apenas letras minúsculas, números e hífen.";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function validarEtapa2() {
    const e: Record<string, string> = {};
    if (!respNome.trim()) e.respNome = "Informe seu nome.";
    if (!respEmail.trim()) e.respEmail = "Informe seu e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respEmail))
      e.respEmail = "E-mail inválido.";
    if (!aceite) e.aceite = "É preciso aceitar os termos de uso.";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function irParaEtapa2() {
    if (validarEtapa1()) {
      setErro(null);
      setEtapa(2);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validarEtapa2()) return;
    setEnviando(true);
    setErro(null);
    try {
      await solicitarCadastroIgreja({
        nome: nome.trim(),
        slug: slug.trim(),
        cidade: cidade.trim() || undefined,
        estado: estado || undefined,
        plano,
        responsavel_nome: respNome.trim(),
        responsavel_email: respEmail.trim(),
        responsavel_telefone: respTel.trim() || undefined,
        cargo_responsavel: cargo || undefined,
        mensagem: mensagem.trim() || undefined,
      });
      navigate({ to: "/cadastro/sucesso" });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl">
            Ovile<span className="text-amber-700">.</span>
          </Link>
          <Link
            to="/"
            className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Progresso */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-stone-500 mb-3">
            <span className={etapa === 1 ? "text-amber-700" : ""}>
              01 · Igreja
            </span>
            <span className={etapa === 2 ? "text-amber-700" : ""}>
              02 · Responsável
            </span>
          </div>
          <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-700 transition-all"
              style={{ width: etapa === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>

        <div className="mb-10">
          <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight mb-2">
            {etapa === 1 ? "Sobre a sua igreja" : "Sobre você"}
          </h1>
          <p className="text-stone-600">
            {etapa === 1
              ? "Vamos começar com alguns dados básicos da comunidade."
              : "Quem será o responsável pelo cadastro no sistema?"}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white border border-stone-200 rounded-md p-8 space-y-6"
        >
          {etapa === 1 ? (
            <>
              <Campo label="Nome da igreja" erro={erros.nome} obrigatorio>
                <Input
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (!slugEditado) setSlug(slugify(e.target.value));
                  }}
                  placeholder="Ex.: Igreja do Nazareno Central"
                />
              </Campo>

              <Campo label="Slug de acesso" erro={erros.slug} obrigatorio>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setSlugEditado(true);
                  }}
                  placeholder="nazareno-central"
                />
                <p className="text-xs text-stone-500 mt-2">
                  Slug de acesso:{" "}
                  <span className="font-mono text-stone-800">
                    {slug || "sua-igreja"}
                  </span>
                </p>
              </Campo>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Campo label="Cidade">
                    <Input
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                    />
                  </Campo>
                </div>
                <Campo label="Estado">
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 mb-3 block">
                  Plano
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["basico", "pro"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlano(p)}
                      className={`text-left border rounded-md p-4 transition ${
                        plano === p
                          ? "border-amber-700 ring-1 ring-amber-700 bg-amber-50/40"
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <p className="font-serif text-lg">
                        {p === "basico" ? "Básico" : "Pro"}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {p === "basico"
                          ? "Até 100 membros · 3 usuários"
                          : "Ilimitado · todos os módulos"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="button"
                  onClick={irParaEtapa2}
                  className="w-full h-12 bg-amber-700 hover:bg-amber-800 text-white rounded-md gap-2"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Campo label="Nome do responsável" erro={erros.respNome} obrigatorio>
                <Input value={respNome} onChange={(e) => setRespNome(e.target.value)} />
              </Campo>
              <Campo label="E-mail" erro={erros.respEmail} obrigatorio>
                <Input
                  type="email"
                  value={respEmail}
                  onChange={(e) => setRespEmail(e.target.value)}
                />
              </Campo>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo label="Telefone / WhatsApp">
                  <Input
                    value={respTel}
                    onChange={(e) => setRespTel(maskPhone(e.target.value))}
                    placeholder="(11) 91234-5678"
                  />
                </Campo>
                <Campo label="Cargo na igreja">
                  <Select value={cargo} onValueChange={setCargo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pastor">Pastor</SelectItem>
                      <SelectItem value="Lider">Líder</SelectItem>
                      <SelectItem value="Secretario">Secretário</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </Campo>
              </div>
              <Campo label="Mensagem adicional">
                <Textarea
                  rows={4}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Conte um pouco sobre a igreja (opcional)"
                />
              </Campo>

              <label className="flex items-start gap-3 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceite}
                  onChange={(e) => setAceite(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-amber-700"
                />
                <span>
                  Concordo com os{" "}
                  <a
                    href="/termos"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-700 underline hover:text-amber-900"
                  >
                    termos de uso
                  </a>{" "}
                  e com o tratamento dos dados informados para análise do cadastro.
                </span>
              </label>
              {erros.aceite && (
                <p className="text-sm text-red-600 -mt-3">{erros.aceite}</p>
              )}

              {erro && (
                <div className="border border-red-200 bg-red-50 text-red-800 text-sm rounded-md p-3">
                  {erro}
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEtapa(1)}
                  className="sm:w-40 h-12 rounded-md border-stone-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 h-12 bg-amber-700 hover:bg-amber-800 text-white rounded-md gap-2"
                >
                  {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar solicitação
                </Button>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
}

function Campo({
  label,
  erro,
  obrigatorio,
  children,
}: {
  label: string;
  erro?: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-widest text-stone-500 mb-2 block">
        {label} {obrigatorio && <span className="text-amber-700">*</span>}
      </Label>
      {children}
      {erro && <p className="text-sm text-red-600 mt-1.5">{erro}</p>}
    </div>
  );
}