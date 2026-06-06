# Prompt para o Gemini — "A Jornada do Discípulo"

Cole tudo abaixo no chat do Gemini no Antigravity IDE:

---

Você vai aplicar 4 alterações no projeto React em:
`/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia`

Leia o arquivo `JORNADA-PLAN.md` na raiz do projeto antes de começar. Ele tem todos os detalhes de cada mudança.

## Regras obrigatórias

1. Leia cada arquivo ANTES de editar
2. Siga o checklist do JORNADA-PLAN.md na ordem
3. Não mude nada além do que está no plano — não altere lógica, queries, estilos ou outros arquivos
4. Após todos os arquivos, rode: `cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia" && npm run build`
5. Se tiver erro de build, corrija antes de continuar
6. Com build limpo, rode:

```bash
cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia"
git add -A
git commit -m "feat: alinhamento com documento A Jornada do Discípulo — nome, campos e filtros"
git push origin main
vercel --prod --yes
```

7. Me informe o link do Vercel ao final

## Resumo do que fazer

1. **Renomear o sistema** para "A Jornada do Discípulo" em: `index.html`, `Sidebar.tsx`, `Login.tsx`
2. **Novo campo** "Já fez discipulado?" (checkbox) em: `NovoConvertido.tsx`, `FormularioPublico.tsx`, `types/index.ts` e criar `database/migration_002.sql`
3. **Renomear "Observações"** para "Pedido de oração" em: `NovoConvertido.tsx`, `FormularioPublico.tsx`, `ConvertidoDetalhe.tsx`
4. **Ajustar filtros** em `Discipulado.tsx`: Ativos→"Em andamento", Encerrados→"Concluídos", Pausados→"Descontinuado"

Comece lendo o `JORNADA-PLAN.md` agora.
