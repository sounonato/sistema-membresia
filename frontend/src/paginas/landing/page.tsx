import { Link } from "@tanstack/react-router";
import { Church, HeartHandshake, BookOpen, Users, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImg from "@/assets/landing-hero.jpg";
import cultoImg from "@/assets/landing-culto.jpg";
import discipuladoImg from "@/assets/landing-discipulado.jpg";
import comunidadeImg from "@/assets/landing-comunidade.jpg";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white drop-shadow">
            <div className="grid place-content-center h-10 w-10 rounded-2xl bg-primary text-primary-foreground">
              <Church className="h-5 w-5" />
            </div>
            <span className="font-serif text-lg">Igreja do Nazareno</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/90 drop-shadow">
            <a href="#sobre" className="hover:text-white">Sobre</a>
            <a href="#discipulado" className="hover:text-white">Discipulado</a>
            <a href="#horarios" className="hover:text-white">Horários</a>
            <Link to="/login">
              <Button size="sm" variant="secondary">Acessar sistema</Button>
            </Link>
          </nav>
          <Link to="/login" className="md:hidden">
            <Button size="sm" variant="secondary">Entrar</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <img
          src={heroImg}
          alt="Fachada da Igreja do Nazareno ao pôr do sol"
          width={1600}
          height={1024}
          className="h-[80vh] min-h-[520px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 w-full text-white">
            <p className="font-serif text-amber-200 text-sm tracking-widest uppercase mb-3">
              Bem-vindo à nossa casa
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl max-w-3xl leading-tight">
              Uma comunidade de fé, esperança e <span className="text-amber-300">amor</span>.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/85">
              Cultos inspiradores, discipulado profundo e relacionamentos verdadeiros.
              Você é nosso convidado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#discipulado">
                <Button size="lg" className="gap-2">
                  Conheça o discipulado <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#horarios">
                <Button size="lg" variant="secondary">Ver horários</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">Quem somos</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
              Uma igreja viva, centrada em Cristo
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              A Igreja do Nazareno é uma família ministerial dedicada à santidade, ao
              discipulado e à missão. Aqui acolhemos pessoas de todas as histórias para
              caminhar juntas em fé e em propósito.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {[
                { icon: Users, label: "Comunidade" },
                { icon: BookOpen, label: "Palavra" },
                { icon: HeartHandshake, label: "Cuidado" },
              ].map(({ icon: Icon, label }) => (
                <Card key={label} className="rounded-2xl p-4 flex items-center gap-3">
                  <div className="grid place-content-center h-10 w-10 rounded-xl bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-foreground">{label}</span>
                </Card>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={cultoImg} alt="Culto na Igreja do Nazareno" loading="lazy" width={1200} height={900} className="rounded-2xl object-cover h-64 w-full shadow-lg" />
            <img src={comunidadeImg} alt="Comunhão entre os irmãos" loading="lazy" width={1200} height={900} className="rounded-2xl object-cover h-64 w-full shadow-lg mt-8" />
          </div>
        </div>
      </section>

      {/* Discipulado */}
      <section id="discipulado" className="py-20 sm:py-28 bg-secondary/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <img src={discipuladoImg} alt="Grupo de discipulado em estudo da Bíblia" loading="lazy" width={1200} height={900} className="rounded-2xl object-cover h-[440px] w-full shadow-xl order-2 lg:order-1" />
          <div className="order-1 lg:order-2">
            <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">Curso de Discipulado</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
              Cresça na fé em comunidade
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Nosso curso de discipulado é uma jornada estruturada em módulos para
              fortalecer sua caminhada com Deus, encontrar mentores e descobrir o seu
              propósito no Reino.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Aulas semanais em pequenos grupos",
                "Discipuladores treinados e dedicados",
                "Material baseado no Manual da Igreja",
                "Acompanhamento pessoal do seu progresso",
              ].map((it) => (
                <li key={it} className="flex items-start gap-3 text-foreground">
                  <span className="mt-1 grid place-content-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">✓</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a href="#horarios">
                <Button size="lg" className="gap-2">Quero participar <ArrowRight className="h-4 w-4" /></Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Horários */}
      <section id="horarios" className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Venha nos visitar</h2>
          <p className="mt-3 text-muted-foreground">As portas estão sempre abertas para você.</p>
          <div className="mt-10 grid md:grid-cols-3 gap-5 text-left">
            {[
              { titulo: "Culto de Celebração", horario: "Domingos, 18h30" },
              { titulo: "Culto de Oração", horario: "Quartas, 19h30" },
              { titulo: "Discipulado", horario: "Sextas, 19h30" },
            ].map((c) => (
              <Card key={c.titulo} className="rounded-2xl p-6">
                <div className="flex items-center gap-3 text-primary">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">{c.titulo}</span>
                </div>
                <p className="mt-3 font-serif text-2xl text-foreground">{c.horario}</p>
              </Card>
            ))}
          </div>
          <Card className="rounded-2xl p-6 mt-6 flex flex-col sm:flex-row items-center gap-4 justify-center text-left">
            <div className="grid place-content-center h-12 w-12 rounded-2xl bg-accent text-accent-foreground">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">Endereço</p>
              <p className="text-muted-foreground text-sm">
                Rua da Esperança, 100 — Centro · Estacionamento gratuito
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Church className="h-4 w-4 text-primary" />
            <span>© {new Date().getFullYear()} Igreja do Nazareno</span>
          </div>
          <Link to="/login" className="hover:text-foreground">Acesso ao sistema</Link>
        </div>
      </footer>
    </div>
  );
}