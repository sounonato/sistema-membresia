# Planejamento: Migração de Dados — InChurch → Ovile

## Contexto

O sistema Ovile (sistema-membresia) precisa de uma funcionalidade de **importação de membros** para igrejas que vêm de outros sistemas. A primeira integração suportada é o **InChurch**, que exporta dados em `.xlsx`.

O arquivo de exemplo real do InChurch tem **225 membros e 47 colunas**.

---

## O que deve ser construído

### 1. Backend — `POST /api/membros/importar`

Endpoint autenticado (admin/lider) que:
- Recebe um arquivo `.xlsx` via `multipart/form-data` (campo: `arquivo`)
- Recebe um parâmetro `sistema=inchurch` no body ou query
- Lê o arquivo com a biblioteca **xlsx** (já instalada) ou **exceljs**
- Mapeia as colunas do InChurch para as colunas da tabela `membros`
- Insere os registros em lote com `INSERT ... ON CONFLICT DO NOTHING` (evita duplicatas por nome+telefone)
- Retorna `{ importados: N, ignorados: N, erros: [] }`

#### Mapeamento InChurch → tabela `membros`

| Coluna InChurch | Campo `membros` | Observação |
|-----------------|-----------------|------------|
| `Nome Completo` | `nome` | obrigatório |
| `Celular/Telefone` | `telefone` | usar este se `Telefone` vazio |
| `Telefone` | `telefone` | fallback |
| `E-mail` | `email` | |
| `Data de nascimento` | `data_nascimento` | formato `dd/mm/yyyy` → converter para ISO |
| `Gênero` | `genero` | "Feminino"→"feminino", "Masculino"→"masculino" |
| `Estado civil` | `estado_civil` | "Casado(a)"→"casado", "Solteiro(a)"→"solteiro", "Divorciado(a)"→"divorciado", "Viúvo(a)"→"viuvo", "União Estável"→"uniao_estavel" |
| `Ocupação` | `profissao` | |
| `Endereço` + `Número` | `endereco` | concatenar |
| `Bairro` | `bairro` | |
| `Cidade` | `cidade` | |
| `UF` | `estado` | |
| `CEP` | `cep` | |
| `Data de entrada` | `data_entrada` | se vazio, usar `Data de Criação` |
| `Forma de entrada` | `tipo_entrada` | "Batismo"→"batismo", "Transferência"→"transferencia", resto→"profissao_de_fe" |
| `Status` / `Situação na igreja` | `status` | "Aprovada(o)"/"Ativo(a)"→"ativo", "Inativo(a)"→"inativo", "Transferido(a)"→"transferido" |
| `Batizado(a)?` | `batizado` | "S"→true, "N"→false |
| `Data de casamento` | `data_casamento` | se existir no schema |
| `Data de Batismo` | `data_batismo` | se existir no schema |
| `Número de membro` | `numero_membro` | guardar como texto em campo extra, se existir |
| `É recém-convertido?` | — | ignorar (vai para convertidos, não membros) |
| `Igreja` | — | ignorar (já sabemos pelo tenant) |

#### Campos ignorados (não existem na tabela `membros` ainda):
- CPF, Documento de Identificação, Órgão Emissor, UF do RG
- Escolaridade, Tipo sanguíneo, Nacionalidade, Naturalidade
- É pastor?, Faz parte da liderança?, Aceitou Jesus?, Tipo do batismo
- Igreja de origem, Entrevistado(a) por, Criado(a) por

#### Lógica de deduplicação:
```sql
INSERT INTO membros (...) 
ON CONFLICT DO NOTHING
-- sem unique constraint hoje: verificar duplicata por (nome, telefone, igreja_id)
```
Se já existir membro com mesmo `nome` E `telefone` E `igreja_id` → pular e contar em `ignorados`.

#### Arquivo: `backend/src/rotas/importacao.js`

```js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { autenticar } = require('../middlewares/autenticacao');
const { checkPerfil } = require('../middlewares/perfil');
const pool = require('../conexao');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/membros/importar', autenticar, checkPerfil(['admin', 'lider']), upload.single('arquivo'), async (req, res) => {
  // 1. Ler xlsx do buffer
  // 2. Mapear colunas
  // 3. Inserir em lote
  // 4. Retornar { importados, ignorados, erros }
});

module.exports = router;
```

Registrar em `backend/src/index.js`:
```js
const importacao = require('./rotas/importacao');
app.use('/api', importacao);
```

Instalar dependências se necessário:
```bash
npm install multer xlsx
```
(verificar se já estão instaladas no package.json)

---

### 2. Frontend — Página de Migração

**Arquivo:** `frontend v4/src/paginas/migracao/page.tsx`
**Rota:** `frontend v4/src/routes/_auth.migracao.tsx`
**Sidebar:** adicionar item "Migração" na seção Administração (perfil: admin, lider)

#### Layout da página:

```
[ 01 — MIGRAÇÃO DE DADOS ]

Traga seus membros de outro sistema

Passo 1 — Selecione o sistema de origem
  [ InChurch ]  (card selecionável com logo/ícone)
  [ Outros em breve... ] (desabilitado)

Passo 2 — Baixe o arquivo do seu sistema
  Instrução: "No InChurch, vá em Membros → Exportar → Excel"
  
Passo 3 — Envie o arquivo aqui
  [ Arrastar arquivo .xlsx ou clique para selecionar ]
  
  [ Importar membros → ]

--- após envio ---
✅ 212 membros importados com sucesso
⚠️  13 ignorados (já existiam no sistema)
❌  0 erros
```

#### Hooks: `frontend v4/src/paginas/migracao/hooks.ts`

```ts
export function useImportarMembros() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.importarMembros(formData),
  });
}
```

#### API: adicionar em `frontend v4/src/lib/api.ts`

```ts
importarMembros: (formData: FormData) =>
  fetchAuth('/membros/importar', {
    method: 'POST',
    body: formData,
    // não setar Content-Type — o browser faz automático para multipart
  }),
```

---

## Estrutura de arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `backend/src/rotas/importacao.js` | **criar** |
| `backend/src/index.js` | **modificar** — registrar rota |
| `backend/package.json` | **verificar/instalar** multer + xlsx |
| `frontend v4/src/paginas/migracao/page.tsx` | **criar** |
| `frontend v4/src/paginas/migracao/hooks.ts` | **criar** |
| `frontend v4/src/routes/_auth.migracao.tsx` | **criar** |
| `frontend v4/src/routeTree.gen.ts` | **modificar** — registrar rota (CRÍTICO para Cloudflare Pages) |
| `frontend v4/src/components/layout/Sidebar.tsx` | **modificar** — adicionar item Migração |
| `frontend v4/src/lib/api.ts` | **modificar** — adicionar `importarMembros` |

---

## Regras importantes do projeto

- **Backend:** Node.js + Express + PostgreSQL, porta 3031, arquivo de conexão: `backend/src/conexao.js`
- **Middleware de autenticação:** `backend/src/middlewares/autenticacao.js` (função `autenticar`)
- **Middleware de perfil:** `backend/src/middlewares/perfil.js` (função `checkPerfil`)
- **Multi-tenant:** toda query deve filtrar por `req.igrejaId` (injetado pelo middleware `autenticar`)
- **Frontend:** TanStack Router file-based, pasta `frontend v4/src/routes/` — arquivo de rota: `_auth.migracao.tsx`
- **CRÍTICO:** após criar a rota, atualizar manualmente `frontend v4/src/routeTree.gen.ts` — o Cloudflare Pages não regenera automaticamente
- **Padrão de página:** `paginas/[nome]/page.tsx` (JSX) + `paginas/[nome]/hooks.ts` (lógica) — sem CSS Module por enquanto
- **Deploy:** `git push origin main` → Cloudflare Pages faz build automático (frontend) e Railway faz deploy automático (backend)

---

## Formato de data InChurch

As datas vêm no formato `dd/mm/yyyy` (ex: `13/10/1951`). Converter para ISO antes de inserir:
```js
function parseDateBR(str) {
  if (!str) return null;
  const [d, m, y] = str.split('/');
  if (!d || !m || !y) return null;
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}
```

---

## Exemplo de linha do arquivo InChurch (formato real, dados fictícios)

```json
{
  "Data de Criação": "22/08/2025",
  "Número de membro": "00001",
  "Nome Completo": "Maria Exemplo da Silva",
  "Gênero": "Feminino",
  "Tipo": "Membro",
  "Igreja": "Igreja Exemplo",
  "Status": "Aprovada(o)",
  "É pastor?": "N",
  "E-mail": "exemplo@email.com",
  "Celular/Telefone": "81999990000",
  "WhatsApp?": "S",
  "Estado civil": "Casado(a)",
  "Batizado(a)?": "S",
  "Tipo do batismo": "Imersão",
  "Data de nascimento": "15/03/1980",
  "Endereço": "Rua das Flores",
  "Número": "100",
  "Bairro": "Centro",
  "CEP": "50000000",
  "Cidade": "Recife",
  "UF": "PE",
  "Situação na igreja": "Ativo(a)"
}
```

---

## Resultado esperado

Ao final, o pastor/admin consegue:
1. Entrar em Administração → Migração
2. Selecionar "InChurch"
3. Fazer upload do `.xlsx` exportado do InChurch
4. Ver o resultado: quantos foram importados, ignorados e com erro
5. Acessar a lista de Membros e ver todos importados corretamente
