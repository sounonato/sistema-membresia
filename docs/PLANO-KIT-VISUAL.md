# Plano - Refinamento Visual Baseado no Kit

## Contexto

Este plano consolida o kit ja definido em:

- [docs/BRANDING-PLAN.md](/Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/docs/BRANDING-PLAN.md)
- [docs/GEMINI-BRANDING-APLICAR.md](/Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/docs/GEMINI-BRANDING-APLICAR.md)
- [docs/GEMINI-DESIGN-REFINAMENTO.md](/Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/docs/GEMINI-DESIGN-REFINAMENTO.md)

O objetivo e sair da mistura atual de linguagens visuais e chegar em uma interface unica, operacional e consistente com a identidade da igreja.

## Objetivo

Transformar o frontend v4 em um SaaS pastoral com:

- branding por igreja aplicado dentro e fora do painel
- shell visual coerente e reutilizavel
- telas operacionais mais densas e legiveis
- menos estilo editorial, mais legibilidade e fluxo de trabalho

## Principios

1. Uma unica direcao visual por vez.
2. Tokens semanticos primeiro, cores hardcoded depois de eliminadas.
3. Serifa so onde acrescenta marca; corpo e operacao em sans.
4. Componentes compactos, com menos arredondamento e menos enfeite.
5. Tela de trabalho deve priorizar escaneabilidade, nao impacto estetico.

## Fase 1 - Fechar o sistema de identidade

### Entregas

- aplicar `--primary` por tenant dentro do painel autenticado
- mostrar logo da igreja na sidebar quando existir
- manter fallback com nome da igreja e marca padrao
- garantir que o login global e as rotas publicas respeitem o branding do tenant

### Arquivos provaveis

- `frontend v4/src/routes/_auth.tsx`
- `frontend v4/src/components/layout/Sidebar.tsx`
- `frontend v4/src/contexts/AuthContext.tsx`
- `frontend v4/src/lib/api.ts`
- `backend/src/rotas/autenticacao.js`

### Aceite

- uma igreja com cor propria nao herda mais a cor padrao do sistema
- sidebar e login deixam de parecer marcas diferentes
- logout e troca de tenant limpam corretamente a cor aplicada

## Fase 2 - Padronizar tokens e superficie base

### Entregas

- remover `bg-white`, `text-stone-*`, `amber-*` e outros hardcodes espalhados
- consolidar cores em `src/styles.css`
- reduzir dependencia de `rounded-2xl` e `rounded-xl`
- ajustar PageHeader, AppShell e Sidebar para a nova base

### Arquivos provaveis

- `frontend v4/src/styles.css`
- `frontend v4/src/components/layout/AppShell.tsx`
- `frontend v4/src/components/layout/PageHeader.tsx`
- `frontend v4/src/components/layout/Sidebar.tsx`

### Aceite

- cores e fundos seguem tokens, nao valores soltos
- cabecalhos e navegacao ficam visivelmente mais quietos
- shell parece parte de um sistema operacional, nao de uma landing page

## Fase 3 - Refatorar telas de trabalho

### Entregas

- redesenhar dashboard para leitura rapida
- simplificar listagens e tabelas
- padronizar botoes primarios, filtros e badges
- remover linguagem editorial de telas operacionais

### Prioridade de telas

1. Dashboard
2. Membros
3. Convertidos
4. Discipulado
5. Discipuladores
6. Modulos
7. Relatorios

### Aceite

- o usuario entende a tela em poucos segundos
- a densidade de informacao melhora sem virar bagunca
- a tipografia decorativa nao atrapalha dados

## Fase 4 - Corrigir experiencias publicas

### Entregas

- alinhar landing, login e cadastro publico com a identidade final
- trocar blocos muito pesados por composicao mais limpa
- garantir que as imagens e a hierarquia visual sustentem a entrada do produto

### Arquivos provaveis

- `frontend v4/src/paginas/landing-saas/page.tsx`
- `frontend v4/src/paginas/login-global/page.tsx`
- `frontend v4/src/paginas/cadastro-publico/page.tsx`
- `frontend v4/src/paginas/cadastro-igreja/page.tsx`

### Aceite

- a primeira impressao bate com o produto real
- a entrada publica parece do mesmo sistema que o painel
- formularios continuam claros em mobile

## Fase 5 - Verificacao e limpeza

### Entregas

- revisar busca global por classes hardcoded antigas
- validar contraste e estados de hover/focus
- conferir responsividade em desktop e mobile
- ajustar qualquer artefato restante de migrações visuais anteriores

### Checklist final

- login com tenant diferente do padrao
- sidebar com logo e fallback corretos
- dashboard sem excesso de serifas e tracking
- listagens com fundos e badges sem ruptura no dark mode
- landing coerente com a identidade final

## Ordem recomendada

1. identidade por tenant
2. tokens e shell
3. telas operacionais
4. experiencias publicas
5. verificacao final

## Resultado esperado

Ao fim desse plano, o sistema deve parecer um produto unico, calmo e profissional, com branding por igreja funcionando sem quebrar a experiencia de uso.
