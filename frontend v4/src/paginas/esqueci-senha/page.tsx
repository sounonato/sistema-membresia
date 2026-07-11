import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api.esqueciSenha(email.trim());
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setEnviando(false);
    }
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

        {enviado ? (
          <div className="bg-white border border-stone-200 rounded-md p-8 text-center space-y-4">
            <div className="text-4xl mb-2">📬</div>
            <h1 className="font-serif text-2xl text-stone-900">Verifique seu e-mail</h1>
            <p className="text-sm text-stone-600">
              Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá
              as instruções para redefinir sua senha em alguns minutos.
            </p>
            <p className="text-xs text-stone-400 mt-4">
              Não recebeu? Verifique a pasta de spam.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 mb-3">
                Recuperação de acesso
              </p>
              <h1 className="font-serif text-3xl text-stone-900 mb-2">
                Esqueceu a senha?
              </h1>
              <p className="text-sm text-stone-600">
                Informe o e-mail da sua conta e enviaremos um código para
                redefinir a senha.
              </p>
            </div>

            <form
              onSubmit={onSubmit}
              className="bg-white border border-stone-200 rounded-md p-8 space-y-5"
            >
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-widest text-stone-500">
                  E-mail da conta
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
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
                  "Enviar instruções"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
