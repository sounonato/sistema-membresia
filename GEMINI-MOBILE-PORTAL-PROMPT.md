# Prompt para o Gemini — Menu Mobile Lateral + Portal do Convertido

Cole tudo abaixo no chat do Gemini no Antigravity IDE:

---

Você vai implementar duas melhorias no projeto React em:
`/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia`

Leia o arquivo `MOBILE-PORTAL-PLAN.md` na raiz do projeto ANTES de começar. Ele tem todo o código.

## Parte 1 — Menu mobile lateral (Drawer)

Substituir o BottomNav por um drawer lateral que abre com um botão hamburguer no topo.

### Arquivos a modificar:

**`src/components/layout/AppShell.tsx`** — adicionar estado `drawerOpen` e lógica de overlay

**`src/components/layout/Sidebar.tsx`** — transformar em drawer no mobile com `translate-x` animado

**`src/components/layout/BottomNav.tsx`** — DELETAR o arquivo (não é mais necessário)

**`src/App.tsx`** — REMOVER import de BottomNav se existir

O código completo está no MOBILE-PORTAL-PLAN.md (Parte 1).

## Parte 2 — Portal do Convertido

Uma página pública onde o convertido acessa com seu e-mail e vê:
- Progresso nas aulas do seu grupo de discipulado
- Quais aulas já foram realizadas (pode rever)
- Próximas aulas (bloqueadas até serem feitas)
- Nome do discipulador

### Arquivos a criar:

**`src/pages/PortalConvertido.tsx`** — página de login + dashboard do convertido

### Arquivos a modificar:

**`src/App.tsx`** — adicionar rota `/portal` pública (sem PrivateRoute)

O código completo está no MOBILE-PORTAL-PLAN.md (Parte 2).

## Regras obrigatórias

- Leia cada arquivo antes de editar
- Não mude nada além do que está no plano
- Rode ao final: `cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia" && npm run build`
- Corrija qualquer erro TypeScript antes de continuar
- Com build limpo, commit e deploy:

```bash
git add -A
git commit -m "feat: menu mobile lateral (drawer) + portal do convertido"
git push origin main
npx vercel --prod --yes
```

Comece lendo o `MOBILE-PORTAL-PLAN.md` agora.
