# TASK-013 — Frontend: acesso, contratos e configuração

Status: concluída localmente — aguardando validação visual/staging
Prioridade: P1

Objetivo: alinhar o frontend com as regras de perfil e evitar falhas silenciosas de contrato/configuração.

Escopo: guards por rota, erros de TypeScript, tratamento de 401 versus erro transitório, API URL obrigatória em produção, branding aninhado/achatado e estados de erro visíveis.

Implementado: guards por perfil, `tsc` sem erros, sessão preservada em falha transitória, `VITE_API_URL` obrigatório em produção, branding aninhado e contratos de relatórios corrigidos.
