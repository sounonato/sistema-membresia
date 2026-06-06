# Prompt para o Gemini — Segurança Backend

Cole tudo abaixo no chat do Gemini no Antigravity IDE:

---

Você vai implementar segurança backend no projeto React em:
`/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia`

Leia o arquivo `SECURITY-PLAN.md` na raiz do projeto ANTES de começar. Ele tem todo o código pronto.

## O que fazer

1. **Criar 4 Edge Functions** do Supabase em `supabase/functions/`:
   - `verify-session/index.ts`
   - `create-convertido/index.ts`
   - `public-form/index.ts`
   - `dashboard-stats/index.ts`
   O código completo de cada uma está no SECURITY-PLAN.md.

2. **Criar `database/migration_003_rls.sql`** com o SQL de hardening de RLS do SECURITY-PLAN.md.

3. **Criar `src/lib/api.ts`** com o código do SECURITY-PLAN.md.

4. **Atualizar 3 páginas do frontend** para usar `src/lib/api.ts`:
   - `src/pages/DashboardLider.tsx` → usar `getDashboardStats()`
   - `src/pages/NovoConvertido.tsx` → usar `createConvertido()`
   - `src/pages/FormularioPublico.tsx` → usar `submitFormularioPublico()`

## Regras obrigatórias

- Leia cada arquivo antes de editar
- Não mude nada além do que está no plano
- Não altere estilos, lógica de outros componentes ou arquivos não listados
- Após as edições, rode: `cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia" && npm run build`
- Corrija qualquer erro de build antes de continuar
- Com build limpo, faça o deploy das Edge Functions:

```bash
cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia"
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase functions deploy verify-session
npx supabase functions deploy create-convertido
npx supabase functions deploy public-form
npx supabase functions deploy dashboard-stats
```

- Depois commit e deploy do frontend:

```bash
git add -A
git commit -m "feat(security): autenticação e operações sensíveis movidas para Edge Functions"
git push origin main
vercel --prod --yes
```

## Atenção

- O `PROJECT_REF` do Supabase está no dashboard do Supabase em Settings > General
- As variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já estão disponíveis automaticamente dentro das Edge Functions — não precisa configurar `.env` para elas
- Após o deploy, informe o link do Vercel e confirme quais Edge Functions foram deployadas

Comece lendo o `SECURITY-PLAN.md` agora.
