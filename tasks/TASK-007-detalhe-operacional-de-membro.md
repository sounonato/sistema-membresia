# TASK-007 - Simplificar detalhe operacional de membro

## Metadados

- Status: `concluída`
- Prioridade: `P1`
- Responsável: `Codex`
- Planejamento: `pessoa`
- Executor: `Codex`
- Revisão excepcional: `não necessária`
- Branch: `chore/TASK-007-detalhe-operacional-de-membro`
- Regras relacionadas: `BR-001`, `BR-002`

## Contexto

A página de detalhe do membro concentra contato, vínculo pastoral, acesso, ministérios, cargos, família e transferência num layout ainda muito pesado. Depois da listagem operacional, a próxima melhoria natural é deixar essa visão mais direta para uso diário.

## Resultado esperado

Ao concluir esta tarefa, a página de detalhe do membro fica mais compacta e legível, com hierarquia clara e ações principais fáceis de localizar sem perder nenhuma funcionalidade atual.

## Escopo

- Simplificar a composição visual da página de detalhe do membro.
- Deixar contato, status e ações principais mais rápidos de escanear.
- Preservar edição, WhatsApp, acesso, ministérios, cargos, família e transferência.
- Manter o comportamento funcional atual.

## Fora do escopo

- Mudar regras de negócio do membro.
- Alterar contratos de API.
- Reescrever outras telas operacionais nesta tarefa.

## Critérios de aceite

- [ ] A página de detalhe fica mais direta e operacional.
- [ ] Todas as ações existentes continuam funcionando.
- [ ] `npm run lint` continua sem erros.
- [ ] `npm run build` continua passando.

## Plano técnico

1. Reorganizar o topo da página com resumo, status e ações principais.
2. Compactar os blocos de informação e padronizar a leitura dos tabs.
3. Reexecutar lint e build.

## Arquivos/áreas prováveis

- `frontend v4/src/paginas/membros/[id]/page.tsx`
- `frontend v4/src/paginas/membros/hooks.ts`
- `frontend v4/src/lib/api.ts`

## Dependências e riscos

- Dependências: nenhuma externa
- Riscos: densidade visual pode piorar leitura em telas pequenas se o topo ficar apertado demais
- Migração/rollback: nao se aplica

## Plano de validação

- Teste automatizado: `cd "frontend v4" && npm run lint`
- Verificação manual: `cd "frontend v4" && npm run build`

## Registro de execução

- `2026-08-09 00:00` — tarefa criada para simplificar o detalhe operacional de membro.
- `2026-08-09 00:00` — tela reestruturada e validada com lint e build.

## Encerramento

- [x] Critérios atendidos.
- [x] Validações executadas e resultados registrados.
- [x] Handoff atualizado.
- [x] Documentação consistente com o produto.
- [x] Pendências separadas em novas tarefas.
