import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Church, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Igreja } from "@/lib/api";

export const Route = createFileRoute("/$slug/login")({
  component: SlugLogin,
});

function SlugLogin() {
  const { slug } = Route.useParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { data: igreja } = useQuery<Igreja>({
    queryKey: ["igreja-publica", slug],
    queryFn: () => api.getIgrejaPublica(slug),
  });

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await login(email, senha, slug);
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
    <div className="min-h-screen grid place-content-center bg-secondary px-4">
      <Card className="w-full max-w-md rounded-2xl border-border/60 shadow-sm">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            {igreja?.logo_url ? (
              <img
                src={igreja.logo_url}
                alt={igreja?.nome ?? ""}
                className="h-20 w-20 rounded-2xl object-contain bg-white border border-border"
              />
            ) : (
              <div className="grid place-content-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground">
                <Church className="h-8 w-8" />
              </div>
            )}
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Powered by Ovile</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@igreja.org"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-xl">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}