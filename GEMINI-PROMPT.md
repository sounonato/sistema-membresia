# Prompt pronto para colar no Gemini (Antigravity IDE)

Cole tudo abaixo no chat do Gemini:

---

Você vai executar um redesign visual completo do projeto React em:
`/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia`

Leia o arquivo `DESIGN-PLAN.md` na raiz do projeto. Ele contém o sistema de design completo (paleta, tipografia, componentes, páginas). Siga o DESIGN-PLAN.md à risca.

## Regras de execução

1. Leia CADA arquivo antes de editar — nunca edite sem ler primeiro
2. Execute o checklist completo do DESIGN-PLAN.md, item por item
3. Após terminar todos os arquivos, rode: `cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia" && npm run build`
4. Se houver erro de build, corrija antes de continuar
5. Quando o build passar sem erros, rode:
```bash
cd "/Users/andersonnonato/Documents/CLAUDE CODE/sistema-membresia"
git add -A
git commit -m "feat(design): redesign completo — Warm Ministry (serif + amber + cream)"
git push origin main
vercel --prod --yes
```
6. Reporte o URL do Vercel no final

## O que NÃO mudar

- Lógica de negócio (queries Supabase, mutations, autenticação)
- Estrutura de arquivos e imports
- Nomes de funções e variáveis
- Tipos TypeScript

## Foco exclusivo em

- Classes Tailwind CSS
- Cores e tokens visuais
- Tipografia (adicionar font-serif nos headings)
- Bordas, sombras, espaçamentos
- Adicionar import da fonte Lora no index.css

Comece lendo o DESIGN-PLAN.md e depois siga o checklist.
