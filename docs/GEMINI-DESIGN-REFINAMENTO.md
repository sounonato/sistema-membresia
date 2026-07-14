# Design Refinamento — Paleta Velvet+Bone + Dark Mode Completo

## Contexto

O frontend v4 do Ovile passou por uma migração de paleta (âmbar/stone → Velvet+Bone) e ganhou dark mode. A migração foi feita em parte via substituição em massa de classes, mas restaram problemas sérios de legibilidade e consistência. Este documento descreve exatamente o que corrigir, arquivo por arquivo.

**Frontends:** `frontend v4/` (TanStack Start + Bun + Tailwind v4)  
**Dev server:** `cd "frontend v4" && bun dev` (porta 8085)  
**Como testar dark mode:** abrir o app, clicar no ícone Moon na base da sidebar (ao lado do avatar)

---

## Sistema de cores atual (CSS variables — `src/styles.css`)

### Modo claro (`:root`)
```
--background:        oklch(0.95 0.022 78)   → bone claro #f2ebe0
--foreground:        oklch(0.14 0.08 349)   → velvet profundo #1c0510
--card:              oklch(0.98 0.010 78)   → branco quente
--primary:           oklch(0.22 0.12 349)   → velvet #4a0e2e
--primary-foreground: oklch(0.89 0.030 75) → bone #e8dcc8
--muted:             oklch(0.92 0.018 78)
--muted-foreground:  oklch(0.48 0.07 349)
--border:            oklch(0.84 0.025 75)
--accent:            oklch(0.91 0.025 78)
--destructive:       oklch(0.55 0.20 25)
```

### Modo escuro (`.dark`)
```
--background:        oklch(0.11 0.07 349)   → velvet quasi-preto #120308
--foreground:        oklch(0.89 0.030 75)   → bone #e8dcc8
--card:              oklch(0.16 0.08 349)   → velvet card #1e0812
--primary:           oklch(0.52 0.14 349)   → vinho médio
--primary-foreground: oklch(0.95 0.020 78)
--muted:             oklch(0.20 0.09 349)
--muted-foreground:  oklch(0.62 0.08 349)
--border:            oklch(0.26 0.09 349)
--accent:            oklch(0.22 0.10 349)
```

### Classes Tailwind disponíveis (via @theme inline)
- `bg-background`, `text-foreground`
- `bg-card`, `text-card-foreground`
- `bg-primary`, `text-primary`, `text-primary-foreground`
- `bg-muted`, `text-muted-foreground`
- `border-border`
- `bg-accent`, `text-accent-foreground`
- `bg-destructive`, `text-destructive`

---

## Problema 1 — `bg-white` hardcoded (CRÍTICO)

Em várias páginas, containers de tabelas e conteúdo usam `bg-white` que não muda no dark mode. Resultado: fundo branco sobre fundo velvet escuro — visual quebrado.

### Arquivos afetados e linha exata:

**`src/paginas/membros/page.tsx` linha 157:**
```tsx
// ANTES
<div className="border border-border bg-white overflow-x-auto">
// DEPOIS
<div className="border border-border bg-card overflow-x-auto">
```

**`src/paginas/discipulado/page.tsx` linha 81:**
```tsx
// ANTES
<div className="bg-white border border-border">
// DEPOIS
<div className="bg-card border border-border">
```

**`src/paginas/discipuladores/page.tsx` linha 115:**
```tsx
// ANTES
<div className="bg-white border border-border">
// DEPOIS
<div className="bg-card border border-border">
```

**`src/paginas/modulos/page.tsx` linha 64:**
```tsx
// ANTES
<div className="bg-white border border-border">
// DEPOIS
<div className="bg-card border border-border">
```

**`src/paginas/igrejas/page.tsx` linhas 188, 204, 270:**
```tsx
// ANTES
<TabsList className="rounded-none border border-border bg-white mb-0 h-10">
<div className="bg-white border border-border border-t-0">
// DEPOIS
<TabsList className="rounded-none border border-border bg-card mb-0 h-10">
<div className="bg-card border border-border border-t-0">
```

**`src/paginas/igrejas/page.tsx` linha 404 (preview de logo):**
```tsx
// ANTES
className="h-16 w-16 rounded-md object-contain border border-border bg-white"
// DEPOIS
className="h-16 w-16 rounded-md object-contain border border-border bg-card"
```

**Buscar no projeto todo por `bg-white` e substituir por `bg-card`:**
```bash
grep -rn "bg-white" src/paginas/ src/components/ --include="*.tsx"
```
Verificar cada resultado e trocar para `bg-card` (exceto elementos intencionalmente brancos como avatares de foto).

---

## Problema 2 — Hover states com cores amber hardcoded

**`src/paginas/membros/page.tsx` linha 174:**
```tsx
// ANTES
<tr key={m.id} className="border-b border-border hover:bg-amber-50/30">
// DEPOIS
<tr key={m.id} className="border-b border-border hover:bg-muted/50">
```

**`src/paginas/convertidos/page.tsx` linha 103:**
```tsx
// ANTES
className="... hover:bg-amber-50/40 ..."
// DEPOIS
className="... hover:bg-muted/50 ..."
```

**Buscar e substituir:**
```bash
grep -rn "hover:bg-amber" src/paginas/ --include="*.tsx"
```

---

## Problema 3 — Botões primários com cores da paleta antiga

Os botões de ação principal (Novo membro, Registrar convertido) ainda usam a paleta antiga âmbar/stone.

**`src/paginas/membros/page.tsx` linha 103:**
```tsx
// ANTES
className="rounded-none bg-stone-900 text-amber-50 hover:bg-amber-800 h-11 px-5 gap-2"
// DEPOIS
className="rounded-none bg-primary text-primary-foreground hover:opacity-90 h-11 px-5 gap-2"
```

**`src/paginas/convertidos/page.tsx` linha 64:**
```tsx
// ANTES
className="rounded-none bg-stone-900 text-amber-50 hover:bg-amber-800 h-12 px-6 gap-3"
// DEPOIS
className="rounded-none bg-primary text-primary-foreground hover:opacity-90 h-12 px-6 gap-3"
```

**Buscar e substituir em todos os arquivos:**
```bash
grep -rn "bg-stone-900.*text-amber-50\|bg-stone-950.*text-amber" src/paginas/ --include="*.tsx"
```

---

## Problema 4 — Badges de status com cores pastel hardcoded

Status de membros usa `bg-amber-50`, `bg-blue-50`, `bg-red-50` — cores claras que ficam inadequadas no dark mode (claro demais sobre fundo escuro).

**`src/paginas/membros/page.tsx` linhas 23–55:**

```tsx
// ANTES
const statusClasses: Record<string, string> = {
  ativo: "bg-amber-50 text-primary border border-amber-200",
  inativo: "bg-muted text-muted-foreground border border-border",
  transferido: "bg-blue-50 text-blue-700 border border-blue-200",
  falecido: "bg-stone-200 text-muted-foreground border border-border",
  excluido: "bg-stone-200 text-muted-foreground border border-border",
};

// Badge "sem contato":
<Badge className="rounded-none bg-red-50 text-red-700 border border-red-200 font-normal">
// Badge "batizado":
<Badge className="rounded-none bg-amber-50 text-primary border border-amber-200 font-normal">

// DEPOIS — usar opacity para funcionar nos dois modos
const statusClasses: Record<string, string> = {
  ativo: "bg-primary/10 text-primary border border-primary/20",
  inativo: "bg-muted text-muted-foreground border border-border",
  transferido: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  falecido: "bg-muted text-muted-foreground border border-border",
  excluido: "bg-muted text-muted-foreground border border-border",
};

// Badge "sem contato":
<Badge className="rounded-none bg-destructive/10 text-destructive border border-destructive/20 font-normal">
// Badge "batizado":
<Badge className="rounded-none bg-primary/10 text-primary border border-primary/20 font-normal">
```

**Verificar se padrão semelhante existe em outros arquivos:**
```bash
grep -rn "bg-amber-50\|bg-blue-50\|bg-red-50\|bg-green-50" src/paginas/ --include="*.tsx"
```

---

## Problema 5 — `text-primary` aplicado em excesso a nomes/dados

A substituição em massa transformou `text-amber-800` em `text-primary`. Porém `text-amber-800` era usado tanto para acento decorativo (correto → `text-primary`) quanto para nomes de registros clicáveis (errado — `text-primary` vira um wine muito saturado que não é ideal para dados).

**Padrão problemático em tabelas** — nomes de membros/convertidos estão usando `text-primary`:

**`src/paginas/membros/page.tsx` linha 179:**
```tsx
// ANTES (resultado do replace em massa)
className="font-serif text-base hover:text-primary"
// DEPOIS — nome fica em foreground, hover vira primary
className="font-serif text-base text-foreground hover:text-primary"
```

**`src/paginas/convertidos/page.tsx`** — verificar onde o nome do convertido está sendo renderizado e garantir que use `text-foreground` por padrão.

**Regra geral:**
- `text-primary` = acento da marca (números decorativos, títulos de seção, iteração "01/02/03", nomes da igreja, embelezamentos tipográficos)
- `text-foreground` = dados (nomes de pessoas, telefones, datas, valores)

---

## Problema 6 — Componentes `src/components/ui/` sem suporte a dark mode

Verificar se os componentes shadcn estão usando variáveis semânticas. Executar:
```bash
grep -rn "bg-white\|text-black\|text-gray\|border-gray\|bg-gray" src/components/ui/ --include="*.tsx"
```

Se encontrar, substituir pelos equivalentes semânticos:
- `bg-white` → `bg-background` ou `bg-card`
- `text-black` / `text-gray-900` → `text-foreground`
- `border-gray-200` → `border-border`
- `bg-gray-100` → `bg-muted`

Os componentes shadcn do Ovile já devem usar variáveis CSS mas confirmar.

---

## Problema 7 — Cores hardcoded inline no Recharts (dashboard)

**`src/paginas/dashboard/page.tsx`** — os gráficos Recharts já foram migrados para `var(--color-*)` mas verificar se ainda há hex hardcoded:

```tsx
// Verificar:
stroke="#78716c"   // deve ser var(--color-muted-foreground)
fill="#b45309"     // deve ser var(--color-primary)
stroke="#faf7f2"   // deve ser var(--color-background)
```

O arquivo foi reescrito nesta sessão — confirmar que os valores usam `var()` corretamente.

**`src/paginas/membros-metricas/page.tsx`** — provavelmente tem cores hardcoded nos charts. Verificar e substituir por `var(--color-chart-1)`, `var(--color-chart-2)`, etc. ou pelos valores `var(--color-primary)`.

---

## Problema 8 — Itens restantes com `text-stone-*` ou `text-amber-*`

Depois das correções acima, rodar novamente para garantir que não ficou nada:
```bash
grep -rn "text-stone-\|text-amber-\|border-stone-\|bg-stone-[0-9]" \
  src/paginas/ src/components/layout/ --include="*.tsx" | grep -v "bg-stone-950\|bg-stone-900" 
```

`bg-stone-950` e `bg-stone-900` podem ser intencionais (fundos escuros pré-dark-mode em componentes legados) — mas idealmente também migrar para `bg-card` ou `bg-sidebar`.

---

## Como testar após as mudanças

1. `cd "frontend v4" && bun dev` (porta 8085)
2. Acessar `http://localhost:8085/login` e logar com `admin@nazareno.com` / `admin123`
3. **Modo claro** — verificar: Dashboard, /convertidos, /membros, /discipulado, /discipuladores, /modulos, /igrejas
4. Clicar no botão Moon (sidebar, canto inferior direito do avatar) para ativar dark mode
5. **Modo escuro** — verificar as mesmas páginas
6. Checklist de qualidade em cada página:
   - [ ] Fundo principal: bone claro (light) ou velvet escuro (dark) — NÃO branco em dark
   - [ ] Texto principal (nomes, dados): legível com bom contraste
   - [ ] Labels secundários: visivelmente mais suaves que o principal, mas ainda legíveis
   - [ ] Bordas de tabela: visíveis mas discretas
   - [ ] Hover de linha: visível mas sutil
   - [ ] Botões primários: velvet com texto bone — bonitos nos dois modos
   - [ ] Badges de status: não brancos em dark mode
   - [ ] Inputs e selects: não brancos em dark mode

## Sugestões opcionais (se quiser ir além)

Se após as correções obrigatórias acima o visual ainda parecer sem personalidade, considerar:

1. **Aumentar `--muted-foreground` no dark mode** — de `oklch(0.62 0.08 349)` para `oklch(0.68 0.07 349)` para melhor legibilidade de textos secundários
2. **Adicionar sutil gradiente no sidebar** — `background: linear-gradient(180deg, oklch(0.15 0.09 349), oklch(0.10 0.07 349))` para profundidade
3. **Gráficos Recharts em dark mode** — adicionar `fill="var(--color-chart-1)"` e cores que realmente variem entre barras
4. **Selects e inputs** — adicionar `focus-visible:ring-primary` para feedback de foco na cor da marca

## Ordem de execução sugerida

1. Corrigir `bg-white` → `bg-card` (impacto mais visual)
2. Corrigir hover states `hover:bg-amber-*` → `hover:bg-muted/50`
3. Corrigir botões primários
4. Corrigir badges de status
5. Revisar `text-primary` em nomes de dados
6. Buscar residuais com os greps indicados
7. Testar ambos os modos em todas as páginas
8. Commitar com mensagem descritiva
