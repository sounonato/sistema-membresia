# TASK-002 - Aplicar branding do tenant no painel autenticado

## Metadados

- Status: `concluída`
- Prioridade: `P1`
- Responsável: `Codex`
- Planejamento: `pessoa`
- Executor: `Codex`
- Revisão excepcional: `não necessária`
- Branch: `chore/TASK-002-branding-painel-authenticado`
- Regras relacionadas: `BR-001`, `BR-002`, `BR-003`

## Contexto

O backend ja devolve `igreja_cor` e `igreja_logo` em `GET /api/auth/me`, mas o painel autenticado ainda precisa consolidar a identidade da igreja em todas as superficies visiveis do usuario logado.

Hoje o shell mistura marca padrao, branding do tenant e variacoes de estilo. Isso quebra a leitura do produto e faz o login parecer de uma igreja e o painel parecer de outra.

## Resultado esperado

Ao concluir esta tarefa, o usuario autenticado ve a cor primaria e o logo da propria igreja no painel, com fallback seguro quando nao houver branding configurado.

## Escopo

- Aplicar `--primary` com a `igreja_cor` do usuario logado dentro do painel autenticado.
- Mostrar o logo da igreja na sidebar quando `igreja_logo` existir.
- Manter fallback para nome/marca padrao quando nao houver logo.
- Garantir que logout e troca de usuario removam a cor aplicada.
- Ajustar o tipo `Usuario` e o contexto de auth se necessario para refletir os campos retornados pela API.

## Fora do escopo

- Reescrever toda a identidade visual do dashboard.
- Refatorar todas as telas operacionais da aplicacao.
- Alterar o backend, exceto se surgir um bug de contrato ja existente.

## Critérios de aceite

- [ ] Dado um usuario com `igreja_cor` e `igreja_logo`, quando ele entra no painel, então a UI autenticada usa a cor da igreja e a sidebar mostra o logo.
- [ ] Dado um usuario sem branding configurado, quando ele entra no painel, então o sistema usa o fallback padrao sem quebrar a navegacao.
- [ ] Quando o usuario faz logout, a variavel visual aplicada no `document.documentElement` e limpa.
- [ ] Estados de carregamento, ausencia de usuario e permissao continuam funcionando como antes.
- [ ] Tipos e docs relevantes permanecem coerentes com o contrato da API.

## Plano técnico

1. Confirmar o fluxo atual de `AuthContext`, `_auth.tsx` e `Sidebar.tsx`.
2. Implementar a aplicacao do branding do tenant e validar o fallback.
3. Revisar tipos e documentacao acoplada ao contrato de auth.

## Arquivos/áreas prováveis

- `frontend v4/src/contexts/AuthContext.tsx`
- `frontend v4/src/routes/_auth.tsx`
- `frontend v4/src/components/layout/Sidebar.tsx`
- `frontend v4/src/lib/api.ts`
- `docs/AI_HANDOFF.md`

## Dependências e riscos

- Dependências: `GET /api/auth/me` e `GET /api/auth/login` precisarem manter `igreja_cor` e `igreja_logo` no contrato
- Riscos: branding aplicado via `document.documentElement` pode vazar entre usuarios se o cleanup nao for correto
- Migração/rollback: nao se aplica

## Plano de validação

- Teste automatizado: nao existe suite especifica ainda
- Verificação manual: login de um tenant com branding, login de um tenant sem branding e logout entre os dois
- Comandos: `cd "frontend v4" && npm run lint`, `cd "frontend v4" && npm run build`

## Registro de execução

- `2026-08-08 00:00` — tarefa criada para consolidar branding do tenant no painel autenticado.
- `2026-08-08 00:00` — backend de login passou a devolver `igreja_cor` e `igreja_logo` junto com o usuario.
- `2026-08-08 00:00` — frontend e backend validados; `npm run build` passou e o `npm run lint` falhou por dívida de formatação preexistente no repo.

## Encerramento

- [ ] Critérios atendidos.
- [ ] Validações executadas e resultados registrados.
- [ ] Handoff atualizado.
- [ ] Documentação consistente com o produto.
- [ ] Pendências separadas em novas tarefas.
