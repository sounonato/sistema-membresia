# Sistema Membresia — Redesign "Warm Ministry"

**Estratégia:** Claude (planejamento) → Gemini/Antigravity (execução de código)
**Status:** Aguardando execução pelo Gemini
**Email de referência:** sou.nonato@live.com

---

## Visão do novo design

O sistema atual parece um SaaS genérico com roxo padrão do Tailwind.
O novo design deve ter identidade própria: **editorial cristã, acolhedora, premium**.
Inspiração: publicações religiosas modernas, apps como YouVersion Bible, 24/7 Prayer.

---

## Sistema de Design — Token Map

### Paleta de cores (substituir `primary-*` por `warm-*`)

```
Cor de fundo geral:     #F9F6F1  (creme quente)
Superfície (cards):     #FFFFFF
Borda padrão:           #E8E2D9  (stone-200 quente)
Texto principal:        #1C1917  (stone-900)
Texto secundário:       #78716C  (stone-500)
Texto terciário:        #A8A29E  (stone-400)

Primária (accent):      #B45309  (amber-700)   ← botões, links ativos
Primária hover:         #92400E  (amber-800)
Primária claro:         #FEF3C7  (amber-50)    ← backgrounds ativos
Primária borda:         #FCD34D  (amber-300)

Sucesso:                #065F46  (emerald-800)
Sucesso claro:          #D1FAE5  (emerald-100)
Alerta:                 #92400E  (amber-800)
Alerta claro:           #FEF3C7  (amber-50)
Erro:                   #991B1B  (red-800)
Erro claro:             #FEE2E2  (red-100)
```

### Tipografia

```
Títulos (h1, h2):    font-serif → "Lora" (Google Fonts, importar no index.css)
Corpo / UI:          font-sans  → "Inter" (já instalado)

Escala de tamanhos (simplificada para 4):
  text-xs   → metadados, labels secundários
  text-sm   → corpo principal, labels de form
  text-xl   → seção headers (substituir text-lg e text-base)
  text-3xl  → page headings (substituir text-2xl)

Pesos:
  font-normal   → corpo
  font-semibold → nomes, títulos de card
  font-bold     → page headings (h1 apenas)
```

### Bordas e sombras

```
Border radius:
  Botões, inputs, badges:  rounded-xl  (12px)
  Cards:                   rounded-2xl (16px)
  Avatares, KPI icons:     rounded-2xl

Sombras:
  Card padrão:   shadow: 0 1px 4px rgba(28,25,23,0.06)
  Card hover:    shadow: 0 4px 16px rgba(28,25,23,0.10)
  Sem shadow-lg, sem shadow-md — usar apenas sm e custom
```

---

## Arquivos a modificar

### 1. `tailwind.config.js` — novo tema
- Adicionar família `serif: ['Lora', 'Georgia', 'serif']`
- Substituir extensão de cor `primary` por `warm` com a paleta acima
- Manter `gray` e `stone` para texto/bordas

### 2. `src/index.css` — importar fonte e variáveis
- Adicionar `@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap')`
- Remover qualquer CSS específico do tema roxo

### 3. `src/components/layout/Sidebar.tsx`
- Background: `bg-stone-50 border-r border-stone-200`
- Logo: ícone Church em `bg-warm-700` (amber-700), nome "Membresia" em `font-serif font-bold`
- Nav itens ativos: `bg-amber-50 text-amber-800 font-semibold` com borda-esquerda `border-l-2 border-amber-600`
- Nav itens inativos: `text-stone-600 hover:bg-stone-100`
- User footer: avatar com inicial, nome, perfil em stone-400, LogOut em stone-400 hover:text-red-600

### 4. `src/components/layout/BottomNav.tsx`
- Background: `bg-white border-t border-stone-200`
- Ativo: `text-amber-700`
- Inativo: `text-stone-400`
- Texto: `text-[10px]`

### 5. `src/components/ui/card.tsx`
- `Card`: `bg-white rounded-2xl border border-stone-200` + custom shadow
- `StatCard`: remover o esquema de cores por ícone colorido. Novo visual:
  - Card branco com borda stone
  - Valor em `text-3xl font-bold text-stone-900`
  - Título em `text-xs font-medium text-stone-500 uppercase tracking-wide`
  - Ícone pequeno em `text-amber-600` sem background colorido

### 6. `src/components/ui/button.tsx`
- `primary` (default): `bg-amber-700 hover:bg-amber-800 text-white rounded-xl`
- `outline`: `border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl`
- `secondary`: `bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl`
- `ghost`: `text-stone-600 hover:bg-stone-100 rounded-xl`
- Remover variante azul/roxo

### 7. `src/components/ui/badge.tsx`
- Remover cores purple/blue como padrão
- `default`: `bg-stone-100 text-stone-700`
- `success`: `bg-emerald-50 text-emerald-800 border border-emerald-200`
- `warning`: `bg-amber-50 text-amber-800 border border-amber-200`
- `error`: `bg-red-50 text-red-700 border border-red-200`
- `info`: `bg-blue-50 text-blue-700 border border-blue-200`

### 8. `src/components/ui/input.tsx`
- Border: `border-stone-300 focus:border-amber-500 focus:ring-amber-500/20`
- Label: `text-stone-700 font-medium`
- Placeholder: `text-stone-400`
- Rounded: `rounded-xl`

### 9. `src/components/ui/select.tsx`
- Mesmas classes que input acima

### 10. `src/components/ui/avatar.tsx`
- Cores de fundo: usar tons de amber/stone/warm em vez das 8 cores atuais
- `rounded-2xl` em vez de `rounded-full` para um visual mais moderno

### 11. `src/pages/Login.tsx`
- Fundo: gradiente sutil `from-amber-50 via-stone-50 to-white`
- Card central: `bg-white rounded-2xl shadow-lg border border-stone-100 p-8`
- Logo: ícone Church em amber-700 com background amber-50 rounded-2xl
- Título: `font-serif text-3xl text-stone-900`
- Subtítulo: `text-stone-500 text-sm`
- Botão: amber-700

### 12. `src/pages/DashboardLider.tsx`
- H1 heading: `font-serif text-3xl font-bold text-stone-900`
- Subtítulo: `text-stone-500`
- KPI grid: 4 StatCards com novo estilo (ver card.tsx acima)
- Seção "Análises": título `font-serif text-xl text-stone-800`
- Seção "Últimos Convertidos": mesmo estilo

### 13. `src/pages/DashboardDiscipulador.tsx`
- Mesmo padrão de heading `font-serif`
- KPI cards estilo novo
- Cards de grupo: `rounded-2xl border-stone-200`
- Botão "+ Contato": outline amber

### 14. `src/pages/Convertidos.tsx`
- Header: `font-serif text-3xl`
- Barra de busca: input com novo estilo
- Lista: substituir `hover:bg-gray-50` por `hover:bg-stone-50`

### 15. `src/pages/Login.tsx`
- Já descrito acima

### 16. `src/pages/FormularioPublico.tsx`
- Header: Church icon em amber-700 sobre amber-50
- Título: `font-serif text-3xl`
- Cards de seção: `rounded-2xl`
- Botão submit: amber-700 full width

### 17. Todas as demais páginas
- Substituir `text-gray-*` → `text-stone-*`
- Substituir `bg-gray-*` → `bg-stone-*`
- Substituir `border-gray-*` → `border-stone-*`
- Substituir `primary-*` → `warm-*` / `amber-*`
- H1 com `font-serif` em todas as páginas
- Botões: rounded-xl, amber-700

---

## Gráficos (Recharts)

Criar arquivo `src/lib/chartColors.ts`:

```ts
export const CHART_COLORS = {
  primary:    '#B45309', // amber-700
  secondary:  '#D97706', // amber-600
  tertiary:   '#F59E0B', // amber-500
  quaternary: '#065F46', // emerald-800
  muted:      '#78716C', // stone-500
  light:      '#FCD34D', // amber-300
}

export const CHART_SERIES = ['#B45309', '#D97706', '#F59E0B', '#065F46', '#0F766E', '#78716C']
```

Atualizar os 3 componentes de gráfico para usar estas constantes.
Tooltip style: `borderRadius: 12, border: '1px solid #E8E2D9', fontSize: 13, color: '#1C1917'`

---

## Checklist de execução para o Gemini

- [ ] Instalar fonte Lora via Google Fonts no index.css
- [ ] Atualizar tailwind.config.js
- [ ] Atualizar ui/card.tsx
- [ ] Atualizar ui/button.tsx
- [ ] Atualizar ui/badge.tsx
- [ ] Atualizar ui/input.tsx
- [ ] Atualizar ui/select.tsx
- [ ] Atualizar ui/avatar.tsx
- [ ] Atualizar layout/Sidebar.tsx
- [ ] Atualizar layout/BottomNav.tsx
- [ ] Atualizar pages/Login.tsx
- [ ] Atualizar pages/DashboardLider.tsx
- [ ] Atualizar pages/DashboardDiscipulador.tsx
- [ ] Atualizar pages/Convertidos.tsx
- [ ] Atualizar pages/ConvertidoDetalhe.tsx
- [ ] Atualizar pages/NovoConvertido.tsx
- [ ] Atualizar pages/FormularioPublico.tsx
- [ ] Atualizar pages/Discipulado.tsx
- [ ] Atualizar pages/GrupoDetalhe.tsx
- [ ] Atualizar pages/Discipuladores.tsx
- [ ] Atualizar pages/Modulos.tsx
- [ ] Criar src/lib/chartColors.ts
- [ ] Atualizar os 3 componentes de gráfico
- [ ] npm run build (zero erros)
- [ ] git add + commit + push + vercel --prod --yes
