# TASK-014 — Hardening de dependências e dados

Status: concluída localmente — risco residual documentado em TASK-015
Prioridade: P1/P2

Objetivo: reduzir superfície de ataque e risco de perda/exposição de dados.

Escopo: dependências vulneráveis, importação XLSX com limites, uploads com validação, TLS configurável sem desabilitar verificação por padrão, revisão do dump local e política de retenção de logs/PII.

Implementado: limite de linhas/colunas na importação, parser backend migrado para `exceljs`, MIME + extensão no upload, TLS verificável por padrão, dependências backend atualizadas e remoção de nomes dos logs do follow-up. O frontend mantém `xlsx` somente para exportação local; revisão e staging estão em `TASK-015`.
