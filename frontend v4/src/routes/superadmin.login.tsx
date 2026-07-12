import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/superadmin/login")({
  component: SuperadminLogin,
});

function SuperadminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await login(email, senha, "nazareno-sede");
      toast.success("Bem-vindo, superadmin.");
      navigate({ to: "/igrejas" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao entrar";
      setErro(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-content-center bg-stone-950 px-4">
      <Card className="w-full max-w-sm rounded-2xl border-white/10 bg-stone-900 shadow-xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="grid place-content-center h-16 w-16 rounded-2xl bg-amber-700/20 text-amber-400">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="font-serif text-xl text-white">Ovile</p>
              <p className="text-xs text-stone-500 tracking-widest uppercase mt-1">Painel Superadmin</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-stone-300">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="super@plataforma.com"
                className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha" className="text-stone-300">Senha</Label>
              <Input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="bg-stone-800 border-stone-700 text-white"
              />
            </div>
            {erro && <p className="text-sm text-red-400">{erro}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-700 hover:bg-amber-600 text-white gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
