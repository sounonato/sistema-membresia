# TASK-015 — Staging, dependências e revisão cruzada

Status: concluída localmente — staging pendente
Prioridade: P1

Implementado localmente:

- backend atualizado para `bcrypt@6`, `node-cron@4.6`, `express-rate-limit@8.6.2`, `axios@1.19`, `nodemailer@9.0.5` e `pg@8.23`;
- overrides para `ip-address` e `body-parser` corrigirem os advisories transitivos;
- parser de importação backend migrado de `xlsx` para `exceljs`, mantendo limite de 5.000 linhas e 50 colunas;
- `npm audit --omit=dev --audit-level=high` do backend sem vulnerabilidades altas/críticas;
- procedimento de backup/restore e checklist de staging documentado.
- revisão independente do Gemini concluída em `GEMINI_REVIEW_IMPLEMENTACAO_2026-08-18.md`;
- criação e revogação de acessos de membros/discipuladores tornadas transacionais, com escopo por igreja e rollback em caso de inconsistência.
- homologação local concluída em banco sintético temporário: migrations `001` a `009`, `/health`, `/ready`, CORS permitido/rejeitado e rotas públicas verificados;
- fluxos críticos aprovados: login com slug, bloqueio de login ambíguo, isolamento entre dois tenants, portal HMAC, criação/revogação de acesso, usuário inativo e troca de senha obrigatória;
- frontend homologado com `tsc`, lint e build de produção aprovados;
- rejeição de origem CORS ajustada para retornar `403` em vez de `500`.

Pendências controladas:

- backend ainda possui advisories moderados transitivos do `exceljs/uuid`;
- frontend mantém `xlsx` apenas para exportação local e ainda possui advisories conhecidos;
- executar staging hospedado com banco sintético/espelho e checklist operacional antes de qualquer deploy na igreja em produção.
