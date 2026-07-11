// Estrutura do Manual da Igreja do Nazareno
// Conteúdo resumido — substitua/expanda com o texto oficial enviado pelo cliente.

export type ManualSecao = {
  id: string;
  titulo: string;
  conteudo: string; // markdown
  tags?: string[];
};

export type ManualCapitulo = {
  id: string;
  titulo: string;
  secoes: ManualSecao[];
};

export type ManualParte = {
  id: string;
  titulo: string;
  capitulos: ManualCapitulo[];
};

export const MANUAL: ManualParte[] = [
  {
    id: "p1",
    titulo: "Parte I — História e Identidade",
    capitulos: [
      {
        id: "p1c1",
        titulo: "A Igreja do Nazareno",
        secoes: [
          {
            id: "sobre-nazareno",
            titulo: "Quem somos",
            tags: ["identidade", "história", "nazareno"],
            conteudo:
              "A **Igreja do Nazareno** é uma denominação cristã evangélica de tradição wesleyana, fundada em 1908 em Pilot Point, Texas. Acreditamos na **santificação inteira** como uma segunda obra da graça e enfatizamos o amor a Deus e ao próximo como centro da vida cristã.",
          },
          {
            id: "missao",
            titulo: "Missão",
            tags: ["missão", "propósito"],
            conteudo:
              "Nossa missão é **fazer discípulos semelhantes a Cristo nas nações**. Isso se desdobra em quatro práticas: evangelização, discipulado, comunhão e serviço.",
          },
        ],
      },
    ],
  },
  {
    id: "p2",
    titulo: "Parte II — Doutrinas e Fé",
    capitulos: [
      {
        id: "p2c1",
        titulo: "Artigos de Fé",
        secoes: [
          {
            id: "artigos-fe",
            titulo: "Os 16 Artigos de Fé",
            tags: ["artigos", "doutrina", "fé"],
            conteudo:
              "Cremos: **(1)** em um só Deus Triúno; **(2)** em Jesus Cristo, plenamente Deus e plenamente homem; **(3)** no Espírito Santo; **(4)** nas Escrituras como Palavra de Deus; **(5)** no pecado original; **(6)** na expiação; **(7)** na graça preveniente; **(8)** no arrependimento; **(9)** na justificação, regeneração e adoção; **(10)** na **santificação inteira**; **(11)** na Igreja; **(12)** no batismo; **(13)** na Ceia do Senhor; **(14)** na cura divina; **(15)** na segunda vinda de Cristo; **(16)** na ressurreição, juízo e destino.",
          },
          {
            id: "santificacao",
            titulo: "Santificação inteira",
            tags: ["santificação", "espírito santo", "segunda bênção"],
            conteudo:
              "Cremos que após a regeneração existe uma obra subsequente do Espírito Santo chamada **santificação inteira** — pela qual o crente é purificado do pecado original e capacitado a amar a Deus de todo o coração.",
          },
        ],
      },
    ],
  },
  {
    id: "p3",
    titulo: "Parte III — Vida da Igreja",
    capitulos: [
      {
        id: "p3c1",
        titulo: "Sacramentos e Ritos",
        secoes: [
          {
            id: "batismo",
            titulo: "Batismo",
            tags: ["batismo", "sacramento", "água"],
            conteudo:
              "O **batismo** é o sinal exterior do novo nascimento. Pode ser administrado por aspersão, efusão ou imersão, conforme a preferência do candidato. É requisito para a membresia plena.",
          },
          {
            id: "ceia",
            titulo: "Ceia do Senhor",
            tags: ["ceia", "comunhão", "sacramento"],
            conteudo:
              "A **Ceia do Senhor** é um memorial do sacrifício de Cristo e meio de graça. Deve ser celebrada regularmente e está aberta a todos os crentes em comunhão com Cristo.",
          },
        ],
      },
      {
        id: "p3c2",
        titulo: "Mordomia",
        secoes: [
          {
            id: "dizimo",
            titulo: "Dízimos e ofertas",
            tags: ["dízimo", "oferta", "mordomia", "finanças"],
            conteudo:
              "O **dízimo** (10% da renda) é o padrão bíblico mínimo de mordomia financeira. As ofertas são contribuições voluntárias além do dízimo. Ambos sustentam a obra local, distrital e missionária.",
          },
        ],
      },
    ],
  },
  {
    id: "p4",
    titulo: "Parte IV — Discipulado",
    capitulos: [
      {
        id: "p4c1",
        titulo: "Jornada do Novo Convertido",
        secoes: [
          {
            id: "passo-decisao",
            titulo: "Decisão por Cristo",
            tags: ["decisão", "conversão", "novo"],
            conteudo:
              "Após a profissão de fé, o novo convertido deve ser acolhido, registrado e direcionado a um discipulador. Os primeiros 30 dias são cruciais para fixar a decisão.",
          },
          {
            id: "passo-batismo",
            titulo: "Preparação para o batismo",
            tags: ["batismo", "preparação"],
            conteudo:
              "Antes do batismo, o convertido deve compreender o significado do sacramento, os Artigos de Fé e o compromisso de membresia.",
          },
          {
            id: "passo-modulos",
            titulo: "Módulos do discipulado",
            tags: ["discipulado", "módulos", "aulas"],
            conteudo:
              "O discipulado é estruturado em módulos sequenciais. Cada módulo possui aulas, leituras e exercícios práticos. A conclusão de todos os módulos habilita o discípulo a tornar-se **líder em formação**.",
          },
          {
            id: "passo-lideranca",
            titulo: "Liderança",
            tags: ["liderança", "formação"],
            conteudo:
              "Discípulos maduros são convidados a multiplicar a obra liderando novos grupos de discipulado.",
          },
        ],
      },
    ],
  },
];

export type SecaoComContexto = ManualSecao & {
  parteId: string;
  parteTitulo: string;
  capituloId: string;
  capituloTitulo: string;
};

export function listarSecoes(): SecaoComContexto[] {
  const out: SecaoComContexto[] = [];
  for (const p of MANUAL) {
    for (const c of p.capitulos) {
      for (const s of c.secoes) {
        out.push({
          ...s,
          parteId: p.id,
          parteTitulo: p.titulo,
          capituloId: c.id,
          capituloTitulo: c.titulo,
        });
      }
    }
  }
  return out;
}

export function buscarSecoes(q: string): SecaoComContexto[] {
  const termo = q.toLowerCase().trim();
  if (!termo) return [];
  const palavras = termo.split(/\s+/).filter(Boolean);
  return listarSecoes()
    .map((s) => {
      const haystack = `${s.titulo} ${s.conteudo} ${(s.tags ?? []).join(" ")}`.toLowerCase();
      const score = palavras.reduce(
        (acc, p) => acc + (haystack.includes(p) ? 1 : 0),
        0,
      );
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.s);
}

export function buscarSecaoPorId(id: string): SecaoComContexto | undefined {
  return listarSecoes().find((s) => s.id === id);
}