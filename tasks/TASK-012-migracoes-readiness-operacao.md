# TASK-012 — Migrações, readiness e operação

Status: parcialmente concluída localmente — backup/restore ainda requer procedimento operacional
Prioridade: P1

Objetivo: impedir boot mascarando falhas de banco e melhorar sinais operacionais do serviço.

Escopo: runner idempotente com controle de migrações e lock, endpoint de readiness com teste de banco, CORS por allowlist explícita, limites para endpoints públicos, proteção do job de follow-up e documentação de backup/restore.

Implementado: tabela `schema_migrations`, lock advisory, rollback e falha fechando o boot; `/health`/`/ready`; CORS explícito; rate limit público; lock do follow-up e nome da igreja no texto.
