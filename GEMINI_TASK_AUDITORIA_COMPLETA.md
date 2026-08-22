# Gemini Task — Auditoria completa do sistema em produção

## Objetivo

Auditar o sistema de membresia em funcionamento para uma igreja, cobrindo frontend, backend, banco, segurança, multi-tenancy, contratos, deploy e operação. Esta é uma revisão somente leitura. Não corrigir código, não executar migrations, não alterar banco, não fazer commit, push ou deploy.

## Contexto

- Repositório: `sistema-membresia`
- Frontend documentado como ativo: `frontend v4/`
- Backend: `backend/`
- Banco: PostgreSQL
- Ambiente: Railway
- Regra crítica: preservar a operação da igreja; nenhuma ação destrutiva ou mudança funcional durante a auditoria.

## Escopo

- `backend/src/index.js`
- `backend/src/middlewares/`
- `backend/src/rotas/`
- `backend/src/servicos/`
- `backend/src/jobs/`
- `backend/migracoes/`
- `frontend v4/src/`
- `frontend v4/package.json`, `railway.json`, `nixpacks.toml`, `static-server.cjs`
- `docs/ARCHITECTURE.md`, `docs/BUSINESS_RULES.md`, `docs/AI_HANDOFF.md`, `frontend v4/HANDOFF.md`

## Perguntas obrigatórias

1. O isolamento por `igreja_id` é garantido em toda leitura, escrita, exclusão, transferência e relatório?
2. O backend impede corretamente que cada perfil acesse operações fora da sua permissão?
3. Login, reset de senha, portal público e cadastro público protegem identidade e dados pessoais?
4. Os contratos usados pelo frontend existem e retornam o formato esperado no backend?
5. As migrations, uploads, jobs, CORS, healthcheck e deploy são seguros para produção?
6. O frontend v4 é de fato a versão ativa e está consistente com as versões legadas?

## Entrega obrigatória

Salvar na raiz do repositório `GEMINI_HANDOFF_AUDITORIA_COMPLETA.md` contendo:

1. fluxo atual por área;
2. achados classificados em P0/P1/P2/P3, com arquivo e linha;
3. impacto para uma igreja em funcionamento;
4. testes seguros recomendados;
5. divergências entre documentação e código;
6. validação antes de qualquer correção;
7. itens que não devem ser alterados sem janela de manutenção e backup;
8. confirmação de que não houve edição de código, migration, commit, push ou deploy.

## Restrições

- Não usar credenciais reais.
- Não consultar ou exportar dados pessoais reais.
- Não alterar arquivos de aplicação.
- Não executar comandos que escrevam no banco ou no ambiente de produção.
- Não considerar o guard do frontend suficiente para provar autorização.
- Tratar documentação como intenção e o código executável como comportamento real.

