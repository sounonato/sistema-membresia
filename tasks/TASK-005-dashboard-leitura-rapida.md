# TASK-005 - Reestruturar dashboard para leitura rapida

## Metadados

- Status: `concluída`
- Prioridade: `P1`
- Responsável: `Codex`
- Planejamento: `pessoa`
- Executor: `Codex`
- Revisão excepcional: `não necessária`
- Branch: `chore/TASK-005-dashboard-leitura-rapida`
- Regras relacionadas: `BR-001`, `BR-002`

## Contexto

O dashboard já funciona, mas ainda lê como uma página editorial. Depois da base visual estabilizada, o próximo passo é transformar essa tela em um painel de leitura rápida, com menos peso visual e mais clareza operacional.

## Resultado esperado

Ao concluir esta tarefa, o dashboard principal e a variação do discipulador ficam mais diretos, com hierarquia mais clara e KPIs/visões principais mais fáceis de escanear.

## Escopo

- Reorganizar o topo do dashboard principal para leitura rápida.
- Simplificar a apresentação dos KPIs e gráficos.
- Ajustar o dashboard do discipulador para ficar consistente com a mesma direção visual.
- Preservar os dados e o comportamento atual.

## Fora do escopo

- Criar novas métricas de backend.
- Mudar regras de negócio dos números exibidos.
- Refatorar outras telas operacionais nesta tarefa.

## Critérios de aceite

- [x] O dashboard fica mais direto e menos editorial.
- [x] O dashboard do discipulador acompanha a mesma base visual.
- [x] `npm run lint` continua sem erros.
- [x] `npm run build` continua passando.

## Plano técnico

1. Reestruturar o `DashboardPage` com uma hierarquia mais compacta.
2. Ajustar o `DashboardDiscipulador` para seguir o mesmo padrão.
3. Reexecutar lint e build.

## Arquivos/áreas prováveis

- `frontend v4/src/paginas/dashboard/page.tsx`
- `frontend v4/src/paginas/dashboard/dashboard-discipulador.tsx`
- `frontend v4/src/paginas/dashboard/hooks.ts`

## Dependências e riscos

- Dependências: nenhuma externa
- Riscos: a mudança visual pode alterar a percepção de densidade no topo da tela
- Migração/rollback: nao se aplica

## Plano de validação

- Teste automatizado: `cd "frontend v4" && npm run lint`
- Verificação manual: `cd "frontend v4" && npm run build`

## Registro de execução

- `2026-08-08 00:00` — tarefa criada para reestruturar o dashboard para leitura rápida.

## Encerramento

- [x] Critérios atendidos.
- [x] Validações executadas e resultados registrados.
- [x] Handoff atualizado.
- [x] Documentação consistente com o produto.
- [x] Pendências separadas em novas tarefas.
