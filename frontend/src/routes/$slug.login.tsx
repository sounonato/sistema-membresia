import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useIgreja } from "./$slug";
import { useState, type FormEvent } from "react";
import { Church, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$slug/login")({
  component: SlugLoginPage,
});

function SlugLoginPage() {
  const { igreja } = useIgreja();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const logoSrc = igreja.logo_url
    ? (igreja.logo_url.startsWith("http") ? igreja.logo_url : `http://localhost:3031${igreja.logo_url}`)
    : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await login(email, senha);
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative">
      {/* Background radial glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 select-none blur-[140px]"
        style={{ 
          background: `radial-gradient(circle at center, ${igreja.cor_primaria ?? "#b45309"} 0%, transparent 60%)` 
        }}
      />

      <header className="absolute inset-x-0 top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Button 
            onClick={() => navigate({ to: "/$slug", params: { slug: igreja.slug } })}
            variant="ghost" 
            className="text-slate-350 hover:text-white rounded-xl gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative z-10">
        <Card className="w-full max-w-md bg-slate-950/60 backdrop-blur-xl border-slate-800/80 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              {logoSrc ? (
                <div className="h-16 w-16 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900/80 p-1.5 shadow-inner flex items-center justify-center">
                  <img 
                    src={logoSrc} 
                    alt={`Logo da igreja ${igreja.nome}`} 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div 
                  className="grid place-content-center h-16 w-16 rounded-2xl text-slate-950 shadow-md"
                  style={{ backgroundColor: igreja.cor_primaria ?? "#b45309" }}
                >
                  <Church className="h-8 w-8" />
                </div>
              )}
              <div>
                <h1 className="font-serif text-2xl text-white font-medium">{igreja.nome}</h1>
                <p className="text-xs text-slate-400">Sistema de Membresia</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@igreja.org"
                  className="bg-slate-900/50 border-slate-800 focus:border-slate-700 text-slate-100 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senha" className="text-slate-300">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="bg-slate-900/50 border-slate-800 focus:border-slate-700 text-slate-100 rounded-xl"
                />
              </div>
              {erro && <p className="text-sm text-destructive font-medium">{erro}</p>}
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full rounded-xl font-medium text-slate-950 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                style={{ 
                  backgroundColor: igreja.cor_primaria ?? "#b45309",
                  boxShadow: `0 4px 14px -3px ${(igreja.cor_primaria ?? "#b45309")}30`
                }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-6 text-center border-t border-slate-900/60 relative z-10">
        <p className="text-xs text-slate-500">
          Sistema de Membresia · Powered by Nazareno Software
        </p>
      </footer>
    </div>
  );
}
