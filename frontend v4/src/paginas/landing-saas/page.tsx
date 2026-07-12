import { Link } from "@tanstack/react-router";
import { ArrowRight, QrCode, Users, HeartHandshake, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingSaasPage() {
  return (
    <div className="min-h-screen bg-white text-stone-900">
      {/* Nav */}
      <header className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl tracking-tight">
            Ovile<span className="text-amber-700">.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-stone-600">
            <a href="#recursos" className="hover:text-stone-900 transition">Recursos</a>
            <a href="#como-funciona" className="hover:text-stone-900 transition">Como funciona</a>
            <a href="#planos" className="hover:text-stone-900 transition">Planos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm text-stone-600 hover:text-stone-900 transition px-3 py-2"
            >
              Entrar
            </Link>
            <Link to="/cadastro">
              <Button size="sm" className="bg-amber-700 hover:bg-amber-800 text-white rounded-md">
                Cadastrar igreja
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-36">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.3em] uppercase text-amber-700 mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-amber-700" />
              Sistema de membresia para igrejas
            </p>
            <h1 className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.02] tracking-[-0.03em] font-light">
              Cuide das pessoas,
              <br />
              <span className="italic text-amber-800">não das planilhas.</span>
            </h1>
            <p className="mt-8 text-lg text-stone-600 max-w-xl leading-relaxed">
              Sistema completo de membros, discipulado e ministérios para sua
              igreja. Simples, pastoral e sob medida para a realidade das
              igrejas evangélicas.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link to="/cadastro">
                <Button
                  size="lg"
                  className="bg-amber-700 hover:bg-amber-800 text-white rounded-md h-12 px-7 gap-2"
                >
                  Cadastrar minha igreja <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-stone-300 text-stone-800 hover:bg-stone-50 rounded-md h-12 px-7"
                >
                  Ver como funciona
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="border-b border-stone-200 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-4">
              01 — Recursos
            </p>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">
              O que o sistema oferece
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                titulo: "Módulo Membresia",
                texto:
                  "Controle completo de membros, com QR Code de auto-cadastro impresso no boletim ou compartilhado no WhatsApp.",
              },
              {
                icon: HeartHandshake,
                titulo: "Módulo Discipulado",
                texto:
                  "Grupos, progresso de aulas e convertidos acompanhados com histórico visual da caminhada de cada pessoa.",
              },
              {
                icon: QrCode,
                titulo: "Módulo Ministérios",
                texto:
                  "Organize os times de servos: cargos, membros ativos, encerramentos e histórico ministerial da igreja.",
              },
            ].map(({ icon: Icon, titulo, texto }) => (
              <div
                key={titulo}
                className="bg-white border border-stone-200 p-8 rounded-md"
              >
                <div className="h-12 w-12 rounded-md bg-amber-50 border border-amber-100 grid place-content-center text-amber-700 mb-6">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-2xl mb-3">{titulo}</h3>
                <p className="text-stone-600 leading-relaxed text-[15px]">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-4">
              02 — Como funciona
            </p>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">
              Do cadastro ao painel em poucos passos
            </h2>
          </div>
          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 border border-stone-200 rounded-md overflow-hidden">
            {[
              ["Cadastre sua igreja", "Preencha um formulário simples com os dados básicos."],
              ["Aguarde a aprovação", "Nossa equipe analisa em até 48 horas úteis."],
              ["Acesse seu painel", "Você recebe o link exclusivo da sua igreja."],
              ["Convide sua equipe", "Adicione pastores, líderes e discipuladores."],
            ].map(([titulo, texto], i) => (
              <li key={titulo} className="bg-white p-8">
                <div className="font-serif text-5xl text-amber-700 mb-4 tabular-nums font-light">
                  0{i + 1}
                </div>
                <h3 className="font-serif text-xl mb-2">{titulo}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="border-b border-stone-200 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-4">
              03 — Planos
            </p>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">
              Comece grátis. Cresça no seu tempo.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <PlanoCard
              nome="Básico"
              preco="Gratuito"
              descricao="Ideal para igrejas locais começando a organizar sua membresia."
              recursos={[
                "Até 100 membros cadastrados",
                "Até 3 usuários no sistema",
                "Módulos essenciais de membresia",
                "QR Code de auto-cadastro",
                "Suporte por e-mail",
              ]}
            />
            <PlanoCard
              destaque
              nome="Pro"
              preco="Sob consulta"
              descricao="Para igrejas em crescimento que precisam de todos os módulos."
              recursos={[
                "Membros ilimitados",
                "Usuários ilimitados",
                "Todos os módulos (Discipulado, Ministérios, Relatórios)",
                "Follow-up via WhatsApp",
                "Suporte prioritário",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-stone-500">
          <div>
            <p className="font-serif text-lg text-stone-900">
              Ovile<span className="text-amber-700">.</span>
            </p>
            <p className="mt-1 text-xs">
              Desenvolvido para igrejas evangélicas · &copy; {new Date().getFullYear()}
            </p>
          </div>
          <div className="flex gap-6 text-xs uppercase tracking-widest">
            <a href="#recursos" className="hover:text-stone-900">Recursos</a>
            <a href="#planos" className="hover:text-stone-900">Planos</a>
            <Link to="/cadastro" className="hover:text-stone-900">Cadastro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlanoCard({
  nome,
  preco,
  descricao,
  recursos,
  destaque,
}: {
  nome: string;
  preco: string;
  descricao: string;
  recursos: string[];
  destaque?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-md p-8 flex flex-col ${
        destaque ? "border-amber-700 ring-1 ring-amber-700" : "border-stone-200"
      }`}
    >
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-serif text-2xl">{nome}</h3>
        {destaque && (
          <span className="text-[10px] tracking-widest uppercase text-amber-700 border border-amber-700 px-2 py-0.5 rounded-sm">
            Recomendado
          </span>
        )}
      </div>
      <p className="font-serif text-3xl text-stone-900 mb-2">{preco}</p>
      <p className="text-sm text-stone-600 mb-6">{descricao}</p>
      <ul className="space-y-3 mb-8 flex-1">
        {recursos.map((r) => (
          <li key={r} className="flex items-start gap-3 text-sm text-stone-700">
            <Check className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <Link to="/cadastro">
        <Button
          className={`w-full h-11 rounded-md ${
            destaque
              ? "bg-amber-700 hover:bg-amber-800 text-white"
              : "bg-stone-900 hover:bg-stone-800 text-white"
          }`}
        >
          Começar com {nome}
        </Button>
      </Link>
    </div>
  );
}