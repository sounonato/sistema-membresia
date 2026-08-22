# TASK-006 - Simplificar listagem operacional de membros

## Metadados

- Status: `concluída`
- Prioridade: `P1`
- Responsável: `Codex`
- Planejamento: `pessoa`
- Executor: `Codex`
- Revisão excepcional: `não necessária`
- Branch: `chore/TASK-006-membros-listagem-operacional`
- Regras relacionadas: `BR-001`, `BR-002`

## Contexto

A tela de membros já funciona, mas ainda mistura leitura, filtro e ação com uma linguagem visual mais pesada do que o restante da base. Depois da estabilização do shell e do dashboard, este é o próximo ponto natural para reduzir atrito operacional.

## Resultado esperado

Ao concluir esta tarefa, a listagem de membros fica mais direta, com filtros e ações mais claros, pronta para uso diário sem depender de leitura longa.

## Escopo

- Simplificar a composição visual da listagem de membros.
- Tornar filtros e ações mais rápidos de escanear.
- Preservar paginação, busca e exclusão.
- Manter o comportamento funcional atual.

## Fora do escopo

- Reescrever a página de detalhe do membro nesta tarefa.
- Alterar regras de filtros ou paginação.
- Mudar o contrato da API.

## Critérios de aceite

- [x] A listagem de membros fica mais legível e operacional.
- [x] Busca, filtros e paginação continuam funcionando.
- [x] `npm run lint` continua sem erros.
- [x] `npm run build` continua passando.

## Plano técnico

1. Reorganizar o topo da página com filtros e ações mais compactos.
2. Ajustar a tabela para leitura mais rápida.
3. Reexecutar lint e build.

## Arquivos/áreas prováveis

- `frontend v4/src/paginas/membros/page.tsx`
- `frontend v4/src/paginas/membros/hooks.ts`
- `frontend v4/src/components/layout/PageHeader.tsx`

## Dependências e riscos

- Dependências: nenhuma externa
- Riscos: alterações de densidade podem afetar a leitura em telas pequenas
- Migração/rollback: nao se aplica

## Plano de validação

- Teste automatizado: `cd "frontend v4" && npm run lint`
- Verificação manual: `cd "frontend v4" && npm run build`

## Registro de execução

- `2026-08-09 00:00` — tarefa criada para simplificar a listagem operacional de membros.

## Encerramento

- [x] Critérios atendidos.
- [x] Validações executadas e resultados registrados.
- [x] Handoff atualizado.
- [x] Documentação consistente com o produto.
- [x] Pendências separadas em novas tarefas.
