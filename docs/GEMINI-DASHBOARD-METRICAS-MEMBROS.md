# Planejamento: Dashboard de Métricas + Relatórios de Membros

## Contexto do projeto

Sistema SaaS multi-tenant para igrejas — Node.js + Express + PostgreSQL (Railway) no backend, React + TypeScript + TanStack Router + Recharts no frontend (Cloudflare Pages).

- Backend: `/backend/src/` — porta 3031
- Frontend: `/frontend v4/src/` — porta 5175
- Auth: JWT via `autenticar` middleware, tenant via `identificarTenant` (injeta `req.igrejaId`)
- Perfis: `superadmin | admin | lider | pastor | discipulador`
- Charting: **Recharts ^2.15.4** já instalado
- Exportação: **xlsx** e **jspdf + jspdf-autotable** já instalados

---

## Regras obrigatórias do projeto

### Frontend (Clean Code + SOLID)
Cada página DEVE ter 3 arquivos:
- `src/paginas/<nome>/page.tsx` — JSX puro, sem lógica
- `src/paginas/<nome>/hooks.ts` — toda lógica/queries
- `src/routes/_auth.<nome>.tsx` — file route TanStack

Padrão visual existente:
- `<PageHeader chapter="XX" eyebrow="..." title="..." lede="..." />`
- Bordas sem arredondamento (`rounded-none`)
- Paleta âmbar: `#92400e` primário, stone para neutros
- Tipografia: `font-serif` para títulos/números grandes

### Backend
- Sempre filtrar por `req.igrejaId` (injetado pelo middleware)
- Padrão middlewares: `autenticar, checkPerfil([...]), identificarTenant`
- Registrar nova rota em `backend/src/index.js`

---

## O que já existe (NÃO recriar)

### Backend
- `GET /api/membros/stats` — retorna: `total, ativos, inativos, transferidos, batizados, fez_discipulado, por_genero, por_ministerio, sem_contato_60, sem_contato_90`
- `GET /api/membros` — lista paginável de membros
- `GET /api/membros/:id` — detalhe do membro

### Frontend
- `src/paginas/relatorios/page.tsx` — relatórios de convertidos (tabs: Convertidos, Aniversariantes, Decisões/Batismos, Módulos, Grupos)
- `src/paginas/dashboard/` — dashboard geral (convertidos + discipulado)
- `src/lib/api.ts` — tem `getMembrosStats()` mapeado

---

## O que o Gemini deve construir

### FASE 1 — Backend: endpoint de métricas ricas

**Criar:** `GET /api/membros/metricas`
- Middlewares: `autenticar, checkPerfil(['admin', 'lider', 'pastor']), identificarTenant`
- Registrar em `backend/src/index.js` como `app.use('/api', membrosMetricasRotas)`

Queries SQL a executar (todas filtradas por `igrejaId`):

```sql
-- 1. KPIs gerais
SELECT
  COUNT(*) FILTER (WHERE status = 'ativo') as ativos,
  COUNT(*) FILTER (WHERE status = 'inativo') as inativos,
  COUNT(*) FILTER (WHERE status = 'transferido') as transferidos,
  COUNT(*) FILTER (WHERE status = 'falecido') as falecidos,
  COUNT(*) FILTER (WHERE batizado = true AND status = 'ativo') as batizados,
  COUNT(*) FILTER (WHERE fez_discipulado = true AND status = 'ativo') as fez_discipulado
FROM membros WHERE igreja_id = $1 AND status != 'excluido';

-- 2. Crescimento mensal (últimos 12 meses) — entradas por mês
SELECT
  TO_CHAR(data_entrada, 'YYYY-MM') as mes,
  COUNT(*) as entradas
FROM membros
WHERE igreja_id = $1
  AND data_entrada >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY mes ORDER BY mes ASC;

-- 3. Distribuição por gênero (ativos)
SELECT COALESCE(genero, 'nao_informado') as genero, COUNT(*) as quantidade
FROM membros WHERE igreja_id = $1 AND status = 'ativo'
GROUP BY genero;

-- 4. Distribuição por faixa etária (ativos)
SELECT
  CASE
    WHEN data_nascimento IS NULL THEN 'Não informado'
    WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) < 18 THEN '0-17'
    WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 18 AND 24 THEN '18-24'
    WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 25 AND 34 THEN '25-34'
    WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 35 AND 44 THEN '35-44'
    WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 45 AND 54 THEN '45-54'
    WHEN EXTRACT(YEAR FROM AGE(data_nascimento)) BETWEEN 55 AND 64 THEN '55-64'
    ELSE '65+'
  END as faixa,
  COUNT(*) as quantidade
FROM membros WHERE igreja_id = $1 AND status = 'ativo'
GROUP BY faixa ORDER BY MIN(COALESCE(data_nascimento, '9999-01-01'));

-- 5. Distribuição por estado civil (ativos)
SELECT COALESCE(estado_civil, 'nao_informado') as estado_civil, COUNT(*) as quantidade
FROM membros WHERE igreja_id = $1 AND status = 'ativo'
GROUP BY estado_civil;

-- 6. Por ministério (todos ativos)
SELECT mn.nome as ministerio, COUNT(mm.membro_id) as quantidade
FROM ministerios mn
LEFT JOIN membro_ministerios mm ON mn.id = mm.ministerio_id AND mm.ativo = true
WHERE mn.igreja_id = $1 AND mn.ativo = true
GROUP BY mn.nome ORDER BY quantidade DESC;

-- 7. Sem contato por período
SELECT
  COUNT(*) FILTER (WHERE ultimo_contato < CURRENT_DATE - INTERVAL '30 days') as sem_contato_30,
  COUNT(*) FILTER (WHERE ultimo_contato < CURRENT_DATE - INTERVAL '60 days') as sem_contato_60,
  COUNT(*) FILTER (WHERE ultimo_contato < CURRENT_DATE - INTERVAL '90 days') as sem_contato_90
FROM membros WHERE igreja_id = $1 AND status = 'ativo';

-- 8. Por cidade (top 10)
SELECT COALESCE(cidade, 'Não informado') as cidade, COUNT(*) as quantidade
FROM membros WHERE igreja_id = $1 AND status = 'ativo'
GROUP BY cidade ORDER BY quantidade DESC LIMIT 10;

-- 9. Aniversariantes do mês atual
SELECT nome, telefone, data_nascimento,
  EXTRACT(YEAR FROM AGE(data_nascimento)) as idade
FROM membros
WHERE igreja_id = $1 AND status = 'ativo'
  AND data_nascimento IS NOT NULL
  AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY EXTRACT(DAY FROM data_nascimento);
```

**Resposta JSON:**
```json
{
  "kpis": {
    "ativos": 224, "inativos": 5, "transferidos": 2,
    "falecidos": 0, "batizados": 180, "fez_discipulado": 120
  },
  "crescimento_mensal": [
    { "mes": "2025-08", "entradas": 12 },
    { "mes": "2025-09", "entradas": 8 }
  ],
  "por_genero": [
    { "genero": "feminino", "quantidade": 140 },
    { "genero": "masculino", "quantidade": 84 }
  ],
  "por_faixa_etaria": [
    { "faixa": "0-17", "quantidade": 30 },
    { "faixa": "18-24", "quantidade": 35 }
  ],
  "por_estado_civil": [
    { "estado_civil": "casado", "quantidade": 95 },
    { "estado_civil": "solteiro", "quantidade": 100 }
  ],
  "por_ministerio": [
    { "ministerio": "Louvor", "quantidade": 25 }
  ],
  "sem_contato": {
    "sem_contato_30": 10,
    "sem_contato_60": 4,
    "sem_contato_90": 1
  },
  "por_cidade": [
    { "cidade": "Paulista", "quantidade": 205 },
    { "cidade": "Olinda", "quantidade": 10 }
  ],
  "aniversariantes_mes": [
    { "nome": "João Silva", "telefone": "81999999999", "data_nascimento": "1990-07-15", "idade": 36 }
  ]
}
```

**Arquivo a criar:** `backend/src/rotas/membrosMetricas.js`

---

### FASE 2 — Frontend: Página de Métricas de Membros

**Criar os arquivos:**
- `frontend v4/src/paginas/membros-metricas/page.tsx`
- `frontend v4/src/paginas/membros-metricas/hooks.ts`
- `frontend v4/src/routes/_auth.membros-metricas.tsx`

**hooks.ts:**
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMembrosMetricas() {
  return useQuery({
    queryKey: ["membros-metricas"],
    queryFn: () => api.getMembrosMetricas(),
    staleTime: 5 * 60 * 1000,
  });
}
```

**Adicionar em `src/lib/api.ts`:**
```ts
getMembrosMetricas: () => request("/membros/metricas"),
```

**page.tsx — layout da página:**

```
PageHeader chapter="02" eyebrow="Membresia · Análise" title="Métricas" lede="..."

Seção 1 — KPIs (grid 3 ou 6 colunas)
  Cards: Ativos | Inativos | Batizados | Fez Discipulado | Sem contato 60d | Transferidos

Seção 2 — Crescimento Mensal
  Título: "Crescimento de Membros"
  Recharts BarChart (barras verticais)
  Eixo X: meses (formato "MMM/AA")
  Série única: "Entradas" (cor âmbar #b45309)
  Tooltip com valor
  ResponsiveContainer width="100%" height={300}

Seção 3 — grid 2 colunas
  Coluna A: "Distribuição por Sexo"
    Recharts PieChart (donut)
    feminino=#b45309, masculino=#78716c, nao_informado=#d6d3d1
    Legenda embaixo

  Coluna B: "Perfil de Membros por Estado Civil"
    Recharts BarChart horizontal (layout="vertical")
    casado, solteiro, divorciado, viuvo, uniao_estavel, nao_informado

Seção 4 — "Faixa Etária"
  Recharts BarChart vertical com 7 barras coloridas:
  0-17 (amarelo #f59e0b), 18-24 (azul #3b82f6), 25-34 (roxo #8b5cf6),
  35-44 (verde #22c55e), 45-54 (laranja #f97316), 55-64 (ciano #06b6d4), 65+ (vermelho #ef4444)
  Cada barra com cor própria via Cell do Recharts

Seção 5 — grid 2 colunas
  Coluna A: "Por Ministério"
    Recharts BarChart horizontal com nomes de ministério no eixo Y
    Cor âmbar

  Coluna B: "Por Cidade (Top 10)"
    Tabela simples: Cidade | Quantidade | barra de proporção inline

Seção 6 — "Aniversariantes do Mês"
  Lista de cards ou tabela: Dia | Nome | Idade | Telefone (com link WhatsApp)
  Mostrar "Nenhum aniversariante este mês" se vazio

Seção 7 — "Alerta: Sem Contato"
  3 cards lado a lado:
  "Há 30+ dias" (amarelo) | "Há 60+ dias" (laranja) | "Há 90+ dias" (vermelho)
  Link para filtrar membros por sem contato
```

**route:** `createFileRoute("/_auth/membros-metricas")({ component: MembrosMetricasPage })`

---

### FASE 3 — Frontend: Expandir `/relatorios` com aba de Membros

**Modificar:** `frontend v4/src/paginas/relatorios/page.tsx`

Adicionar novas tabs à lista existente:
```
["membros", "Membros"]
["aniversariantes-membros", "Aniversariantes (Membros)"]
["sem-contato", "Sem Contato"]
["por-ministerio", "Por Ministério"]
```

Cada tab usa o componente `RelatorioTabela` já existente com os dados vindos de `getMembrosMetricas()`.

**Tab: Membros** — lista de todos os membros ativos com colunas:
Nome | Telefone | Gênero | Data Entrada | Tipo Entrada | Batizado | Ministério

Buscar dados via `api.getMembros()` (já existe).

**Tab: Aniversariantes (Membros)** — usar `metricas.aniversariantes_mes`
Colunas: Dia | Nome | Telefone | Idade

**Tab: Sem Contato** — usar `api.getMembrosSemContato(dias)` (já existe)
Selectbox de 30/60/90 dias
Colunas: Nome | Telefone | Último Contato | Dias sem contato

**Tab: Por Ministério** — usar `metricas.por_ministerio`
Colunas: Ministério | Membros

---

### FASE 4 — Sidebar: adicionar "Métricas" no menu de Membros

**Modificar:** `frontend v4/src/components/layout/Sidebar.tsx`

Localizar o grupo "Membresia" ou "Membros" e adicionar:
```ts
{ to: "/membros-metricas", label: "Métricas", perfis: ["admin", "lider", "pastor"] }
```

---

### FASE 5 — routeTree.gen.ts

**Modificar:** `frontend v4/src/routeTree.gen.ts`

Registrar a nova rota `/_auth/membros-metricas` seguindo exatamente o padrão das rotas existentes (ex: `/_auth/migracao` adicionada recentemente).

Padrão a seguir: buscar todas as ocorrências de `"/_auth/migracao"` no arquivo e replicar o mesmo padrão para `"/_auth/membros-metricas"`.

---

## Resumo dos arquivos a criar/modificar

### Criar
1. `backend/src/rotas/membrosMetricas.js` — endpoint `/api/membros/metricas`
2. `frontend v4/src/paginas/membros-metricas/page.tsx` — página de métricas
3. `frontend v4/src/paginas/membros-metricas/hooks.ts` — hook de dados
4. `frontend v4/src/routes/_auth.membros-metricas.tsx` — file route

### Modificar
5. `backend/src/index.js` — registrar nova rota (`const membrosMetricasRotas = require('./rotas/membrosMetricas'); app.use('/api', membrosMetricasRotas);`)
6. `frontend v4/src/lib/api.ts` — adicionar `getMembrosMetricas: () => request("/membros/metricas")`
7. `frontend v4/src/paginas/relatorios/page.tsx` — adicionar 4 novas tabs de membros
8. `frontend v4/src/components/layout/Sidebar.tsx` — adicionar link "Métricas" no grupo Membresia
9. `frontend v4/src/routeTree.gen.ts` — registrar `/_auth/membros-metricas`

---

## Observações finais

- NÃO inventar novas dependências — Recharts e xlsx já estão instalados
- NÃO usar `cep` em nenhum INSERT de membros (coluna não existe na tabela)
- `ultimo_contato` existe na tabela `membros` (DATE, não TIMESTAMPTZ)
- O campo de batismo em membros é `batizado` (boolean) + `data_batismo` (DATE)
- Telefone de WhatsApp: formatar link como `https://wa.me/55${tel.replace(/\D/g,'')}`
- Todos os gráficos devem ter `ResponsiveContainer` do Recharts
- Seguir padrão visual: bordas `rounded-none`, cores âmbar, tipografia `font-serif` para títulos
