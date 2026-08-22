# Gemini Review — Avaliação Independente de Implementação

> **Data da Revisão:** 2026-08-18  
> **Avaliador:** Gemini (Antigravity)  
> **Modo:** Somente Leitura (Read-Only)  
> **Documento de Referência:** [`GEMINI_HANDOFF_AUDITORIA_COMPLETA.md`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/GEMINI_HANDOFF_AUDITORIA_COMPLETA.md)  
> **Arquivo de Entrega:** `GEMINI_REVIEW_IMPLEMENTACAO_2026-08-18.md`  

---

## 1. Sumário Executivo

Esta revisão técnica avalia as alterações locais implementadas no repositório `sistema-membresia` em resposta aos achados da auditoria inicial. A avaliação cobriu os cinco eixos prioritários definidos pelo usuário:

1. **Migração `xlsx` → `exceljs`** em [`backend/src/rotas/importacao.js`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/importacao.js).
2. **Atomicidade e Transações** na criação de acessos de discipuladores e membros.
3. **Runner de Migrations e Compatibilidade** com o banco PostgreSQL existente.
4. **Autenticação, Proteção do Portal Público e Isolamento Multi-tenant**.
5. **Configurações de Ambiente, CORS, Healthcheck e Deploy no Railway**.

---

## 2. Avaliação Detalhada por Eixo

### (1) Migração `xlsx` para `exceljs` em `backend/src/rotas/importacao.js`

- **Status:** **Implementado com sucesso e seguro.**
- **O que mudou:**
  - Substituição da biblioteca `xlsx` por `exceljs: "^4.4.0"` no backend.
  - A dependência vulnerável `xlsx` foi removida do [`backend/package.json`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/package.json).
  - Implementação da função `valorDaCelula(valor)` para tratar com segurança objetos de fórmulas, `richText` e textos formatados do Excel.
  - Adição de salvaguarda de DoS com limites rígidos antes da iteração: máximo de **5.000 linhas** e **50 colunas** (`maxRows`, `maxColumns`).
  - As rotinas de parsing de datas (`parseExcelDate`), normalização de gênero, estado civil, tipo de entrada, deduplicação em memória (`nome + telefone`) e validação de limites de plano foram preservadas.
- **Resultado do `npm audit` no Backend:** As vulnerabilidades críticas e altas de parsing de arquivo foram eliminadas.
- **Risco Residual / Observação:** No frontend (`frontend v4/package.json`), a biblioteca `xlsx` ainda é usada no cliente apenas para exportação de relatórios locais (downloads de planilhas no navegador), sem impacto no servidor.

---

### (2) Transações de Criação e Revogação de Acessos

- **Status:** **Parcialmente completo (Criação transacional robusta; Revogação ainda não transacional).**
- **Criação de Acesso de Discipulador ([`backend/src/rotas/discipuladores.js:213-242`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/discipuladores.js#L213-L242)):**
  - Agora utiliza cliente dedicado do pool (`await db.pool.connect()`) com bloco explícito `BEGIN / COMMIT / ROLLBACK`.
  - Insere o usuário em `usuarios` e atualiza `discipuladores.usuario_id` checando `vinculo.rowCount === 1`.
  - Libera o cliente de conexão de forma garantida no bloco `finally`.
- **Criação de Acesso de Membro ([`backend/src/rotas/membros.js:880-907`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/membros.js#L880-L907)):**
  - Adotou o mesmo padrão transacional atômico (`BEGIN / COMMIT / ROLLBACK` com verificação de `rowCount`).
- **Cadastro Público via QR Code ([`backend/src/rotas/publico.js:89-138`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/publico.js#L89-L138)):**
  - Adicionou transação atômica.
  - Valida explicitamente se `grupo_id` pertence à igreja do slug (`WHERE id = $1 AND igreja_id = $2 AND status = 'ativo'`).
  - Insere em `grupo_membros` incluindo a coluna obrigatória `igreja_id`, eliminando o erro 500 do achado **P0-4**.
- **Redefinição de Senha ([`backend/src/rotas/autenticacao.js:379-406`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/autenticacao.js#L379-L406)):**
  - Atualiza o token como usado e altera a senha do usuário em uma única transação atômica.
- **Risco Residual (P2):** Nos endpoints de revogação de acesso ([`discipuladores.js:250-271`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/discipuladores.js#L250-L271) e [`membros.js:915-936`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/membros.js#L915-L936)), a desativação do usuário e a desvinculação da entidade ainda ocorrem em duas queries desconectadas sem `BEGIN/COMMIT`.

---

### (3) Runner de Migrations e Compatibilidade com Banco Existente

- **Status:** **Seguro, idempotente e com controle de versão.**
- **O que mudou em [`backend/src/index.js:113-162`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/index.js#L113-L162):**
  - Criação automática da tabela de controle `schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ)`.
  - Bloqueio distribuído via PostgreSQL Advisory Lock (`pg_advisory_lock(hashtext('sistema-membresia:migrations'))`) para evitar concorrência de inicialização em múltiplos containers.
  - Cada script `.sql` é executado dentro de uma transação (`BEGIN / COMMIT / ROLLBACK`) e gravado em `schema_migrations`.
  - Se qualquer migration falhar, o erro é lançado, a transação daquele arquivo sofre rollback, a inicialização da API é abortada (`app.listen` não executa) e o processo encerra com `process.exitCode = 1`.
- **Compatibilidade com o banco de produção existente:**
  - Todos os scripts em `backend/migracoes/` (`001` a `008`) foram estruturados com cláusulas idempotentes (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).
  - No primeiro boot em um banco existente, os scripts serão executados de forma segura e registrados em `schema_migrations`. Nos boots subsequentes, serão ignorados instantaneamente via checagem `SELECT 1 FROM schema_migrations WHERE filename = $1`.
- **Ponto de Atenção em `002_migracao_supabase.sql:7`:** A consulta `SELECT id INTO igreja_id FROM igrejas WHERE slug = 'nazareno-sede'` assume a existência do slug inicial. Como `001_esquema.sql` insere esse slug com `ON CONFLICT DO NOTHING`, a integridade é mantida.

---

### (4) Autenticação, Proteção do Portal e Isolamento Multi-tenant

- **Status:** **Proteções críticas P0 implementadas com sucesso.**
- **Login Multi-tenant ([`backend/src/rotas/autenticacao.js:23-40`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/autenticacao.js#L23-L40)):**
  - O login passou a aceitar o `slug` da igreja.
  - Quando o `slug` é fornecido, a query valida que a conta pertence àquela igreja ativa (`LOWER(i.slug) = LOWER($2) AND i.ativa = true`).
  - Quando o `slug` não é informado, se o mesmo e-mail existir em mais de uma igreja, o sistema recusa a autenticação com erro `400: 'Informe o slug da igreja para este e-mail'`, eliminando o risco de login cruzado involuntário entre congregações.
- **Middleware de Autenticação com Fonte da Verdade no Banco ([`backend/src/middlewares/autenticacao.js:23-45`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/middlewares/autenticacao.js#L23-L45)):**
  - O middleware agora consulta o banco a cada requisição autenticada.
  - Bloqueia imediatamente usuários com `ativo = false` ou vinculados a igrejas com `ativa = false`.
  - Aplica obrigatoriedade de troca de senha quando `deve_trocar_senha = true`.
  - Retorna status `503` (indisponibilidade temporária) em caso de falha de conexão com o banco, evitando que o frontend deslogue o usuário indevidamente.
- **Proteção Criptográfica do Portal Público ([`backend/src/rotas/portal.js:10-52`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/portal.js#L10-L52)):**
  - O portal público exige agora um token HMAC-SHA256 (`token`) assinado pelo servidor com `PORTAL_SECRET` (`igrejaId + email`).
  - A validação utiliza `crypto.timingSafeEqual` contra ataques de temporização.
  - Requisições sem token válido retornam `404` genérico idêntico a registros inexistentes, anulando a enumeração e raspagem de dados pessoais (PII).
  - Criado endpoint autenticado `POST /api/portal/link` para líderes/pastores gerarem links seguros.
- **Remoção de Bypasses Irrestritos em [`backend/src/middlewares/perfil.js:11-14`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/middlewares/perfil.js#L11-L14):**
  - Removido o bypass automático de superadmin e o bypass irrestrito de pastor em requisições GET. O acesso agora respeita estritamente a matriz de permissões declarada por rota.
- **Correção dos Contratos do Dashboard ([`backend/src/servicos/estatisticas.js:89-183`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/servicos/estatisticas.js#L89-L183)):**
  - Adicionado o campo formatado `por_mes: [{ mes, total }]` e corrigidas as consultas de faixa etária para Superadmin global e Discipulador, eliminando os erros nos gráficos.

---

### (5) Variáveis de Ambiente, CORS, Healthcheck e Railway

- **Status:** **Alinhado aos padrões de produção segura.**
- **Healthcheck e Readiness ([`backend/src/index.js:45-56`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/index.js#L45-L56) e [`backend/railway.json:8`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/railway.json#L8)):**
  - Configurado endpoint `/ready` que executa `SELECT 1` no banco de dados.
  - O `railway.json` aponta `healthcheckPath: "/ready"`, garantindo que o Railway só marque o container como ativo se o PostgreSQL estiver acessível.
- **Configuração de TLS do PostgreSQL ([`backend/src/conexao.js:5-10`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/conexao.js#L5-L10)):**
  - Parametrizado com `DATABASE_SSL_REJECT_UNAUTHORIZED`, permitindo controle estrito de certificados em produção.
- **CORS Rígido ([`backend/src/index.js:30-39`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/index.js#L30-L39)):**
  - Removidos os curingas permissivos de `.pages.dev` e `.railway.app`. O CORS agora valida estritamente a lista de origens autorizadas em `CORS_ORIGINS`.
- **Proteção do Job de Follow-up WhatsApp ([`backend/src/jobs/followupWhatsapp.js:35-49`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/jobs/followupWhatsapp.js#L35-L49)):**
  - Implementado PostgreSQL Advisory Lock (`pg_try_advisory_lock(hashtext('sistema-membresia:followup'))`), impedindo duplicidade de disparos em deploys com múltiplos containers.
  - O texto da mensagem agora recupera dinamicamente o nome da congregação ativa (`i.nome AS igreja_nome`), eliminando a denominação hardcoded.
- **Rate Limiting Aberto em Rotas Públicas ([`backend/src/index.js:69-82`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/index.js#L69-L82)):**
  - Adicionado `publicLimiter` (60 req/min) protegendo `/api/publico` e `/api/portal`.

---

## 3. Matriz de Achados da Revisão de Implementação

| Nível | Identificador | Arquivo e Linhas | Descrição do Achado | Risco de Regressão / Impacto |
|---|---|---|---|---|
| **P1** | **REV-P1-01** | [`backend/src/rotas/portal.js:10-15`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/portal.js#L10-L15)<br>[`backend/.env.example:9`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/.env.example#L9) | **`PORTAL_SECRET` é obrigatório para funcionamento do portal.** | Se a variável `PORTAL_SECRET` não for configurada no Railway antes do deploy, todas as rotas do portal responderão com status 503 / 404. |
| **P1** | **REV-P1-02** | [`backend/src/middlewares/autenticacao.js:25-36`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/middlewares/autenticacao.js#L25-L36) | **Carga adicional de consultas no banco por requisição autenticada.** | A validação ativa no banco adiciona 1 consulta SQL por request de API. Em picos de tráfego, o pool de conexões (`pg.Pool`) deve estar devidamente dimensionado no Railway. |
| **P2** | **REV-P2-01** | [`backend/src/rotas/discipuladores.js:250-271`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/discipuladores.js#L250-L271)<br>[`backend/src/rotas/membros.js:915-936`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/membros.js#L915-L936) | **Revogação de acesso executada fora de transação atômica.** | Se o banco falhar entre a desativação da conta e a desvinculação da entidade, o registro pode ficar em estado intermediário inconsistente. |
| **P2** | **REV-P2-02** | [`frontend v4/package.json:75`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/package.json#L75) | **Dependência `xlsx` mantida no frontend v4 para exportação.** | O backend está protegido, mas o pacote `xlsx` permanece no bundle do frontend com avisos de prototype pollution caso planilhas externas não confiáveis sejam parseadas no cliente. |
| **P2** | **REV-P2-03** | [`frontend v4/src/paginas/manual/page.tsx`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/src/paginas/manual/page.tsx)<br>[`frontend v4/src/paginas/relatorios/page.tsx`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/src/paginas/relatorios/page.tsx) | **Tipagens corrigidas (`tsc --noEmit` passa com 0 erros).** | A validação de tipos TypeScript agora compila com 100% de sucesso. |

---

## 4. Riscos de Regressão e Cuidados Operacionais

1. **Tokens Existentes em Produção:**
   - Como o middleware de autenticação passou a buscar `u.id` no banco e validar `u.ativo` e `u.deve_trocar_senha`, qualquer token antigo que contenha ID de usuário que foi apagado ou desativado deixará de funcionar imediatamente (comportamento desejado de segurança).
2. **Usuários Existentes com Links Antigos do Portal:**
   - Membros com bookmarks de URLs públicas do portal sem o parâmetro `?token=...` receberão `404: 'Portal não encontrado'`. A liderança da igreja deverá gerar novos links via painel (`POST /api/portal/link`).
3. **Login sem Informar o Slug:**
   - Usuários cadastrados em uma única igreja continuam logando apenas com e-mail e senha normalmente. Se o e-mail existir em mais de uma igreja, o sistema exigirá o preenchimento do slug.
4. **Deploy no Railway:**
   - O healthcheck configurado para `/ready` exigirá que as migrations rodem e o banco esteja conectado antes que o tráfego seja roteado para a nova versão.

---

## 5. Roteiro Seguro de Validação Recomendado

Antes de publicar as alterações em produção, execute a seguinte validação em ambiente espelho local:

1. **Validar Runner de Migrations:**
   ```bash
   cd backend && node -e "require('./src/index.js')"
   # Verificar log: "Servidor rodando com sucesso na porta 3031" e tabela "schema_migrations" preenchida
   ```
2. **Testar Importação de Membros com ExcelJS:**
   - Enviar requisição `POST /api/membros/importar` com planilha `.xlsx` de teste contendo cabeçalhos do InChurch.
   - Confirmar importação correta de datas e nomes sem erros de parsing.
3. **Testar Criação Transacional de Acesso:**
   - Chamar `POST /api/discipuladores/:id/acesso` com payload válido.
   - Confirmar no banco que `usuarios` foi criado e `discipuladores.usuario_id` foi atualizado atomicamente.
4. **Testar Proteção do Portal Público:**
   - Acessar `GET /api/portal/slug-teste/email@teste.com` (sem token) → Esperado: `404 Portal não encontrado`.
   - Gerar link via `POST /api/portal/link` e acessar com `?token=...` → Esperado: `200 OK com dados do discipulado`.
5. **Checagem de Compilação e Linter do Frontend:**
   ```bash
   cd "frontend v4" && npx tsc --noEmit && npm run lint
   # Confirmar 0 erros de compilação
   ```

---

## 6. Conclusão da Revisão

A implementação corrigiu com sucesso as vulnerabilidades mais graves apontadas na auditoria (P0), incluindo o isolamento de tenant no login, a blindagem criptográfica do portal público, o erro 500 no cadastro via QR, o runner de migrations com locking e a eliminação da dependência insegura `xlsx` no backend. O sistema encontra-se substancialmente mais robusto e pronto para homologação prévia antes do deploy.

## 7. Correção aplicada após a revisão

Após o parecer do Gemini, os dois pontos de revogação identificados em `backend/src/rotas/discipuladores.js` e `backend/src/rotas/membros.js` também foram corrigidos: desativação do usuário e desvinculação da entidade agora ocorrem em transação única, com validação de `rowCount` e rollback em caso de concorrência ou falha.
