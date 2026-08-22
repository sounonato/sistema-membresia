# Auditoria completa — 2026-08-18

## Escopo e método

Auditoria estática do frontend v4, backend, migrations, configurações de Railway e documentação. O sistema está em funcionamento; nenhuma alteração de código, banco, migration, deploy ou dado real foi executada.

Os documentos do projeto foram tratados como intenção. O comportamento foi inferido do código executável.

## Arquitetura observada

`Browser → frontend v4 → API Express/JWT → PostgreSQL`, com uploads locais e job cron para WhatsApp.

O frontend v4 é a versão documentada como atual, mas `frontend`, `frontend v2` e `frontend v3` também permanecem no repositório.

## Achados prioritários

### P0 — Isolamento e autorização

- `backend/src/middlewares/perfil.js:11-14`: `superadmin` recebe bypass para qualquer rota que use `checkPerfil`, inclusive rotas operacionais. O frontend restringe a navegação, mas a API não.
- Várias rotas operacionais usam filtros condicionais `if (req.igrejaId)`. Para superadmin, `igrejaId` pode ser nulo, criando possibilidade de consulta ou mutação sem escopo de tenant.

### P1 — Autenticação e privacidade

- `backend/src/rotas/autenticacao.js:23-31`: login ignora o `slug` enviado pelo frontend e busca somente por e-mail com `LIMIT 1`. E-mails repetidos em igrejas diferentes podem autenticar a conta errada.
- `backend/src/rotas/autenticacao.js:313-379`: reset de senha também busca somente por e-mail, sem tenant.
- `backend/src/rotas/portal.js:7-63`: portal público revela status, batismo, grupo, discipulador e progresso usando apenas slug + e-mail na URL. O e-mail não funciona como fator de posse.
- Tokens JWT são mantidos em `localStorage` no frontend v4, ampliando o impacto de XSS.
- O JWT dura 7 dias e o middleware não consulta `usuarios.ativo` nem versão de sessão; desativar ou trocar o perfil não invalida tokens já emitidos.
- `backend/migracoes/001_esquema.sql:128-135` contém seeds com senha original `admin123`; instalações novas/restauradas podem nascer com credenciais conhecidas.

### P1 — Dados e fluxo público

- `backend/src/rotas/publico.js:111-115` insere `grupo_membros` sem `igreja_id`, enquanto `backend/migracoes/001_esquema.sql:97-104` declara essa coluna como obrigatória. O cadastro público com grupo selecionado pode falhar.
- O vínculo público de grupo precisa validar que o grupo pertence à mesma igreja do slug; a FK atual não expressa essa regra entre tenants.

### P1 — Dependências

- `npm audit --omit=dev` no backend encontrou 8 vulnerabilidades: 1 crítica, 4 altas, 2 moderadas e 1 baixa. Entre elas estão `xlsx` direto, `tar` transitivo e `node-cron`/`uuid`.
- No frontend v4 foram encontrados 6 avisos: 4 altas, 1 moderada e 1 baixa; `xlsx` também é dependência direta e permanece sem correção automática disponível.

### P1 — Operação e migrations

- `backend/src/index.js:93-110`: migrations são reexecutadas na inicialização, sem tabela de controle, e falhas são apenas logadas como warning; o backend pode iniciar com schema incompleto.
- Upload de logo depende do filesystem local em `backend/uploads`; isso é frágil em hosting efêmero e não há política de backup/retenção documentada.
- `/health` sempre responde 200 sem testar PostgreSQL, embora seja usado como healthcheck do Railway.
- Não há política operacional de backup, restore, RPO/RTO ou teste de restauração documentado.

### P2 — Contratos e comportamento

- O frontend chama `/manual/chat` em `frontend v4/src/lib/api.ts:162-166`, mas não há rota correspondente montada no backend. A tela possui fallback local, mas o contrato documentado não está implementado.
- `backend/src/servicos/estatisticas.js:98-138` contém suporte global para superadmin, mas a query de faixa etária não é substituída e continua dependente de `$1`; o caso global pode falhar.
- No mesmo serviço, o fluxo de discipulador mantém a query de faixa etária com `$1` apontando para o `discipuladorId`, não para `igrejaId`, produzindo métrica incorreta ou erro lógico.
- Há divergência potencial entre permissões documentadas, guard do frontend e permissões efetivas de algumas rotas de leitura no backend.
- `npx tsc --noEmit` falha com 9 erros em Manual e Relatórios; o lint passa, mas isso não comprova que o frontend compila tipado.
- O frontend v4 pode cair para `http://localhost:3031/api` quando `VITE_API_URL` não está definida; em produção isso aponta para a máquina do usuário.
- O `AuthContext` remove o token em qualquer falha de `/auth/me`, inclusive 500/timeout, deslogando usuários durante indisponibilidade transitória.
- O branding autenticado espera campos achatados (`igreja_cor`, `igreja_logo`), enquanto o tipo também aceita `usuario.igreja`; há risco de logo/cor não renderizarem dependendo do formato retornado.
- As rotas públicas de cadastro não aplicam consistentemente o branding do tenant, embora BR-002 o exija.
- O job de WhatsApp não possui lock distribuído, filtro explícito de tenant ou idempotência forte; pode duplicar mensagens em mais de uma instância e usa texto fixo da Igreja do Nazareno.
- O portal público usa e-mail como credencial e não possui rate limit; cadastro público, solicitação de igreja e reset de senha também não têm proteção específica contra abuso.

### P2 — Configuração e superfície pública

- `backend/src/index.js:30-39` aceita qualquer subdomínio `pages.dev` ou `railway.app`, além das origens configuradas; isso amplia a confiança de CORS.
- Somente login possui rate limit explícito. Cadastro público, solicitação de igreja, portal público, reset de senha e upload precisam de política de abuso e observabilidade.

## Validações executadas

- `npm run lint` no frontend v4: passou com 7 warnings de Fast Refresh.
- Checagem de sintaxe dos arquivos JavaScript do backend: passou.
- `npm audit --omit=dev` backend: falhou com 8 vulnerabilidades reportadas.
- `npm audit --omit=dev` frontend v4: falhou com 6 vulnerabilidades reportadas.
- `npx tsc --noEmit` frontend v4: falhou com 9 erros em `manual/page.tsx` e `relatorios/page.tsx`.
- Não foram executadas migrations, servidor, chamadas autenticadas ou operações no banco de produção.

## Próxima ordem segura

1. Confirmar com evidência de produção qual frontend está publicado e qual contrato de API está ativo.
2. Fazer backup/verificação do banco antes de qualquer mudança de schema.
3. Reproduzir os achados P0/P1 em ambiente local ou banco mascarado.
4. Criar tarefas separadas para auth/tenant, portal público, cadastro público, migrations e dependências.
5. Só depois planejar correções com janela de manutenção, rollback e testes de regressão.
