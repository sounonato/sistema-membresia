# Receita de bolo — Nonato Labs

Use esta receita sempre que iniciar uma entrega com a assinatura operacional da Nonato Labs. Os arquivos do repositório são a memória oficial; conversas servem para decidir, mas decisões duráveis devem voltar para `docs/` e `tasks/`.

## Assinatura

```text
Codex inicia. Gemini planeja. Lovable prototipa. Claude revisa riscos.
O repositório guarda a verdade.
```

## Ordem padrão

```text
Codex inicia -> Gemini planeja se precisar -> Codex executa -> Lovable prototipa UI se precisar -> Claude revisa riscos -> Codex integra e fecha
```

## Papéis

| Situação | Agente |
|---|---|
| Iniciar projeto, criar tarefa, implementar, testar e atualizar handoff | Codex |
| Ideia vaga, escopo aberto, priorização e critérios de aceite | Gemini |
| UI nova, fluxo visual ou protótipo | Lovable |
| Segurança, pagamentos, privacidade, arquitetura crítica ou bug difícil | Claude |

## Começo de uma tarefa

1. Ler `AGENTS.md`.
2. Ler `docs/AI_HANDOFF.md`.
3. Ler `docs/ARCHITECTURE.md` e `docs/BUSINESS_RULES.md`.
4. Ler a tarefa ativa em `tasks/`.
5. Confirmar escopo, fora do escopo, riscos e validação.
6. Criar ou trocar para a branch da tarefa.

## Fim de uma tarefa

1. Atender critérios de aceite.
2. Rodar testes, lint, tipos e build relevantes.
3. Atualizar documentação afetada.
4. Atualizar `docs/AI_HANDOFF.md`.
5. Registrar pendências como novas tarefas.
6. Fazer commit somente com autorização.

## Prompt para Codex

```text
Leia AGENTS.md, docs/RECEITA_DE_BOLO.md, docs/AI_HANDOFF.md e tasks/[TASK].
Implemente somente o escopo aprovado. Execute validações relevantes.
Atualize docs/AI_HANDOFF.md ao terminar.
```

## Prompt para Gemini

```text
Leia AGENTS.md, docs/RECEITA_DE_BOLO.md, docs/ARCHITECTURE.md,
docs/BUSINESS_RULES.md, docs/ROADMAP.md e docs/AI_HANDOFF.md.
Planeje a próxima tarefa usando tasks/TASK_TEMPLATE.md. Não implemente.
```

## Prompt para Claude

```text
Leia AGENTS.md, docs/RECEITA_DE_BOLO.md, a tarefa ativa, o handoff e o diff.
Faça revisão crítica somente do ponto solicitado: [ARQUITETURA/SEGURANÇA/PAGAMENTOS/BUG].
Liste riscos concretos e proponha a menor correção segura.
```

## Prompt para Lovable

```text
Com base em tasks/[TASK], docs/BUSINESS_RULES.md e docs/ARCHITECTURE.md,
proponha a UI da feature. Cubra estados vazio, carregando, erro, sucesso e responsivo.
Não invente regras de negócio.
```

## Checklist antes de pedir código

- [ ] Produto e usuário estão claros.
- [ ] Primeira feature tem comportamento observável.
- [ ] Critérios de aceite estão escritos.
- [ ] Stack e comandos de validação estão documentados.
- [ ] Regras de negócio afetadas têm IDs.
- [ ] Escopo e fora do escopo estão explícitos.
- [ ] Branch da tarefa existe.

## Checklist antes de terminar

- [ ] Critérios de aceite atendidos.
- [ ] Validações executadas ou justificadas.
- [ ] `docs/AI_HANDOFF.md` atualizado.
- [ ] Decisões duráveis registradas.
- [ ] Pendências explícitas.
- [ ] Próxima ação clara.
