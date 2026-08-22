# TASK-001 — Inicializar contexto e primeira tarefa

## Metadados

- Status: `concluída`
- Prioridade: `P0`
- Responsável: `pessoa + Codex`
- Planejamento: `pessoa`
- Executor: `Codex`
- Revisão excepcional: `não necessária`
- Branch: `chore/TASK-001-inicializar-contexto`
- Regras relacionadas: `BR-001`

## Contexto

O projeto `sistema-membresia` recebeu o workflow multiagente, mas ainda precisa registrar produto, público, problema, stack, regras essenciais e primeiro incremento implementável.

## Resultado esperado

Ao concluir esta tarefa, os documentos centrais descrevem um MVP ou próxima entrega implementável, e existe uma `TASK-002` pronta para execução.

## Escopo

- Definir o produto ou contexto atual em `docs/ARCHITECTURE.md`.
- Registrar regras de negócio iniciais em `docs/BUSINESS_RULES.md`.
- Atualizar objetivo, métrica e prioridades em `docs/ROADMAP.md`.
- Registrar estado e próximo passo em `docs/AI_HANDOFF.md`.
- Criar `TASK-002` para implementação do primeiro incremento.

## Fora do escopo

- Implementar código de produto.
- Configurar deploy, pagamentos ou integrações externas.
- Tomar decisões irreversíveis sobre dados sensíveis sem confirmação humana.

## Critérios de aceite

- [ ] `docs/ARCHITECTURE.md` descreve produto/contexto, stack e comandos de validação.
- [ ] `docs/BUSINESS_RULES.md` contém papéis, permissões e regras verificáveis.
- [ ] `docs/ROADMAP.md` define objetivo atual, métrica, não objetivos e próxima entrega.
- [ ] `docs/AI_HANDOFF.md` aponta para a tarefa ativa e registra decisões/suposições.
- [ ] `tasks/TASK-002-*.md` existe com resultado esperado, escopo e critérios de aceite claros.

## Plano técnico

1. Coletar respostas humanas sobre produto, usuário, problema, stack e primeira feature.
2. Atualizar arquitetura, regras e roadmap com decisões confirmadas.
3. Criar `TASK-002` para implementação do primeiro incremento.
4. Validar consistência dos documentos.

## Arquivos/áreas prováveis

- `docs/ARCHITECTURE.md`
- `docs/BUSINESS_RULES.md`
- `docs/ROADMAP.md`
- `docs/AI_HANDOFF.md`
- `tasks/TASK-002-*.md`

## Dependências e riscos

- Dependências: confirmação humana do produto, público e stack.
- Riscos: começar a codar antes de definir regra principal, autenticação e dados pode gerar retrabalho.
- Migração/rollback: não se aplica.

## Plano de validação

- Teste automatizado: não se aplica nesta tarefa documental.
- Verificação manual: revisar documentos e confirmar que a próxima tarefa é executável sem contexto externo.
- Comandos: `rg "\\[PREENCHER\\]" docs tasks`

## Registro de execução

- `2026-08-08` — workflow aplicado ao projeto.

## Encerramento

- [ ] Critérios atendidos.
- [ ] Validações executadas e resultados registrados.
- [ ] Handoff atualizado.
- [ ] Documentação consistente com o produto.
- [ ] Pendências separadas em novas tarefas.
