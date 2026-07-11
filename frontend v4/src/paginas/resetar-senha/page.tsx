import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function ResetarSenhaPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search?.token ?? "";

  const [senhaNova, setSenhaNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senhaNova.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senhaNova !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (!token) {
      setErro("Token inválido. Use o link recebido por e-mail.");
      return;
    }
    setEnviando(true);
    try {
      await api.resetarSenha(token, senhaNova);
      navigate({ to: "/login" });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao redefinir senha.");
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-stone-50 grid place-content-center px-4 text-center">
        <div className="max-w-sm space-y-4">
          <p className="font-serif text-2xl text-stone-900">Link inválido</p>
          <p className="text-sm text-stone-600">
            Use o link completo recebido no e-mail para redefinir sua senha.
          </p>
          <Link to="/esqueci-senha" className="text-sm text-amber-700 underline">
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 grid place-content-center px-4">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>

        <div className="mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 mb-3">
            Redefinição de senha
          </p>
          <h1 className="font-serif text-3xl text-stone-900 mb-2">
            Nova senha
          </h1>
          <p className="text-sm text-stone-600">
            Escolha uma senha segura com pelo menos 8 caracteres.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white border border-stone-200 rounded-md p-8 space-y-5"
        >
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
              Confirmar senha
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
              "Salvar nova senha"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
