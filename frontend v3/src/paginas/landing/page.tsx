import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import sanctuaryImg from "@/assets/landing-sanctuary.jpg";
import cultoImg from "@/assets/landing-culto.jpg";
import discipuladoImg from "@/assets/landing-discipulado.jpg";
import comunidadeImg from "@/assets/landing-comunidade.jpg";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-900 selection:bg-amber-200/60">
      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 flex items-center justify-between text-white mix-blend-difference">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-2xl tracking-tight">Nazareno</span>
            <span className="font-editorial text-lg opacity-70">est. 1908</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#manifesto" className="hover:opacity-70 transition">01 Manifesto</a>
            <a href="#jornada" className="hover:opacity-70 transition">02 Jornada</a>
            <a href="#casa" className="hover:opacity-70 transition">03 Nossa casa</a>
          </nav>
          <Link to="/login" className="text-sm border-b border-current pb-0.5 hover:opacity-70 transition">
            Entrar &rarr;
          </Link>
        </div>
      </header>

      {/* HERO — asymmetric editorial */}
      <section className="relative min-h-screen flex flex-col justify-end overflow-hidden bg-stone-950">
        <img
          src={sanctuaryImg}
          alt="Luz atravessando os vitrais do santuário"
          width={1600}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/20" />

        {/* massive year type as background gesture */}
        <div aria-hidden className="absolute right-[-2rem] top-24 font-serif text-[22rem] leading-none text-white/5 select-none tabular-nums">
          MMXXV
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 pb-16 md:pb-24 w-full text-white">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="text-xs tracking-[0.3em] uppercase text-amber-300/90 mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-amber-300/60" />
                Uma casa aberta desde 1908
              </p>
              <h1 className="font-serif text-[clamp(3rem,9vw,8.5rem)] leading-[0.9] tracking-[-0.04em] font-light">
                A luz não<br />
                <span className="font-editorial italic text-amber-200">precisa</span> ser<br />
                explicada.
              </h1>
            </div>
            <div className="lg:col-span-4 lg:pb-4 space-y-6">
              <p className="text-base text-white/70 leading-relaxed max-w-sm">
                Ela apenas atravessa o vitral, toca o banco de madeira e encontra alguém que precisava dela naquele instante.
              </p>
              <div className="flex flex-col gap-3">
                <a href="#jornada">
                  <Button size="lg" className="w-full sm:w-auto rounded-none bg-amber-200 text-stone-950 hover:bg-amber-300 gap-3 h-14 px-8">
                    Comece sua jornada <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#casa" className="text-sm text-white/60 hover:text-white transition">
                  Ou apenas venha nos visitar &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* baseline metadata strip */}
          <div className="mt-16 pt-6 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs uppercase tracking-widest text-white/60">
            <div><span className="block text-white/40 mb-1">Fundada</span>1908 · Pilot Point</div>
            <div><span className="block text-white/40 mb-1">Missão</span>Santidade & discipulado</div>
            <div><span className="block text-white/40 mb-1">Culto principal</span>Domingo · 18h30</div>
            <div><span className="block text-white/40 mb-1">Localização</span>Centro</div>
          </div>
        </div>
      </section>

      {/* 01 MANIFESTO — editorial pull quote */}
      <section id="manifesto" className="py-32 md:py-48 px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-2 text-xs tracking-[0.3em] uppercase text-stone-500 lg:pt-4">
            <span className="tabular-nums">01</span> — Manifesto
          </div>
          <div className="lg:col-span-10">
            <p className="font-serif text-[clamp(2rem,4.5vw,4.25rem)] leading-[1.1] tracking-[-0.03em] text-stone-900 font-light">
              Cremos que o Evangelho ainda&nbsp;
              <span className="font-editorial italic text-amber-800">interrompe</span>&nbsp;
              o cotidiano. Que a mesa é mais importante que o púlpito. Que
              discipulado não é currículo &mdash; é caminhada. E que ninguém
              chega até aqui por acaso.
            </p>

            <div className="mt-16 grid md:grid-cols-3 gap-x-10 gap-y-12 border-t border-stone-300 pt-12">
              {[
                { n: "I.", t: "Santidade", d: "Uma vida transformada é o melhor argumento que temos." },
                { n: "II.", t: "Comunidade", d: "Fé se sustenta em torno de uma mesa, não sozinha em um banco." },
                { n: "III.", t: "Missão", d: "Quem foi encontrado, encontra. É assim que o Reino se move." },
              ].map((it) => (
                <div key={it.t}>
                  <p className="font-editorial text-3xl text-amber-800 mb-3">{it.n}</p>
                  <h3 className="font-serif text-xl mb-2 text-stone-900">{it.t}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{it.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 02 JORNADA — image + text pair with big numeral */}
      <section id="jornada" className="bg-stone-900 text-stone-100 py-32 md:py-48 px-6 lg:px-10 relative overflow-hidden">
        <div aria-hidden className="absolute -right-20 -top-16 font-serif text-[28rem] leading-none text-white/[0.03] select-none">
          02
        </div>
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-8 relative">
          <div className="lg:col-span-6">
            <img
              src={discipuladoImg}
              alt="Grupo de discipulado ao redor de uma mesa"
              loading="lazy"
              width={1200}
              height={900}
              className="w-full h-[520px] object-cover grayscale-[20%]"
            />
            <p className="mt-4 text-xs text-stone-400 font-editorial italic">
              &mdash; Grupo de discipulado, terça à noite.
            </p>
          </div>
          <div className="lg:col-span-6 lg:pl-8 flex flex-col justify-center">
            <div className="text-xs tracking-[0.3em] uppercase text-amber-300/80 mb-6">
              <span className="tabular-nums">02</span> — Jornada do convertido
            </div>
            <h2 className="font-serif text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.03em] font-light mb-8">
              Da primeira visita ao&nbsp;
              <span className="font-editorial italic text-amber-200">chamado</span>.
            </h2>
            <div className="space-y-0 border-t border-white/10">
              {[
                ["Chegada", "Uma mesa, um café, uma conversa sem pressa."],
                ["Decisão", "Você não precisa entender tudo. Só dar o próximo passo."],
                ["Discipulado", "Doze semanas em um pequeno grupo, com alguém ao lado."],
                ["Batismo", "O testemunho público da mudança que já aconteceu por dentro."],
                ["Vocação", "Servir, liderar, plantar. O que Deus colocou em você."],
              ].map(([t, d], i) => (
                <div key={t} className="grid grid-cols-[3rem_1fr] gap-4 py-5 border-b border-white/10 items-baseline">
                  <span className="font-editorial italic text-amber-300/70 text-lg tabular-nums">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="font-serif text-2xl mb-1">{t}</p>
                    <p className="text-sm text-stone-400 leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 03 NOSSA CASA — dense info grid */}
      <section id="casa" className="py-32 md:py-48 px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 mb-16">
            <div className="lg:col-span-2 text-xs tracking-[0.3em] uppercase text-stone-500 lg:pt-4">
              <span className="tabular-nums">03</span> — Nossa casa
            </div>
            <div className="lg:col-span-10">
              <h2 className="font-serif text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.03em] font-light">
                Você é&nbsp;
                <span className="font-editorial italic text-amber-800">esperado</span>.
                Não visitante. Esperado.
              </h2>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* schedule table */}
            <div className="lg:col-span-7 border-t-2 border-stone-900">
              {[
                ["Domingo", "18:30", "Culto de Celebração", "Sanctuário principal"],
                ["Quarta", "19:30", "Culto de Oração", "Salão do café"],
                ["Sexta", "19:30", "Curso de Discipulado", "Salas 1 – 4"],
                ["Sábado", "16:00", "Encontro de jovens", "Anfiteatro"],
              ].map(([dia, hora, nome, local]) => (
                <div key={nome} className="grid grid-cols-[5rem_5rem_1fr_auto] gap-4 py-5 border-b border-stone-300 items-baseline group hover:bg-amber-50/50 transition -mx-4 px-4">
                  <span className="text-xs uppercase tracking-widest text-stone-500">{dia}</span>
                  <span className="font-serif text-2xl tabular-nums">{hora}</span>
                  <span className="font-serif text-xl text-stone-900">{nome}</span>
                  <span className="text-xs text-stone-500 font-editorial italic">{local}</span>
                </div>
              ))}
            </div>

            {/* address card */}
            <div className="lg:col-span-5 lg:pl-8 flex flex-col justify-between gap-8">
              <div className="relative overflow-hidden">
                <img
                  src={cultoImg}
                  alt="Culto na Igreja do Nazareno"
                  loading="lazy"
                  width={1200}
                  height={900}
                  className="w-full h-64 object-cover"
                />
              </div>
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-3 flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Endereço
                </p>
                <p className="font-serif text-2xl leading-tight text-stone-900">
                  Rua da Esperança, 100<br />
                  <span className="font-editorial italic text-stone-600 text-xl">Centro &middot; estacionamento gratuito</span>
                </p>
              </div>
              <img
                src={comunidadeImg}
                alt="Comunhão entre os irmãos"
                loading="lazy"
                width={1200}
                height={900}
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Closing statement */}
      <section className="bg-amber-900 text-amber-50 py-32 md:py-48 px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto text-center">
          <p className="font-editorial italic text-2xl text-amber-200/80 mb-8">
            &mdash; Vem, e vê.
          </p>
          <p className="font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[1] tracking-[-0.03em] font-light max-w-5xl mx-auto">
            Uma cadeira já está posta no seu nome.
          </p>
          <div className="mt-16">
            <Link to="/login">
              <Button size="lg" variant="secondary" className="rounded-none bg-amber-50 text-amber-900 hover:bg-white h-14 px-10 gap-3">
                Acessar o sistema <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-400 py-12 px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6 text-xs tracking-widest uppercase">
          <div>
            <p className="font-serif text-2xl text-stone-100 normal-case tracking-tight">Nazareno</p>
            <p className="mt-1 font-editorial italic normal-case text-stone-500 text-sm">&copy; {new Date().getFullYear()} &mdash; Feito com cuidado pastoral.</p>
          </div>
          <div className="flex gap-8">
            <Link to="/login" className="hover:text-stone-100">Sistema</Link>
            <a href="#manifesto" className="hover:text-stone-100">Manifesto</a>
            <a href="#casa" className="hover:text-stone-100">Visite</a>
          </div>
        </div>
      </footer>
    </div>
  );
}