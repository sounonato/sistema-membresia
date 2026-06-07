# Prompt para o Gemini — Tela de Gerenciamento de Usuários/Logins

Cole tudo abaixo no chat do Gemini no Antigravity IDE:

---

Você vai implementar a tela de criação de logins no projeto React em:
`/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia`

Leia o arquivo `LOGIN-PLAN.md` na raiz do projeto ANTES de começar. Ele tem todo o código pronto.

## O que fazer

1. **Criar Edge Function** `supabase/functions/create-user/index.ts`
   O código completo está no LOGIN-PLAN.md (Fase 1).

2. **Atualizar `src/lib/api.ts`** — adicionar a função `createUser()` ao final do arquivo
   O código está no LOGIN-PLAN.md (Fase 2).

3. **Criar `src/pages/GerenciarUsuarios.tsx`** — nova página completa
   O código está no LOGIN-PLAN.md (Fase 3).

4. **Atualizar `src/App.tsx`** — adicionar rota `/usuarios`
   - Importar: `import GerenciarUsuarios from '@/pages/GerenciarUsuarios'`
   - Adicionar dentro de `<Routes>`: `<Route path="/usuarios" element={<LiderRoute><GerenciarUsuarios /></LiderRoute>} />`

5. **Atualizar `src/components/layout/Sidebar.tsx`** — adicionar item de nav
   - Importar `KeyRound` do lucide-react (junto dos outros ícones)
   - Adicionar ao array `NAV_LIDER` (ou array equivalente que contém as rotas do líder):
   ```ts
   { to: '/usuarios', icon: KeyRound, label: 'Usuários' },
   ```

6. **Atualizar `src/components/layout/BottomNav.tsx`** — adicionar item de nav
   - Importar `KeyRound` do lucide-react
   - Adicionar ao array equivalente:
   ```ts
   { to: '/usuarios', icon: KeyRound, label: 'Usuários' },
   ```

## Regras obrigatórias

- Leia cada arquivo antes de editar
- Não mude nada além do que está no plano
- Não altere estilos, lógica de outros componentes ou arquivos não listados
- Após as edições, rode:
  ```bash
  cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia" && npm run build
  ```
- Corrija qualquer erro de TypeScript antes de continuar
- Com build limpo, faça o deploy da Edge Function:
  ```bash
  cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia"
  npx supabase functions deploy create-user
  ```
- Depois commit e deploy do frontend:
  ```bash
  git add -A
  git commit -m "feat: tela de gerenciamento de usuários e criação de logins"
  git push origin main
  vercel --prod --yes
  ```

## Atenção

- O arquivo `supabase/functions/create-user/index.ts` é um arquivo NOVO — crie-o do zero
- O `src/lib/api.ts` já existe — apenas adicione `createUser()` ao FINAL do arquivo sem remover nada
- O `src/pages/GerenciarUsuarios.tsx` é um arquivo NOVO — crie-o do zero
- Nos arquivos `Sidebar.tsx` e `BottomNav.tsx`, apenas ADICIONE o novo item à navegação do líder, sem alterar os outros itens
- Confirme ao final quais arquivos foram criados/modificados e o link do Vercel

Comece lendo o `LOGIN-PLAN.md` agora.
