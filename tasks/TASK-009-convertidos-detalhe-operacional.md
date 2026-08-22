# TASK-009 - Simplificar detalhe operacional de convertidos

## Metadados

- Status: `concluída`
- Prioridade: `P1`
- Responsável: `Codex`
- Planejamento: `pessoa`
- Executor: `Codex`
- Revisão excepcional: `não necessária`
- Branch: `chore/TASK-009-convertidos-detalhe-operacional`
- Regras relacionadas: `BR-001`, `BR-002`

## Contexto

O detalhe do convertido concentra dados pessoais, conversão, situação, responsável, promoção para membro e ações destrutivas num layout ainda pesado e pouco objetivo. Depois da listagem, essa é a próxima tela natural para reduzir atrito operacional.

## Resultado esperado

Ao concluir esta tarefa, a página de detalhe do convertido fica mais compacta, com resumo rápido e ações principais fáceis de encontrar sem perder nenhuma função atual.

## Escopo

- Simplificar a composição visual da página de detalhe do convertido.
- Deixar status, responsável e ações principais mais rápidos de escanear.
- Preservar promoção, edição, exclusão, jornada, situação e responsável.
- Manter o comportamento funcional atual.

## Fora do escopo

- Alterar regras de negócio do convertido.
- Mudar contratos de API.
- Reescrever a página de jornada nesta tarefa.

## Critérios de aceite

- [ ] A página de detalhe fica mais direta e operacional.
- [ ] Todas as ações existentes continuam funcionando.
- [ ] `npm run lint` continua sem erros.
- [ ] `npm run build` continua passando.

## Plano técnico

1. Reorganizar o topo da página com resumo, status e ações principais.
2. Compactar os blocos de informação e padronizar os cards.
3. Reexecutar lint e build.

## Arquivos/áreas prováveis

- `frontend v4/src/paginas/convertidos/[id]/page.tsx`
- `frontend v4/src/paginas/convertidos/hooks.ts`

## Dependências e riscos

- Dependências: nenhuma externa
- Riscos: densidade excessiva pode piorar leitura em telas pequenas
- Migração/rollback: nao se aplica

## Plano de validação

- Teste automatizado: `cd "frontend v4" && npm run lint`
- Verificação manual: `cd "frontend v4" && npm run build`

## Registro de execução

- `2026-08-09 00:00` — tarefa criada para simplificar o detalhe operacional de convertidos.
- `2026-08-09 00:00` — detalhe de convertidos reestruturado e validado com `npm run lint` e `npm run build`.

## Encerramento

- [x] Critérios atendidos.
- [x] Validações executadas e resultados registrados.
- [x] Handoff atualizado.
- [x] Documentação consistente com o produto.
- [x] Pendências separadas em novas tarefas.
