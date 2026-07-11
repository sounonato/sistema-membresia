import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function TrocarSenhaPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senhaNova.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senhaNova !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    try {
      await api.trocarSenha(senhaAtual, senhaNova);
      logout();
      navigate({ to: "/login" });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao trocar senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 grid place-content-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 mb-3">
            Primeiro acesso
          </p>
          <h1 className="font-serif text-3xl text-stone-900 mb-2">
            Crie sua senha
          </h1>
          <p className="text-sm text-stone-600">
            {usuario?.nome ? `Olá, ${usuario.nome.split(" ")[0]}. ` : ""}
            Por segurança, defina uma senha pessoal antes de continuar.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white border border-stone-200 rounded-md p-8 space-y-5"
        >
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-stone-500">
              Senha temporária recebida
            </Label>
            <Input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="A senha que você recebeu por e-mail"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-stone-500">
              Nova senha
            </Label>
            <Input
              type="password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-stone-500">
              Confirmar nova senha
            </Label>
            <Input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a nova senha"
              required
            />
          </div>

          {erro && (
            <div className="border border-red-200 bg-red-50 text-red-800 text-sm rounded-md p-3">
              {erro}
            </div>
          )}

          <Button
            type="submit"
            disabled={enviando}
            className="w-full h-12 bg-amber-700 hover:bg-amber-800 text-white rounded-md"
          >
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Salvar e entrar"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
