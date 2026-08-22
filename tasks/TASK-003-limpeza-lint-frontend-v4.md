# TASK-003 - Limpar formatacao e ruido de lint no frontend v4

## Metadados

- Status: `concluída`
- Prioridade: `P1`
- Responsável: `Codex`
- Planejamento: `pessoa`
- Executor: `Codex`
- Revisão excepcional: `não necessária`
- Branch: `chore/TASK-003-limpeza-lint-frontend-v4`
- Regras relacionadas: `BR-001`, `BR-002`

## Contexto

O `frontend v4` passou na build, mas o `npm run lint` ainda falha com centenas de erros de Prettier espalhados pelo repo. Esse ruido esconde qualquer regressao real e dificulta continuar o trabalho com confianca.

## Resultado esperado

Ao concluir esta tarefa, a formatação do `frontend v4` fica limpa o suficiente para o `npm run lint` passar sem erros de Prettier.

## Escopo

- Aplicar a formatacao padrao do projeto no `frontend v4`.
- Corrigir os arquivos que hoje quebram o `lint` por motivo mecanico.
- Preservar o comportamento das telas e rotas existentes.
- Atualizar a documentacao de handoff com o resultado da limpeza.

## Fora do escopo

- Refatorar a arquitetura visual.
- Mudar comportamento funcional das telas.
- Corrigir warnings antigos que nao impedem a validacao desta tarefa.

## Critérios de aceite

- [x] `npm run lint` no `frontend v4` nao retorna erros de Prettier.
- [x] `npm run build` continua passando depois da limpeza.
- [x] Nenhuma mudança funcional foi introduzida apenas por formatação.
- [x] O handoff registra a validação executada e o resultado real.

## Plano técnico

1. Rodar a formatacao padrao do `frontend v4`.
2. Reexecutar lint e build para confirmar que o ruido mecanico foi removido.

## Arquivos/áreas prováveis

- `frontend v4/src/**/*`
- `frontend v4/static-server.cjs`
- `frontend v4/src/lib/**/*`
- `docs/AI_HANDOFF.md`

## Dependências e riscos

- Dependências: nenhuma externa
- Riscos: o diff pode ficar grande porque o repo ja acumulou formatação inconsistente
- Migração/rollback: nao se aplica

## Plano de validação

- Teste automatizado: `cd "frontend v4" && npm run lint`
- Verificação manual: `cd "frontend v4" && npm run build`
- Comandos: `cd "frontend v4" && npm run format`

## Registro de execução

- `2026-08-08 00:00` — tarefa criada para remover o ruido mecanico do `lint`.

## Encerramento

- [x] Critérios atendidos.
- [x] Validações executadas e resultados registrados.
- [x] Handoff atualizado.
- [x] Documentação consistente com o produto.
- [x] Pendências separadas em novas tarefas.
