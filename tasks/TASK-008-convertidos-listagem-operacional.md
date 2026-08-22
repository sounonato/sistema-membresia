# TASK-008 - Simplificar listagem operacional de convertidos

## Metadados

- Status: `concluída`
- Prioridade: `P1`
- Responsável: `Codex`
- Planejamento: `pessoa`
- Executor: `Codex`
- Revisão excepcional: `não necessária`
- Branch: `chore/TASK-008-convertidos-listagem-operacional`
- Regras relacionadas: `BR-001`, `BR-002`

## Contexto

A listagem de convertidos ainda lê como uma página editorial, com busca solta, tipografia pesada e ações pouco objetivas. Depois de membros, este é o próximo ponto natural para reduzir atrito no uso diário.

## Resultado esperado

Ao concluir esta tarefa, a listagem de convertidos fica mais direta, com leitura rápida, busca clara e ações principais fáceis de escanear sem perder o comportamento atual.

## Escopo

- Simplificar a composição visual da listagem de convertidos.
- Tornar busca e ações mais rápidas de escanear.
- Preservar navegação, edição e exclusão.
- Manter o comportamento funcional atual.

## Fora do escopo

- Reescrever a página de detalhe do convertido nesta tarefa.
- Alterar regras de negócio ou de ordenação.
- Mudar o contrato da API.

## Critérios de aceite

- [ ] A listagem de convertidos fica mais legível e operacional.
- [ ] Busca, paginação e ações continuam funcionando.
- [ ] `npm run lint` continua sem erros.
- [ ] `npm run build` continua passando.

## Plano técnico

1. Reorganizar o topo da página com métricas e busca mais compactas.
2. Ajustar a tabela/lista para leitura mais rápida.
3. Reexecutar lint e build.

## Arquivos/áreas prováveis

- `frontend v4/src/paginas/convertidos/page.tsx`
- `frontend v4/src/paginas/convertidos/hooks.ts`

## Dependências e riscos

- Dependências: nenhuma externa
- Riscos: reduzir demais a densidade pode prejudicar a varredura em telas pequenas
- Migração/rollback: nao se aplica

## Plano de validação

- Teste automatizado: `cd "frontend v4" && npm run lint`
- Verificação manual: `cd "frontend v4" && npm run build`

## Registro de execução

- `2026-08-09 00:00` — tarefa criada para simplificar a listagem operacional de convertidos.
- `2026-08-09 00:00` — listagem reestruturada e validada com lint e build.

## Encerramento

- [x] Critérios atendidos.
- [x] Validações executadas e resultados registrados.
- [x] Handoff atualizado.
- [x] Documentação consistente com o produto.
- [x] Pendências separadas em novas tarefas.
