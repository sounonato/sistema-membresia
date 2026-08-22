# TASK-010 — Auditoria completa do sistema em produção

## Metadados

- Status: `em andamento`
- Prioridade: `P0`
- Responsável: `Codex + Gemini`
- Planejamento: `pessoa`
- Executor: `Codex valida; Gemini revisa quando disponível`
- Revisão excepcional: `necessária por envolver segurança e dados pessoais`
- Branch: `main (somente leitura nesta etapa)`
- Regras relacionadas: `BR-001`, `BR-002`, `BR-003`

## Contexto

O sistema está em funcionamento para uma igreja. A auditoria deve identificar riscos reais sem alterar o código ou o banco. O repositório possui backend Express/PostgreSQL, frontend v4 e versões legadas, com mudanças locais não commitadas.

## Resultado esperado

Um relatório baseado no código real, dividido por frontend, backend, dados, segurança, deploy e operação, com severidade, evidência, impacto, teste seguro e recomendação. Nenhuma correção deve ser aplicada durante esta tarefa.

## Critérios de aceite

- [ ] Fluxos públicos e autenticados foram mapeados.
- [ ] Autenticação, autorização e isolamento entre tenants foram revisados no servidor.
- [ ] Contratos frontend/backend foram conferidos.
- [ ] Migrations, dependências, uploads, jobs e deploy foram avaliados.
- [ ] Achados foram classificados por prioridade e risco operacional.
- [ ] Testes executados e limitações foram registrados.
- [ ] Não houve alteração de código, banco, deploy ou dados da igreja.

## Plano de validação

- `npm run lint` no frontend v4.
- Checagem de sintaxe dos arquivos JavaScript do backend.
- `npm audit --omit=dev` em backend e frontend v4.
- Revisão estática dos contratos e rotas.
- Testes dinâmicos somente em ambiente local/sintético, se houver banco descartável; nunca contra produção.

## Registro inicial

- 2026-08-18 — Auditoria iniciada em modo somente leitura.
- 2026-08-18 — Briefing file-based preparado para Gemini; Gemini/Antigravity não estão disponíveis como ferramenta nesta sessão.

