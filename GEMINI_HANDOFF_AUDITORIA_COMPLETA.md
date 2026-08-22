# Gemini Handoff — Auditoria Completa do Sistema em Produção

> **Data da Auditoria:** 2026-08-18  
> **Auditor:** Gemini (Antigravity)  
> **Modo de Operação:** Somente Leitura (Read-Only)  
> **Repositório:** `sistema-membresia`  
> **Ambiente Avaliado:** Node.js Express Backend, React 19 + TanStack Start Frontend (`frontend v4/`), PostgreSQL, Railway Hosting  

---

## 1. Confirmação de Restrições e Não-Intervenção

Em conformidade estrita com as regras do projeto (`AGENTS.md`, `GEMINI_TASK_AUDITORIA_COMPLETA.md` e política global):
- [x] **Nenhum arquivo de código-fonte da aplicação foi modificado** (backend, frontend, configs ou scripts).
- [x] **Nenhuma migration SQL foi executada** contra banco local ou de produção.
- [x] **Nenhum dado pessoal, bancário ou confidencial real foi exposto, consultado ou exportado**.
- [x] **Nenhum comando `git commit`, `git push`, `railway up` ou deploy foi realizado**.
- [x] **A auditoria foi 100% estática e analítica**, preservando integralmente a igreja em funcionamento.

---

## 2. Fluxo Atual por Área do Sistema

```
                        ┌────────────────────────────────────────────────────────┐
                        │             Navegador / Visitante / Membro              │
                        └──────────┬───────────────────────────────┬─────────────┘
                                   │                               │
                      Rotas Públicas (sem token)       Rotas Autenticadas (JWT)
                                   │                               │
                                   ▼                               ▼
                     ┌──────────────────────────┐    ┌───────────────────────────┐
                     │       frontend v4        │    │        frontend v4        │
                     │  - Landing (/)           │    │  - Dashboard (/dashboard) │
                     │  - Login (/login)        │    │  - Membros (/membros)     │
                     │  - QR Cadastro (/cad...) │    │  - Convertidos (/convert.)│
                     │  - Portal (/portal)      │    │  - Discipulado/Grupos     │
                     │                          │    │  - Ministérios/Relatórios │
                     │                          │    │  - Superadmin (/igrejas)  │
                     └─────────────┬────────────┘    └─────────────┬─────────────┘
                                   │                               │
                                   │  Fetch REST (JSON / Bearer)   │
                                   ▼                               ▼
                     ┌───────────────────────────────────────────────────────────┐
                     │                      Backend Express                      │
                     │  - Middlewares: autenticacao, tenant, perfil              │
                     │  - Rotas: /auth, /membros, /convertidos, /discipulado...  │
                     │  - Jobs: followupWhatsapp (node-cron semanal)             │
                     └─────────────────────────────┬─────────────────────────────┘
                                                   │
                                                   ▼
                     ┌───────────────────────────────────────────────────────────┐
                     │                   PostgreSQL Database                     │
                     │  - Tabelas: igrejas, usuarios, membros, convertidos,      │
                     │             grupos_discipulado, grupo_membros, ...        │
                     └───────────────────────────────────────────────────────────┘
```

### 2.1 Autenticação e Sessão
- **Login (`/api/auth/login` e `/api/autenticacao/login`):** Recebe `{ email, senha, slug? }`. O backend busca apenas por `email` (`LIMIT 1`), ignorando o `slug`. Retorna token JWT contendo `{ id, perfil, igreja_id }` com validade de 7 dias.
- **Armazenamento:** O frontend v4 salva o token JWT e o slug em `localStorage`.
- **Validação de Sessão (`/api/auth/me`):** O middleware `autenticar` apenas valida a assinatura e expiração do JWT. Não consulta se o usuário continua ativo no banco nem possui versionamento de sessão. Se `/auth/me` falhar por instabilidade de rede ou timeout, o `AuthContext` apaga o token e desloga o usuário.
- **Recuperação de Senha:** `/api/autenticacao/esqueci-senha` gera token em `tokens_reset_senha` com validade de 1 hora e envia por e-mail via Nodemailer (se configurado).

### 2.2 Portal Público e Cadastros Públicos
- **Landing e QR Cadastro (`/cadastro/$slug` e `/api/publico/igrejas/:slug/cadastro`):** Permite cadastro de convertidos via formulário web/QR Code sem autenticação. Se um `grupo_id` for informado, tenta vincular o convertido a um grupo de discipulado.
- **Cadastro Público de Membro (`/api/publico/igrejas/:slug/membros/cadastro`):** Permite autocadastro de membro diretamente na igreja identificada pelo slug.
- **Portal Público do Convertido (`/api/portal/:slug/:email`):** Endpoint sem qualquer autenticação que retorna todos os dados do convertido, discipulador, grupo e histórico de aulas baseado unicamente no e-mail passado na URL.
- **Solicitação de Igreja (`/api/publico/solicitacao-igreja`):** Permite que novas igrejas solicitem entrada na plataforma. Cria registro pendente para análise do superadmin.

### 2.3 Gestão de Membros e Ministérios
- **Membros (`/api/membros`):** CRUD operacional completo (listagem paginada, filtros por status/busca/ministério, detalhes, métricas de retenção pastoral "vi hoje", vínculo com ministérios e cargos).
- **Importação InChurch (`/api/membros/importar`):** Processamento multipart de planilha Excel (`.xlsx`), deduplicação em memória por `nome + telefone` e validação de limite de membros ativos por plano.
- **Métricas (`/api/membros/metricas` e `/api/membros/stats`):** Totalizadores de ativos, inativos, transferidos, batizados, aniversariantes do mês, faixas etárias e tempo sem contato (30/60/90 dias).
- **Ministérios (`/api/ministerios`):** Cadastro de departamentos, liderança e escala de membros vinculados.

### 2.4 Novos Convertidos e Discipulado
- **Convertidos (`/api/convertidos`):** Pipeline de acompanhamento desde a decisão até o batismo/membresia. Suporte a paginação, filtros e atribuição de discipulador responsável.
- **Discipulado (`/api/discipulado/grupos`):** Gestão de grupos de discipulado, matrícula de membros (`grupo_membros`) e controle de lições/aulas concluídas (`progresso_aulas`).
- **Discipuladores (`/api/discipuladores`):** Cadastro de mentores e geração de login de acesso com perfil `discipulador`.

### 2.5 Painel Superadmin
- **Igrejas (`/api/igrejas`):** CRUD de tenants, upload de logomarcas, alternância de status ativo/inativo e criação de administradores locais.
- **Solicitações (`/api/superadmin/solicitacoes`):** Aprovação e rejeição de pedidos de novos tenants com disparo de credenciais temporárias.

### 2.6 Rotinas em Background (Jobs)
- **WhatsApp Follow-up (`backend/src/jobs/followupWhatsapp.js`):** Cron embutido no processo Node.js agendado para segundas-feiras às 9h. Busca membros ativos sem contato há mais de 90 dias e dispara mensagem via Evolution API.

---

## 3. Matriz Completa de Achados (P0 / P1 / P2 / P3)

### 🔴 P0 — Crítico (Risco Imediato de Vazamento, Bypass de Autorização ou Quebra Operacional)

| ID | Arquivo e Linhas | Descrição do Achado | Causa Raiz | Impacto para a Igreja |
|---|---|---|---|---|
| **P0-1** | [`backend/src/middlewares/perfil.js:11-14`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/middlewares/perfil.js#L11-L14) | **Bypass global irrestrito de perfil para Superadmin em rotas operacionais.** | `if (usuarioPerfil === 'superadmin') return next();` libera qualquer rota operacional sem validar tenant. | Se o Superadmin fizer requisições diretas à API sem passar `x-tenant-slug`, operações de consulta, edição ou deleção atingem dados sem escopo de tenant ou afetam tenants indevidos. |
| **P0-2** | [`backend/src/rotas/autenticacao.js:23-33`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/autenticacao.js#L23-L33)<br>[`backend/src/rotas/autenticacao.js:321-324`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/autenticacao.js#L321-L324) | **Login e Reset de Senha ignoram o `slug` da igreja e buscam apenas por e-mail com `LIMIT 1`.** | `WHERE u.email = $1 LIMIT 1` desconsidera que o schema permite e-mails iguais em igrejas diferentes (`UNIQUE(email, igreja_id)`). | Se um pastor/líder tiver cadastro com o mesmo e-mail em duas igrejas, ele pode logar na conta da outra igreja ou resetar a senha da conta errada, violando o isolamento entre tenants. |
| **P0-3** | [`backend/src/rotas/portal.js:7-63`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/portal.js#L7-L63) | **Portal público expõe dados cadastrais e jornada pastoral sensível sem autenticação.** | Rota `GET /:slug/:email` confia cegamente no e-mail como autenticador público na URL. | Qualquer pessoa que adivinhe ou possua o e-mail de um membro/convertido pode visualizar nome, telefone, status de batismo, nome do discipulador, grupo e anotações das aulas (vazamento massivo de PII/LGPD). |
| **P0-4** | [`backend/src/rotas/publico.js:111-116`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/publico.js#L111-L116)<br>[`backend/migracoes/001_esquema.sql:97-104`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/migracoes/001_esquema.sql#L97-L104) | **Cadastro público via QR quebra com erro 500 ao selecionar Grupo de Discipulado.** | `INSERT INTO grupo_membros (grupo_id, convertido_id)` omite `igreja_id`, que é coluna `NOT NULL` obrigatória na tabela. | Novos convertidos escaneando o QR Code e escolhendo um grupo de discipulado recebem falha de servidor e seu cadastro não vincula ou quebra a requisição. |

---

### 🟠 P1 — Alto (Risco de Integridade, Falha de Segurança Estrutural ou Dependência Vulnerável)

| ID | Arquivo e Linhas | Descrição do Achado | Causa Raiz | Impacto para a Igreja |
|---|---|---|---|---|
| **P1-1** | [`backend/src/index.js:93-111`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/index.js#L93-L111) | **Auto-migration ingênua sem controle de versões executadas.** | Lê todos os `.sql` e executa na inicialização. Erros geram apenas `console.error` (warning) e o servidor sobe com schema incompleto. | Risco de corrupção estrutural do banco em caso de falha silenciosa de migration ao reiniciar o container no Railway. |
| **P1-2** | [`backend/src/middlewares/autenticacao.js:22-30`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/middlewares/autenticacao.js#L22-L30) | **JWT sem revogação, blacklist ou checagem de usuário ativo no banco.** | O token dura 7 dias e o middleware só valida JWT estático; não checa `usuarios.ativo` nem `deve_trocar_senha`. | Um administrador ou discipulador desativado ou desligado da igreja continua acessando a API por até 7 dias se tiver o token em mãos. |
| **P1-3** | [`backend/migracoes/001_esquema.sql:128-136`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/migracoes/001_esquema.sql#L128-L136) | **Credenciais padrão pré-fabricadas gravadas em migration de schema.** | Seeds contêm hashes públicos conhecidos (`admin123`) para `super@nazareno.com` e `admin@nazareno.com`. | Qualquer novo deploy ou base inicializada nasce com contas administrativas vulneráveis a invasão imediata se as senhas não forem alteradas no mesmo instante. |
| **P1-4** | [`backend/package.json:11-20`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/package.json#L11-L20)<br>[`frontend v4/package.json:18-77`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/package.json#L18-L77) | **Vulnerabilidades críticas e altas de dependências (npm audit).** | `tar` (crítica no backend), `body-parser`, `xlsx` (prototype pollution/ReDoS sem fix direto), `ip-address`, `nanoid`, `postcss`. | Risco de negação de serviço (DoS) via upload de arquivos manipulados ou travamento de parsing de planilhas. |
| **P1-5** | [`backend/src/rotas/publico.js:111-116`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/publico.js#L111-L116) | **Ausência de validação de tenant cruzado no grupo do cadastro público.** | O endpoint público aceita qualquer `grupo_id` enviado no body sem verificar se `grupo.igreja_id === igreja.id`. | Um atacante pode injetar `grupo_id` de outra igreja e vincular membros de uma congregação no discipulado de outra congregação. |
| **P1-6** | [`backend/src/rotas/igrejas.js:12-39`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/igrejas.js#L12-L39)<br>[`backend/src/rotas/igrejas.js:213-254`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/igrejas.js#L213-L254) | **Upload de logotipos salvo em sistema de arquivos local efêmero.** | `multer.diskStorage` grava em `backend/uploads/logos/`. No Railway, o filesystem é efêmero por padrão. | A cada novo deploy ou reinício do container do backend, todos os logotipos customizados enviados pelas igrejas são apagados do disco. |

---

### 🟡 P2 — Médio (Divergências de Contrato, Erros de Tipo, Métricas Incorretas ou Fragilidades Operacionais)

| ID | Arquivo e Linhas | Descrição do Achado | Causa Raiz | Impacto para a Igreja |
|---|---|---|---|---|
| **P2-1** | [`frontend v4/src/lib/api.ts:162-166`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/src/lib/api.ts#L162-L166)<br>[`frontend v4/src/paginas/manual/page.tsx:220`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/src/paginas/manual/page.tsx#L220) | **Contrato fantasma: rota `/manual/chat` não existe no backend.** | Frontend chama `POST /api/manual/chat`, mas o backend não monta nenhum router para `/manual`. | O chat com IA do manual cai sempre no fallback offline local por regex/texto estático. O recurso com IA nunca funciona no servidor. |
| **P2-2** | [`backend/src/servicos/estatisticas.js:98-138`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/servicos/estatisticas.js#L98-L138) | **Dashboard estatístico de Superadmin quebra por erro de prepared statement.** | Para Superadmin sem tenant, `params` é zerado (`[]`), mas `porFaixaEtariaQuery` mantém `WHERE igreja_id = $1`. | O Postgres lança erro de `bind message supplies 0 parameters, but prepared statement requires 1` e a tela de estatísticas do Superadmin falha. |
| **P2-3** | [`backend/src/servicos/estatisticas.js:55-96`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/servicos/estatisticas.js#L55-L96) | **Métricas de faixa etária do discipulador usam parâmetro trocado.** | `params` recebe `[discipuladorId, igrejaId]`, mas a query não é customizada e busca `WHERE igreja_id = $1` (passando o ID do discipulador no lugar da igreja). | O gráfico de faixa etária do discipulador retorna vazio ou dados inválidos. |
| **P2-4** | [`backend/src/servicos/estatisticas.js:141-149`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/servicos/estatisticas.js#L141-L149)<br>[`frontend v4/src/paginas/dashboard/hooks.ts:9-10`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/src/paginas/dashboard/hooks.ts#L9-L10)<br>[`frontend v4/src/paginas/dashboard/page.tsx:355-520`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/src/paginas/dashboard/page.tsx#L355-L520) | **Divergência de contrato nos gráficos do Dashboard principal.** | Backend retorna `convertidos_por_mes` (`mes`, `quantidade`) e `por_genero` (`genero`, `quantidade`). O frontend espera `por_mes` (`mes`, `total`) e `por_genero` (`genero`, `total`). | Os gráficos de barras mensais e o gráfico de pizza por gênero no Dashboard principal não encontram as propriedades e renderizam vazios / 0. |
| **P2-5** | [`frontend v4/src/paginas/manual/page.tsx:59`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/src/paginas/manual/page.tsx#L59)<br>[`frontend v4/src/paginas/relatorios/page.tsx:154-316`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/src/paginas/relatorios/page.tsx#L154-L316) | **Frontend v4 falha no `npx tsc --noEmit` com 9 erros de tipagem TypeScript.** | Erros em propriedades tipadas (`m.nome` em vez de `m.ministerio_nome`, `total_membros`, parâmetros de busca de rota e tipagem estrita de datas). | Embora o lint passe, o build estrito de TypeScript falha sem a resolução dessas tipagens. |
| **P2-6** | [`backend/src/jobs/followupWhatsapp.js:40-52`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/jobs/followupWhatsapp.js#L40-L52)<br>[`backend/src/jobs/followupWhatsapp.js:35-37`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/jobs/followupWhatsapp.js#L35-L37) | **Job de WhatsApp sem isolamento de tenant, sem lock distribuído e com texto hardcoded.** | Dispara para membros de todas as igrejas de uma vez; mensagem fixa assina "Igreja do Nazareno"; se houver 2 instâncias do backend no Railway, as mensagens são duplicadas. | Membros de outras denominações ou congregações recebem mensagens com o nome "Igreja do Nazareno", e membros podem receber mensagens repetidas. |
| **P2-7** | [`backend/src/index.js:30-39`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/index.js#L30-L39) | **CORS excessivamente permissivo com curinga em `.pages.dev` e `.railway.app`.** | Qualquer app hospedado na Cloudflare Pages ou Railway é aceito com `credentials: true`. | Permite que qualquer site malicioso hospedado nesses domínios públicos envie requisições autenticadas para o backend do usuário. |
| **P2-8** | [`frontend v4/src/contexts/AuthContext.tsx:39-45`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/frontend%20v4/src/contexts/AuthContext.tsx#L39-L45) | **Logout forçado e perda de sessão diante de instabilidade temporária.** | Qualquer rejeição de `api.me()` executa `localStorage.removeItem("token")`. | Se a API demorar para responder ou der um erro 500 temporário, todos os usuários ativos da igreja são subitamente deslogados. |
| **P2-9** | [`backend/src/index.js:45-47`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/index.js#L45-L47) | **Healthcheck superficial sem teste de conectividade com PostgreSQL.** | Endpoint `/health` responde `status: 'OK'` estático sem executar `SELECT 1`. | O Railway reporta o backend como saudável mesmo se o banco de dados cair ou a string de conexão estiver incorreta. |

---

### ⚪ P3 — Baixo (Polimento, Higiene de Código, Documentação e Débito Técnico)

| ID | Arquivo e Linhas | Descrição do Achado | Causa Raiz | Impacto para a Igreja |
|---|---|---|---|---|
| **P3-1** | Raiz do repositório (`frontend/`, `frontend v2/`, `frontend v3/`, `frontend v4/`) | **Quatro diretórios de frontend coexistindo na raiz do repositório.** | Histórico de iterações anteriores mantido sem arquivamento ou limpeza. | Risco de confusão operacional sobre qual frontend está sendo mantido, testado ou publicado. |
| **P3-2** | [`backend/src/index.js:52-62`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/index.js#L52-L62) | **Apenas rotas de login possuem rate limiting configurado.** | Endpoints públicos pesados (`/cadastro`, `/importar`, `/solicitacao-igreja`, `/portal`) não possuem limitador de requisições. | Possibilidade de spam de formulários públicos ou esgotamento de conexões do pool do banco. |
| **P3-3** | [`backend/src/conexao.js:5-8`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/conexao.js#L5-L8) | **Conexão PostgreSQL com `rejectUnauthorized: false` sem parametrização estrita de CA.** | Configuração padrão comum para SSL em clouds gerenciadas. | Vulnerabilidade teórica a ataques Man-in-the-Middle caso o tráfego de rede interna seja interceptado. |
| **P3-4** | [`backend/src/rotas/convertidos.js:251`](file:///Users/andersonnonato/Documents/CLAUDE%20CODE/sistema-membresia/backend/src/rotas/convertidos.js#L251) | **Uso de convenção confusa `checkPerfil([])` para rota restrita a Superadmin.** | Como `checkPerfil` dá bypass em superadmin e nega qualquer perfil fora da lista, passar array vazio bloqueia todos menos superadmin. | Dificulta a legibilidade e manutenção do código por outros agentes/desenvolvedores. |

---

## 4. Divergências entre Documentação e Código Real

1. **Manual da Igreja e Chat com IA:**
   - *Documentação (`docs/ARCHITECTURE.md`, `frontend v4/HANDOFF.md`):* Registra integração do Manual com IA via rota `POST /manual/chat`.
   - *Código Real:* Não há rota `/manual/chat` nem controller de IA no backend Express. O frontend v4 faz um fallback offline via regex em `src/lib/manual.ts`.
2. **Dashboard e Métricas:**
   - *Documentação:* Declara que o Dashboard fornece estatísticas agregadas consumidas pelo frontend.
   - *Código Real:* Os nomes das propriedades retornadas pelo backend (`convertidos_por_mes`, `quantidade`) divergem dos nomes consumidos pelos componentes do frontend v4 (`por_mes`, `total`), gerando gráficos vazios em tempo de execução.
3. **Isolamento de Superadmin:**
   - *Documentação (`docs/BUSINESS_RULES.md - BR-001`):* Superadmin não deve operar dados de membros como usuário normal sem escolher a igreja.
   - *Código Real:* O middleware `perfil.js` dá bypass irrestrito e rotas como `POST /api/convertidos` permitem que o Superadmin opere sem tenant ou associe a qualquer igreja sem checagem de contexto.
4. **Cadastro Público via QR Code:**
   - *Documentação (`docs/ARCHITECTURE.md`, `frontend v4/HANDOFF.md`):* Descreve fluxo contínuo de cadastro com seleção opcional de grupo de discipulado.
   - *Código Real:* O envio com grupo selecionado tenta gravar em `grupo_membros` sem `igreja_id`, violando a constraint `NOT NULL` do banco de dados e causando erro 500.

---

## 5. Roteiro Seguro de Testes Recomendados (Sem Escrita em Produção)

Para reproduzir e validar cada achado em ambiente local ou staging com banco de testes descartável (nunca contra a base real da igreja):

1. **Teste Seguro de Isolamento Multi-tenant no Login (P0-2):**
   - Criar no banco de testes duas igrejas (`Igreja Alpha` e `Igreja Beta`).
   - Criar o usuário `pastor@teste.com` na Igreja Alpha com senha `SenhaAlpha123` e na Igreja Beta com senha `SenhaBeta123`.
   - Chamar `POST /api/auth/login` passando `{ email: "pastor@teste.com", senha: "SenhaBeta123", slug: "igreja-alpha" }`.
   - *Verificação esperada:* Observar qual conta é autenticada e verificar que o slug foi ignorado na consulta SQL.
2. **Teste Seguro do Portal Público (P0-3):**
   - Em ambiente local, criar um convertido na base de testes com anotações pastorais.
   - Acessar `GET /api/portal/slug-teste/email-do-convertido@teste.com` via curl ou Postman sem nenhum cabeçalho `Authorization`.
   - *Verificação esperada:* Confirmar que todos os dados cadastrais, discipulador e notas são retornados publicamente.
3. **Teste Seguro de Cadastro Público com Grupo (P0-4):**
   - Em ambiente local, chamar `POST /api/publico/igrejas/:slug/cadastro` enviando payload com `grupo_id` válido.
   - *Verificação esperada:* Observar o erro `23502 (not-null constraint violation on grupo_membros.igreja_id)`.
4. **Teste Seguro dos Gráficos do Dashboard (P2-4):**
   - Logar no frontend v4 conectado a um backend com registros de conversão no mês.
   - Inspecionar a resposta de `GET /api/dashboard/stats` no DevTools e comparar as chaves (`convertidos_por_mes` vs `por_mes`).
   - *Verificação esperada:* Confirmar por que o gráfico de barras fica zerado.
5. **Teste Seguro de Compilação TypeScript (P2-5):**
   - No diretório `frontend v4/`, executar `npx tsc --noEmit`.
   - *Verificação esperada:* Confirmar a emissão dos 9 erros de tipagem em `manual/page.tsx` e `relatorios/page.tsx`.

---

## 6. Validação e Protocolo Antes de Qualquer Correção Futura

Qualquer equipe ou agente que venha a implementar correções neste repositório **DEVE** seguir este protocolo:

1. **Congelamento de Deploy:** Não realizar nenhum deploy no Railway durante o diagnóstico.
2. **Backup Frio do Banco de Dados:**
   - Realizar snapshot completo do PostgreSQL via `pg_dump` antes de qualquer toque em migrations ou schemas:
     ```bash
     pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -b -v -f backup_pre_correcao_$(date +%Y%m%d_%H%M%S).dump
     ```
3. **Janela de Manutenção:** Agendar janela em horário de baixo uso da congregação (ex: madrugada de segunda/terça-feira, evitando finais de semana e noites de culto).
4. **Ambiente Espelho Local:** Reproduzir a migration e o backend em PostgreSQL local com dados fictícios antes de aplicar em produção.
5. **Plano de Rollback:** Cada alteração deve ter seu script de rollback documentado e testado.

---

## 7. Itens que NÃO Devem Ser Alterados sem Janela de Manutenção e Backup

1. **Tabela `grupo_membros` e suas Foreign Keys:**
   - Ajustar o `NOT NULL` ou inserir `igreja_id` automaticamente no backend afeta o relacionamento de discipulado de todos os membros existentes.
2. **Mecanismo de Login e Índices de `usuarios`:**
   - Modificar a consulta de login para exigir `slug` ou mudar a constraint de `UNIQUE(email, igreja_id)` pode bloquear o acesso de administradores e pastores que atualmente logam apenas digitando e-mail.
3. **Estrutura de Migrations (`backend/src/index.js` e `backend/migracoes/`):**
   - A introdução de uma tabela `schema_migrations` ou ferramenta de migração (Umzug/Knex) precisa ser sincronizada com o estado real das tabelas já existentes no Railway para não tentar re-executar tabelas já criadas.
4. **Armazenamento de Uploads:**
   - A migração de `/uploads` locais para um Object Storage externo (como Cloudflare R2, AWS S3 ou Supabase Storage) requer migração prévia de arquivos existentes para não quebrar os links de logomarca já salvos no banco.

---

## 8. Conclusão e Próximo Passo Recomendado

A auditoria identificou vulnerabilidades arquiteturais relevantes (especialmente no isolamento de tenant no login, portal público e cadastro público via QR), além de divergências contratuais entre frontend e backend. No entanto, o sistema possui uma base sólida e modular em Node/Express e React 19.

**Próximo passo recomendado para os agentes/gestores:**
1. Criar tarefas atômicas e isoladas em `tasks/` baseadas nos achados (ex: `TASK-011-seguranca-login-tenant`, `TASK-012-privacidade-portal-publico`, `TASK-013-correcao-cadastro-qr-grupo`, `TASK-014-contrato-dashboard-metricas`).
2. Executar em ambiente de homologação/staging com dados sintetizados.
3. Submeter revisão técnica antes de aplicar qualquer patch em produção.
