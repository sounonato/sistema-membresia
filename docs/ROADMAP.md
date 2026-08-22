# Roadmap

> Prioridades sao decididas por pessoas. Agentes podem sugerir, mas nao mover itens entre horizontes sem autorizacao.

## Objetivo atual

- Resultado: estabilizar o frontend v4 depois da consolidacao do branding do tenant
- Medida: o `lint` deixa de esconder problemas reais por causa de formatação espalhada
- Prazo/revisao: `2026-08-09`
- Nao objetivos: reescrever telas funcionais ou abrir uma refatoracao visual ampla nesta etapa

## Agora

| ID | Resultado | Responsavel | Status | Dependencias |
|---|---|---|---|---|
| TASK-006 | Simplificar listagem operacional de membros | Codex | concluída | conclusao da TASK-005 |
| TASK-007 | Simplificar detalhe operacional de membro | Codex | concluída | conclusao da TASK-006 |
| TASK-008 | Simplificar listagem operacional de convertidos | Codex | concluída | conclusao da TASK-007 |
| TASK-009 | Simplificar detalhe operacional de convertidos | Codex | concluída | conclusao da TASK-008 |

## Proximo

- A próxima frente operacional mais natural é `convertidos`, depois `discipulado`.

## Depois

- Refinar shell e componentes base de toda a aplicacao
- Reduzir classes hardcoded em telas operacionais
- Ajustar landing e fluxos publicos ao mesmo sistema visual
- Reestruturar dashboard e consolidar leitura rapida
- Simplificar listagem e detalhe de membros

## Fora do escopo atual

- Rebranding completo sem criterio de aceite
- Criar novas integracoes externas
- Desenhar novo modelo de negocio antes de estabilizar o painel autenticado

## Registro de mudancas

| Data | Mudanca | Motivo | Decidido por |
|---|---|---|---|
| `2026-08-08` | Workflow multiagente iniciado | criar memoria compartilhada e primeira tarefa | pessoa + Codex |
| `2026-08-08` | TASK-002 definida para branding autenticado | tornar o primeiro incremento executavel | Codex |
| `2026-08-08` | TASK-003 definida para limpeza de lint | reduzir ruido mecanico e estabilizar o frontend | Codex |
| `2026-08-08` | TASK-004 definida para padronizar shell/base | consolidar tokens e reduzir hardcodes visuais | Codex |
| `2026-08-08` | TASK-005 definida para dashboard | aumentar clareza operacional do painel | Codex |
| `2026-08-08` | TASK-005 concluída | dashboard reestruturado para leitura rápida | Codex |
| `2026-08-09` | TASK-006 definida para membros | simplificar listagem operacional | Codex |
| `2026-08-09` | TASK-006 concluída | listagem de membros mais direta e operacional | Codex |
| `2026-08-09` | TASK-007 definida para detalhe de membro | seguir a frente operacional mais natural | Codex |
| `2026-08-09` | TASK-007 concluída | detalhe de membro mais compacto e operacional | Codex |
| `2026-08-09` | TASK-008 definida para convertidos | seguir a frente operacional mais natural | Codex |
| `2026-08-09` | TASK-008 concluída | listagem de convertidos mais direta e operacional | Codex |
| `2026-08-09` | TASK-009 concluída | detalhe de convertidos mais direto e operacional | Codex |
