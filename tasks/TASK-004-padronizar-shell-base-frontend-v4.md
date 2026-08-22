# TASK-004 - Padronizar shell e base visual do frontend v4

## Metadados

- Status: `concluída`
- Prioridade: `P1`
- Responsável: `Codex`
- Planejamento: `pessoa`
- Executor: `Codex`
- Revisão excepcional: `não necessária`
- Branch: `chore/TASK-004-padronizar-shell-base-frontend-v4`
- Regras relacionadas: `BR-001`, `BR-002`

## Contexto

O `frontend v4` já tem branding por tenant e o lint mecanico foi limpo. Agora o shell ainda mistura tokens semanticos com cores hardcoded, o que deixa a base visual menos consistente do que deveria.

## Resultado esperado

Ao concluir esta tarefa, `AppShell`, `Sidebar` e `PageHeader` passam a usar tokens semanticos mais consistentes, com menos valores soltos e uma base visual mais calma para o resto das telas.

## Escopo

- Centralizar tokens de shell/base visual em `src/styles.css`.
- Remover cores hardcoded soltas dos componentes de layout base.
- Ajustar `AppShell`, `Sidebar` e `PageHeader` para usar a nova base.
- Preservar o comportamento de navegação, autenticação e branding por tenant.

## Fora do escopo

- Refatorar todas as telas operacionais de uma vez.
- Mudar a arquitetura do roteamento.
- Reescrever conteúdo ou fluxo funcional.

## Critérios de aceite

- [x] O shell visual usa tokens semanticos em vez de valores espalhados.
- [x] `npm run lint` continua sem erros.
- [x] `npm run build` continua passando.
- [x] O comportamento atual de login, sidebar e header continua igual.

## Plano técnico

1. Adicionar tokens semanticos de shell em `src/styles.css`.
2. Atualizar `AppShell`, `Sidebar` e `PageHeader` para consumir os tokens.
3. Reexecutar lint e build.

## Arquivos/áreas prováveis

- `frontend v4/src/styles.css`
- `frontend v4/src/components/layout/AppShell.tsx`
- `frontend v4/src/components/layout/Sidebar.tsx`
- `frontend v4/src/components/layout/PageHeader.tsx`

## Dependências e riscos

- Dependências: nenhuma externa
- Riscos: pequenos ajustes visuais podem alterar a hierarquia percebida em mobile
- Migração/rollback: nao se aplica

## Plano de validação

- Teste automatizado: `cd "frontend v4" && npm run lint`
- Verificação manual: `cd "frontend v4" && npm run build`

## Registro de execução

- `2026-08-08 00:00` — tarefa criada para padronizar o shell e a base visual do frontend v4.

## Encerramento

- [x] Critérios atendidos.
- [x] Validações executadas e resultados registrados.
- [x] Handoff atualizado.
- [x] Documentação consistente com o produto.
- [x] Pendências separadas em novas tarefas.
