import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CadastroSucessoPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Link to="/" className="font-serif text-xl">
            Ovile<span className="text-amber-700">.</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 grid place-content-center px-6 py-16">
        <div className="max-w-lg text-center bg-white border border-stone-200 rounded-md p-12">
        <div className="h-20 w-20 rounded-full bg-amber-50 border border-amber-100 grid place-content-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-amber-700" strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-4xl leading-tight mb-4">
          Solicitação enviada!
        </h1>
        <p className="text-stone-600 leading-relaxed mb-8">
          Recebemos o cadastro da sua igreja. Nossa equipe vai analisar em até{" "}
          <span className="text-stone-900 font-medium">48 horas</span> e entrar
          em contato pelo e-mail informado.
        </p>
        <Link to="/">
          <Button className="bg-amber-700 hover:bg-amber-800 text-white rounded-md h-11 px-6">
            Voltar para o início
          </Button>
        </Link>
        </div>
      </main>
    </div>
  );
}