import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import sanctuaryImg from "@/assets/landing-sanctuary.jpg";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [slug, setSlug] = useState(
    typeof window !== "undefined" ? localStorage.getItem("slug") ?? "" : "",
  );
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await login(email, senha, slug.trim().toLowerCase());
      toast.success("Bem-vindo!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao entrar";
      setErro(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#faf7f2]">
      {/* Image side */}
      <div className="relative hidden lg:block bg-stone-950 overflow-hidden">
        <img
          src={sanctuaryImg}
          alt="Luz atravessando os vitrais"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-white">
          <Link to="/" className="flex items-baseline gap-2 text-sm">
            <span className="font-serif text-xl tracking-tight">Nazareno</span>
            <span className="font-editorial italic opacity-70">est. 1908</span>
          </Link>
          <div>
            <p className="font-editorial italic text-amber-200/80 mb-4">&mdash; A luz entra sozinha.</p>
            <p className="font-serif text-[clamp(2.5rem,4vw,4rem)] leading-[0.95] tracking-[-0.03em] font-light max-w-md">
              Você não&nbsp;
              <span className="font-editorial italic text-amber-200">precisa</span>&nbsp;
              bater à porta.
            </p>
            <p className="mt-6 text-sm text-white/60 max-w-sm">
              Sistema pastoral para acompanhar cada nome, cada jornada, cada retorno.
            </p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-baseline gap-2 mb-12">
            <span className="font-serif text-xl tracking-tight text-stone-900">Nazareno</span>
            <span className="font-editorial italic text-stone-500">est. 1908</span>
          </Link>

          <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-4 flex items-center gap-3">
            <span className="tabular-nums">01</span>
            <span className="h-px w-8 bg-stone-400" />
            Acesso pastoral
          </p>
          <h1 className="font-serif text-[clamp(2.5rem,5vw,4rem)] leading-[0.95] tracking-[-0.03em] font-light text-stone-900">
            Bem-vindo<br />
            <span className="font-editorial italic text-amber-800">de volta</span>.
          </h1>
          <p className="mt-4 font-editorial italic text-stone-500">
            &mdash; a sessão retoma exatamente de onde você parou.
          </p>

          <form onSubmit={onSubmit} className="mt-12 space-y-6">
            <FieldRow n="I." htmlFor="slug" label="Slug da igreja">
              <Input
                id="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: nazareno-centro"
                autoCapitalize="none"
                autoCorrect="off"
                className="border-0 border-b border-stone-300 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-amber-800 font-serif text-lg placeholder:text-stone-400 placeholder:italic h-12"
              />
            </FieldRow>
            <FieldRow n="II." htmlFor="email" label="E-mail">
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@igreja.org"
                className="border-0 border-b border-stone-300 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-amber-800 font-serif text-lg placeholder:text-stone-400 placeholder:italic h-12"
              />
            </FieldRow>
            <FieldRow n="III." htmlFor="senha" label="Senha">
              <Input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="&bull; &bull; &bull; &bull; &bull; &bull; &bull; &bull;"
                className="border-0 border-b border-stone-300 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-amber-800 font-serif text-lg placeholder:text-stone-400 h-12"
              />
            </FieldRow>

            {erro && (
              <p className="text-sm text-red-800 font-editorial italic border-l-2 border-red-800 pl-3">
                &mdash; {erro}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-none bg-stone-900 text-amber-50 hover:bg-amber-800 gap-3 mt-8"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
              Entrar no sistema
            </Button>
          </form>

          <p className="mt-8 text-xs text-stone-500 text-center font-editorial italic">
            &mdash; feito com cuidado pastoral.
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  n,
  htmlFor,
  label,
  children,
}: {
  n: string;
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label
        htmlFor={htmlFor}
        className="flex items-baseline gap-3 text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-1"
      >
        <span className="font-editorial italic text-amber-800 not-italic normal-case tabular-nums text-xs">
          {n}
        </span>
        {label}
      </Label>
      {children}
    </div>
  );
}