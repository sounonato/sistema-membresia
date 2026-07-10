# Prompt para o Lovable — Módulo Membresia (Frontend)

> Cole este prompt completo no Lovable. Ele contém toda a estrutura, padrões, tipos e telas que devem ser criados. Não assuma nada fora do que está aqui documentado.

---

## 1. CONTEXTO DO PROJETO

Este é o frontend do **Sistema de Membresia da Igreja do Nazareno**. Você vai adicionar o **módulo de Membresia** ao projeto existente.

**Stack existente (não alterar):**
- TanStack Start (SSR) + Bun
- TypeScript + Tailwind CSS
- TanStack Query (React Query v5) para todas as chamadas de API
- TanStack Router com rotas baseadas em arquivos na pasta `src/routes/`
- Sonner para toasts
- Lucide React para ícones
- shadcn/ui para componentes (`Button`, `Input`, `Select`, `Dialog`, `Badge`, `Label`, etc.)

---

## 2. DESIGN SYSTEM EXISTENTE (siga à risca)

### Cores
- Background: `#faf7f2` (body)
- Primário: `text-amber-800` / `bg-amber-800` / border-amber-* (âmbar)
- Texto principal: `text-stone-900`
- Texto secundário: `text-stone-500` / `text-stone-600`
- Bordas: `border-stone-200` / `border-stone-300`
- Cards: `border border-stone-200 bg-white`
- Sidebar: `bg-stone-950`

### Tipografia
- Títulos: `font-serif` (Fraunces ou Playfair Display)
- Subtítulos editoriais: `font-[Instrument_Serif,serif] italic`
- Labels de seção: `text-xs tracking-widest uppercase text-stone-500`
- Numeração de seção: `text-xs font-serif italic text-amber-800 tabular-nums`

### Botões
- Primário: `rounded-none bg-stone-900 text-amber-50 hover:bg-amber-800`
- Outline: `rounded-none border-stone-300 hover:bg-stone-50`
- Ícone: `rounded-none border-stone-300`

### Inputs
```
className="border-0 border-b border-stone-300 rounded-none bg-transparent px-0 shadow-none
           focus-visible:ring-0 focus-visible:border-amber-800 font-serif text-base h-11"
```

### Labels de input (padrão dos formulários existentes)
```tsx
<Label className="flex items-baseline gap-3 text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-1">
  <span className="font-serif italic text-amber-800 not-italic normal-case tabular-nums text-xs">I.</span>
  Nome do campo
</Label>
```

### Cards
```
className="border border-stone-200 bg-white p-8"
```

### Badges de status
- ativo: `bg-amber-50 text-amber-800 border border-amber-200`
- inativo: `bg-stone-100 text-stone-600 border border-stone-200`
- transferido: `bg-blue-50 text-blue-700 border border-blue-200`
- falecido / excluido: `bg-stone-200 text-stone-500 border border-stone-300`

---

## 3. COMPONENTES DE LAYOUT EXISTENTES (usar, não recriar)

### `PageHeader` — em `@/components/layout/PageHeader`
```tsx
import { PageHeader, SectionLabel } from "@/components/layout/PageHeader";

// Props:
// chapter: string   → número romano/arábico, ex: "04"
// eyebrow: string   → categoria acima do título, ex: "Ministério · Cadastro"
// title: string     → título principal em font-serif grande
// lede?: string     → subtítulo em itálico editorial
// actions?: ReactNode → botões alinhados à direita do título

<PageHeader
  chapter="04"
  eyebrow="Ministério · Cadastro"
  title="Membresia"
  lede="Registro completo dos membros da igreja."
  actions={<Button>Novo membro</Button>}
/>

// SectionLabel — separador de seção com número e linha
<SectionLabel n="I.">Dados pessoais</SectionLabel>
```

### `AppShell` + `SidebarContent` — em `@/components/layout/AppShell` e `@/components/layout/Sidebar`
Já gerenciam o layout com sidebar. Todas as páginas internas são renderizadas dentro do `AppShell` via o layout `_auth.tsx`.

### `useAuth` — em `@/contexts/AuthContext`
```tsx
const { usuario, token, slug, igreja, loading, login, logout } = useAuth();
// usuario.id, usuario.nome, usuario.email, usuario.perfil (Perfil)
// usuario.igreja_id, usuario.igreja_slug, usuario.igreja_nome (via any cast se necessário)
// igreja.id, igreja.nome, igreja.slug, igreja.cor_primaria, igreja.logo_url
```

### Tipos exportados por `@/lib/api`:
```ts
type Perfil = "superadmin" | "admin" | "lider" | "pastor" | "discipulador";
type Igreja = { id: string; nome: string; slug: string; ativa?: boolean; ... };
type Usuario = { id: string; nome: string; email: string; perfil: Perfil; ... };

function podeEditar(perfil?: Perfil): boolean // true para admin e lider
function ehSuperadmin(perfil?: Perfil): boolean
```

---

## 4. PADRÃO DE ROTAS (TanStack Router com arquivos)

As rotas autenticadas ficam em `src/routes/` com prefixo `_auth.`:

```
src/routes/_auth.convertidos.index.tsx      → /convertidos
src/routes/_auth.convertidos.novo.tsx       → /convertidos/novo
src/routes/_auth.convertidos.$id.index.tsx  → /convertidos/:id
src/routes/_auth.convertidos.$id.editar.tsx → /convertidos/:id/editar
```

Cada arquivo de rota tem esta estrutura exata:
```tsx
import { createFileRoute } from "@tanstack/react-router";
import { NomeDaPage } from "@/paginas/pasta/page";

export const Route = createFileRoute("/_auth/rota/aqui")({
  component: NomeDaPage,
});
```

As páginas reais ficam em `src/paginas/`, separadas dos arquivos de rota.

---

## 5. PADRÃO DE HOOKS (TanStack Query)

Baseie-se no padrão de `src/paginas/discipulado/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Membro = {
  id: string;
  nome: string;
  telefone: string;
  // ... campos
};

export function useMembros(params?: { status?: string; busca?: string; ministerio_id?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.busca) query.set("busca", params.busca);
  if (params?.ministerio_id) query.set("ministerio_id", params.ministerio_id);
  const qs = query.toString();
  return useQuery<Membro[]>({
    queryKey: ["membros", params],
    queryFn: () => api.getMembros(qs ? `?${qs}` : ""),
  });
}
```

---

## 6. PADRÃO DA API (`src/lib/api.ts`) — ADICIONAR FUNÇÕES

**Adicione** estas funções ao objeto `api` existente em `src/lib/api.ts` (não remova nada):

```ts
// ===== MEMBROS =====
getMembros: (qs: string = "") => request(`/membros${qs}`),
getMembro: (id: string) => request(`/membros/${id}`),
getMembrosStats: () => request("/membros/stats"),
getMembrosSemContato: (dias: number = 60) => request(`/membros/sem-contato?dias=${dias}`),
createMembro: (data: unknown) =>
  request("/membros", { method: "POST", body: JSON.stringify(data) }),
updateMembro: (id: string, data: unknown) =>
  request(`/membros/${id}`, { method: "PUT", body: JSON.stringify(data) }),
deleteMembro: (id: string) =>
  request(`/membros/${id}`, { method: "DELETE" }),
viHoje: (id: string) =>
  request(`/membros/${id}/vi-hoje`, { method: "PATCH" }),
enviarWhatsapp: (id: string) =>
  request(`/membros/${id}/whatsapp`, { method: "POST" }),
addMembroMinisterio: (membroId: string, data: { ministerio_id: string; cargo?: string }) =>
  request(`/membros/${membroId}/ministerios`, { method: "POST", body: JSON.stringify(data) }),
removeMembroMinisterio: (membroId: string, ministerioId: string) =>
  request(`/membros/${membroId}/ministerios/${ministerioId}`, { method: "DELETE" }),
addCargo: (membroId: string, data: { cargo: string; data_posse?: string; observacoes?: string }) =>
  request(`/membros/${membroId}/cargos`, { method: "POST", body: JSON.stringify(data) }),
encerrarCargo: (membroId: string, cargoId: string, data: { data_fim?: string }) =>
  request(`/membros/${membroId}/cargos/${cargoId}`, { method: "PATCH", body: JSON.stringify(data) }),

// ===== MINISTÉRIOS =====
getMinisterios: () => request("/ministerios"),
getMinisterio: (id: string) => request(`/ministerios/${id}`),
createMinisterio: (data: unknown) =>
  request("/ministerios", { method: "POST", body: JSON.stringify(data) }),
updateMinisterio: (id: string, data: unknown) =>
  request(`/ministerios/${id}`, { method: "PUT", body: JSON.stringify(data) }),
deleteMinisterio: (id: string) =>
  request(`/ministerios/${id}`, { method: "DELETE" }),

// ===== CADASTRO PÚBLICO DE MEMBRO =====
getIgrejaCadastroMembro: (slug: string) =>
  publicRequest(`/publico/igrejas/${slug}/membros/cadastro`),
cadastroPublicoMembro: (slug: string, data: unknown) =>
  publicRequest(`/publico/igrejas/${slug}/membros/cadastro`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
```

**Adicione também estes tipos ao final do `api.ts`:**

```ts
export type Membro = {
  id: string;
  igreja_id: string;
  convertido_id?: string | null;
  nome: string;
  telefone: string;
  email?: string | null;
  data_nascimento?: string | null;
  genero?: "masculino" | "feminino" | "outro" | null;
  estado_civil?: "solteiro" | "casado" | "divorciado" | "viuvo" | "uniao_estavel" | null;
  profissao?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  data_entrada: string;
  tipo_entrada?: "batismo" | "transferencia" | "aclamacao" | "reconciliacao" | null;
  data_batismo?: string | null;
  batizado: boolean;
  fez_discipulado: boolean;
  conjuge_id?: string | null;
  conjuge_nome_cadastrado?: string | null;
  nome_conjuge?: string | null;
  tem_filhos: boolean;
  qtd_filhos: number;
  ultimo_contato: string;
  dias_sem_contato?: number;
  status: "ativo" | "inativo" | "transferido" | "falecido" | "excluido";
  observacoes?: string | null;
  carta_entrada_origem?: string | null;
  carta_saida_destino?: string | null;
  data_saida?: string | null;
  motivo_saida?: string | null;
  created_at: string;
  updated_at: string;
  ministerios?: MembroMinisterio[];
  cargos?: CargoMembro[];
};

export type MembroMinisterio = {
  id: string;
  cargo?: string | null;
  data_entrada: string;
  ativo: boolean;
  ministerio_id: string;
  ministerio_nome: string;
};

export type CargoMembro = {
  id: string;
  cargo: string;
  data_posse?: string | null;
  data_fim?: string | null;
  ativo: boolean;
  observacoes?: string | null;
  created_at: string;
};

export type Ministerio = {
  id: string;
  igreja_id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  lider_id?: string | null;
  lider_nome?: string | null;
  total_membros?: number;
  membros?: MinisterioMembro[];
};

export type MinisterioMembro = {
  vinculo_id: string;
  cargo?: string | null;
  data_entrada: string;
  ativo: boolean;
  membro_id: string;
  membro_nome: string;
  telefone: string;
  genero?: string | null;
};

export type MembrosStats = {
  total: number;
  ativos: number;
  inativos: number;
  transferidos: number;
  batizados: number;
  fez_discipulado: number;
  por_genero: { genero: string; quantidade: number }[];
  por_ministerio: { ministerio: string; quantidade: number }[];
  sem_contato_60: number;
  sem_contato_90: number;
};
```

---

## 7. SIDEBAR — ADICIONAR SEÇÃO "Membresia"

Arquivo: `src/components/layout/Sidebar.tsx`

No array `sections` existente, adicione uma nova seção **após** a seção "Ministério" e **antes** de "Administração":

```ts
{
  label: "Membresia",
  items: [
    { to: "/membros", label: "Membros", perfis: ["admin", "lider", "pastor", "discipulador"] as const },
    { to: "/ministerios", label: "Ministérios", perfis: ["admin", "lider", "pastor", "discipulador"] as const },
    { to: "/followup-whatsapp", label: "Follow-up", perfis: ["admin", "lider", "pastor"] as const },
  ],
},
```

A contagem no label de seção será incrementada automaticamente pelo `.map((s, idx) => ...)` existente.

---

## 8. `_auth.tsx` — ADICIONAR ROTAS PROTEGIDAS

No arquivo `src/routes/_auth.tsx`, nas constantes de controle de acesso, adicione:

```ts
// Após LEADER_ROUTES:
const MEMBRESIA_ROUTES = ["/membros", "/ministerios", "/followup-whatsapp"];
```

E no `useEffect` de controle de acesso, adicione verificação para `/followup-whatsapp` ser restrito ao menos ao perfil `discipulador`:

```ts
// followup-whatsapp só para admin, lider, pastor
if (
  pathname.startsWith("/followup-whatsapp") &&
  !["admin", "lider", "pastor"].includes(usuario?.perfil ?? "")
) {
  navigate({ to: "/dashboard" });
}
```

---

## 9. ARQUIVOS DE ROTA A CRIAR

Crie estes 8 arquivos em `src/routes/`:

```
src/routes/_auth.membros.index.tsx
src/routes/_auth.membros.novo.tsx
src/routes/_auth.membros.$id.index.tsx
src/routes/_auth.membros.$id.editar.tsx
src/routes/_auth.ministerios.tsx
src/routes/_auth.followup-whatsapp.tsx
src/routes/cadastro-membro.$slug.tsx    ← rota PÚBLICA (sem prefixo _auth)
```

Cada arquivo segue o padrão:

```tsx
// src/routes/_auth.membros.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { MembrosPage } from "@/paginas/membros/page";
export const Route = createFileRoute("/_auth/membros/")({ component: MembrosPage });

// src/routes/_auth.membros.novo.tsx
import { createFileRoute } from "@tanstack/react-router";
import { MembroNovoPage } from "@/paginas/membros/novo/page";
export const Route = createFileRoute("/_auth/membros/novo")({ component: MembroNovoPage });

// src/routes/_auth.membros.$id.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { MembroDetalhe } from "@/paginas/membros/[id]/page";
export const Route = createFileRoute("/_auth/membros/$id/")({ component: MembroDetalhe });

// src/routes/_auth.membros.$id.editar.tsx
import { createFileRoute } from "@tanstack/react-router";
import { MembroEditarPage } from "@/paginas/membros/[id]/editar/page";
export const Route = createFileRoute("/_auth/membros/$id/editar")({ component: MembroEditarPage });

// src/routes/_auth.ministerios.tsx
import { createFileRoute } from "@tanstack/react-router";
import { MinisteriosPage } from "@/paginas/ministerios/page";
export const Route = createFileRoute("/_auth/ministerios")({ component: MinisteriosPage });

// src/routes/_auth.followup-whatsapp.tsx
import { createFileRoute } from "@tanstack/react-router";
import { FollowupWhatsappPage } from "@/paginas/followup-whatsapp/page";
export const Route = createFileRoute("/_auth/followup-whatsapp")({ component: FollowupWhatsappPage });

// src/routes/cadastro-membro.$slug.tsx  (rota pública)
import { createFileRoute } from "@tanstack/react-router";
import { CadastroMembroPublicoPage } from "@/paginas/cadastro-membro/[slug]/page";
export const Route = createFileRoute("/cadastro-membro/$slug")({ component: CadastroMembroPublicoPage });
```

---

## 10. PÁGINA: `/membros` — `src/paginas/membros/page.tsx`

### Hooks — `src/paginas/membros/hooks.ts`

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Membro, type MembrosStats } from "@/lib/api";

export function useMembros(params?: { status?: string; busca?: string; ministerio_id?: string }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "__todos") query.set("status", params.status);
  if (params?.busca && params.busca.trim()) query.set("busca", params.busca.trim());
  if (params?.ministerio_id && params.ministerio_id !== "__todos") query.set("ministerio_id", params.ministerio_id);
  const qs = query.toString();
  return useQuery<Membro[]>({
    queryKey: ["membros", params],
    queryFn: () => api.getMembros(qs ? `?${qs}` : ""),
  });
}

export function useMembro(id: string) {
  return useQuery<Membro>({
    queryKey: ["membros", id],
    queryFn: () => api.getMembro(id),
    enabled: !!id,
  });
}

export function useMembrosStats() {
  return useQuery<MembrosStats>({
    queryKey: ["membros-stats"],
    queryFn: () => api.getMembrosStats(),
  });
}

export function useMembrosSemContato(dias: number = 60) {
  return useQuery<Membro[]>({
    queryKey: ["membros-sem-contato", dias],
    queryFn: () => api.getMembrosSemContato(dias),
  });
}

export function useCriarMembro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Membro>) => api.createMembro(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros"] }),
  });
}

export function useEditarMembro(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Membro>) => api.updateMembro(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membros"] });
      qc.invalidateQueries({ queryKey: ["membros", id] });
    },
  });
}

export function useExcluirMembro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMembro(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros"] }),
  });
}

export function useViHoje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.viHoje(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["membros"] });
      qc.invalidateQueries({ queryKey: ["membros", id] });
      qc.invalidateQueries({ queryKey: ["membros-sem-contato"] });
    },
  });
}

export function useEnviarWhatsapp() {
  return useMutation({
    mutationFn: (id: string) => api.enviarWhatsapp(id),
  });
}

export function useAddMembroMinisterio(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ministerio_id: string; cargo?: string }) =>
      api.addMembroMinisterio(membroId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros", membroId] }),
  });
}

export function useRemoveMembroMinisterio(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ministerioId: string) => api.removeMembroMinisterio(membroId, ministerioId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros", membroId] }),
  });
}

export function useAddCargo(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { cargo: string; data_posse?: string; observacoes?: string }) =>
      api.addCargo(membroId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros", membroId] }),
  });
}

export function useEncerrarCargo(membroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cargoId, data }: { cargoId: string; data: { data_fim?: string } }) =>
      api.encerrarCargo(membroId, cargoId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membros", membroId] }),
  });
}
```

### Página de Lista — `src/paginas/membros/page.tsx`

```tsx
export function MembrosPage() { ... }
```

**Layout:**
```
PageHeader (chapter="04", eyebrow="Pastoral · Cadastro", title="Membros", lede="Registro formal da membresia da igreja.")
  actions: <Button className="...">+ Novo membro</Button> (navega para /membros/novo, visível para admin/lider)

[Linha de filtros — print:hidden]
  - Input de busca (ícone Search, placeholder "Buscar por nome ou telefone")
  - Select status: "__todos" | "ativo" | "inativo" | "transferido"
  - Select ministério: "__todos" + lista de ministérios (usar api.getMinisterios())

[Tabela responsiva]
  Colunas: Nome | Telefone | Entrada | Último contato | Ministérios | Status | Ações
  
  Linha de tabela:
  - Nome: <Link to="/membros/$id"> com nome em font-serif
  - Telefone: texto simples
  - Entrada: data_entrada formatada (dd/MM/yyyy)
  - Último contato: 
      * Se dias_sem_contato <= 60: data formatada, texto normal
      * Se dias_sem_contato > 60 e <= 90: Badge âmbar "X dias"
      * Se dias_sem_contato > 90: Badge vermelho "X dias — urgente"
  - Ministérios: pills com nomes (max 2, "+N" se mais)
  - Status: Badge por status
  - Ações:
      * Ícone Eye → /membros/:id
      * Ícone Pencil → /membros/:id/editar (admin/lider)
      * Ícone Trash2 com confirm() → excluir (admin only)

[Loading]
  <Loader2 className="h-6 w-6 animate-spin mx-auto my-16 text-stone-400" />

[Vazio]
  Texto editorial: "Nenhum membro encontrado — tente ajustar os filtros."
```

---

## 11. PÁGINA: `/membros/novo` — `src/paginas/membros/novo/page.tsx`

```tsx
export function MembroNovoPage() { ... }
```

**Formulário em 5 seções (usar SectionLabel para cada uma):**

Wrapper: `<form onSubmit={...} className="space-y-12 max-w-3xl">`

**Seção I — Dados pessoais**
- Nome `*` (required)
- Telefone `*` (required)  
- E-mail
- Data de nascimento
- Gênero: Select com opções `""` (não informar), `"masculino"` (Masculino), `"feminino"` (Feminino), `"outro"` (Outro)
- Estado civil: Select com `""`, `"solteiro"`, `"casado"`, `"divorciado"`, `"viuvo"`, `"uniao_estavel"`
- Profissão

**Seção II — Endereço**
- Endereço
- Bairro
- Cidade
- Estado (UF)

**Seção III — Dados eclesiásticos**
- Data de entrada `*` (input date, default: hoje)
- Tipo de entrada: Select `""`, `"batismo"`, `"transferencia"`, `"aclamacao"`, `"reconciliacao"`
- Data do batismo: aparece sempre (mas fica opcional)
- Batizado: Checkbox
- Fez discipulado: Checkbox
- Convertido vinculado (opcional): Select carregando `api.getConvertidos()`. Exibir nome + telefone. Label: "Convertido de origem"

**Seção IV — Família**
- Tem filhos: Checkbox
- Quantidade de filhos: Input number (aparece se `tem_filhos = true`)
- Nome do cônjuge (campo texto simples, para quando cônjuge não é membro)

**Seção V — Observações**
- Textarea

**Botões no rodapé:**
```tsx
<div className="flex gap-3 pt-4 border-t border-stone-200">
  <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-none">
    Cancelar
  </Button>
  <Button type="submit" disabled={loading} className="rounded-none bg-stone-900 hover:bg-amber-800">
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
    Salvar membro
  </Button>
</div>
```

**Ao submeter:**
1. Chama `useCriarMembro().mutateAsync(dados)`
2. `toast.success("Membro cadastrado!")`
3. Navega para `/membros/${novoMembro.id}`

**Em caso de erro:**
```tsx
toast.error(err instanceof Error ? err.message : "Erro ao cadastrar membro")
```

---

## 12. PÁGINA: `/membros/:id` — `src/paginas/membros/[id]/page.tsx`

Para acessar o parâmetro de rota:
```tsx
import { useParams } from "@tanstack/react-router";
const { id } = useParams({ from: "/_auth/membros/$id/" });
```

```tsx
export function MembroDetalhe() { ... }
```

**Header da página:**
```
[Nome do membro em font-serif text-4xl sm:text-5xl]
[Badge de status]
[Dias sem contato — se > 60: alerta vermelho com ícone AlertTriangle]

[Linha de botões:]
  - "Vi hoje" — BOTÃO ÂMBAR GRANDE — bg-amber-800 hover:bg-amber-900 text-white
    Ao clicar: chama useViHoje(), toast.success("Presença registrada! ✓")
  - "Enviar WhatsApp" — outline, ícone MessageCircle
    Ao clicar: abre <WhatsappModal />
  - "Editar" — outline, ícone Pencil
    Visível apenas para admin/lider — navega /membros/:id/editar
```

**Layout em grade lg:grid-cols-3:**

**Coluna esquerda (col-span-1):**
```
Card "Contato":
  - Foto circular com inicial: div h-20 w-20 bg-amber-100 text-amber-800 font-serif text-3xl
  - Telefone: <a href="tel:{telefone}">{telefone}</a> (ícone Phone)
  - E-mail: <a href="mailto:{email}">{email}</a> (ícone Mail)
  - Data de nascimento + (idade em anos)
  - Estado civil (formatado: "Casado", "Solteiro", etc.)
  - Profissão
  - Cidade/Estado

Card "Vínculo pastoral":
  - Último contato: "{data}" — "há X dias" (se > 60: texto vermelho)
  - Convertido de origem: link para /convertidos/:id (se convertido_id preenchido)
  - Status com badge
```

**Coluna direita (col-span-2):**

Organizar em abas (Tabs do shadcn/ui) ou seções colapsáveis:

**Aba "Dados eclesiásticos":**
```
- Data de entrada: {data formatada} via {tipo_entrada formatado}
- Batizado: Sim (data) / Não
- Fez discipulado: Sim / Não
- Carta de entrada: {carta_entrada_origem} (se preenchido)
```

**Aba "Ministérios":**
```
- Lista de membro.ministerios (filtro: ativo primeiro, depois inativos)
  Cada item: pill com nome + cargo + badge ativo/inativo
  Botão "×" para remover (admin/lider) — chama useRemoveMembroMinisterio

- Botão "+ Adicionar a ministério" (admin/lider):
  Abre <Dialog>:
    Select de ministérios (api.getMinisterios() — apenas ativos)
    Input de cargo (opcional)
    Botão Salvar → useAddMembroMinisterio().mutateAsync()
```

**Aba "Cargos eclesiásticos":**
```
- Lista de membro.cargos:
  Cada item: cargo + data posse + badge ativo/encerrado
  Botão "Encerrar" para cargos ativos (admin/lider) → useEncerrarCargo()

- Botão "+ Adicionar cargo" (admin/lider):
  Abre <Dialog>:
    Input texto "Cargo" (ex: Diácono, Presbítero, Pastor)
    Input date "Data de posse"
    Botão Salvar → useAddCargo().mutateAsync()
```

**Aba "Família":**
```
- Cônjuge: nome_conjuge ou conjuge_nome_cadastrado
- Filhos: tem_filhos + qtd_filhos
```

**Aba "Transferência"** (só aparece se `status === 'transferido'`):
```
- Igreja de destino: carta_saida_destino
- Data de saída: data_saida
- Motivo: motivo_saida
```

---

### Modal WhatsApp — `<WhatsappModal>`

Criar como componente local na mesma pasta:

```tsx
type Props = {
  open: boolean;
  onClose: () => void;
  membro: Membro;
};
```

**Conteúdo do modal:**
```
Título: "Enviar follow-up pastoral"

Informações:
  "Para: {membro.nome}"
  "Número: {membro.telefone}"
  "Último contato: há {dias_sem_contato} dias"
  
Template que será enviado:
  - Se dias_sem_contato < 60: label "Mensagem de contato"
  - Se dias_sem_contato >= 60: label "Mensagem de saudade"
  
Preview da mensagem em blockquote:
  <blockquote className="border-l-2 border-amber-400 pl-4 py-2 bg-amber-50 font-serif italic text-stone-700">
    {template}
  </blockquote>

Aviso (texto xs):
  "A mensagem será enviada via WhatsApp para o número cadastrado."

Botões:
  Cancelar | Confirmar envio (bg-amber-800)
```

**Ao confirmar:**
1. `useEnviarWhatsapp().mutateAsync(membro.id)`
2. Se `res.sucesso === true`: `toast.success("Mensagem enviada com sucesso!")`
3. Se `res.sucesso === false`: `toast.error(res.aviso || "Erro ao enviar")`
4. Fecha o modal

**Templates exibidos no preview:**

Ativo (< 60 dias):
```
Olá, {nome}! 😊

Passando pra dar um oi e saber como você está.

Que Deus continue te abençoando! 🙏
— Igreja do Nazareno
```

Inativo (≥ 60 dias):
```
Olá, {nome}! 😊

A gente sente sua falta por aqui! 💛

Como você está? Estamos com saudade e pensando em você.

Que Deus te abençoe! 🙏
— Igreja do Nazareno
```

---

## 13. PÁGINA: `/membros/:id/editar` — `src/paginas/membros/[id]/editar/page.tsx`

```tsx
export function MembroEditarPage() { ... }
```

Mesmo formulário do `/membros/novo`, porém:
1. Carrega os dados com `useMembro(id)` e preenche todos os campos via `defaultValues`
2. Adiciona uma **Seção VI — Status e transferência**:

```
Status: Select com todas as opções (ativo, inativo, transferido, falecido, excluido)

Se status === "transferido", exibir:
  - Igreja de destino (carta_saida_destino)
  - Data de saída
  - Motivo da saída

Carta de entrada:
  - Igreja de origem (carta_entrada_origem) — só se tipo_entrada = "transferencia"
```

**Ao submeter:**
1. `useEditarMembro(id).mutateAsync(dados)`
2. `toast.success("Membro atualizado!")`
3. Navega para `/membros/${id}`

---

## 14. HOOKS DE MINISTÉRIOS — `src/paginas/ministerios/hooks.ts`

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Ministerio } from "@/lib/api";

export function useMinisterios() {
  return useQuery<Ministerio[]>({
    queryKey: ["ministerios"],
    queryFn: () => api.getMinisterios(),
  });
}

export function useMinisterio(id: string) {
  return useQuery<Ministerio>({
    queryKey: ["ministerios", id],
    queryFn: () => api.getMinisterio(id),
    enabled: !!id,
  });
}

export function useCriarMinisterio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Ministerio>) => api.createMinisterio(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ministerios"] }),
  });
}

export function useEditarMinisterio(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Ministerio>) => api.updateMinisterio(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ministerios"] });
      qc.invalidateQueries({ queryKey: ["ministerios", id] });
    },
  });
}

export function useExcluirMinisterio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMinisterio(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ministerios"] }),
  });
}
```

---

## 15. PÁGINA: `/ministerios` — `src/paginas/ministerios/page.tsx`

```tsx
export function MinisteriosPage() { ... }
```

**Layout:**
```
PageHeader (chapter="05", eyebrow="Ministério · Organização", title="Ministérios",
            lede="Os grupos de serviço e atuação da casa.")
  actions: <Button>+ Novo ministério</Button> (admin/lider)

[Grid de cards: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4]

Card de ministério:
  Borda esquerda: border-l-4 border-amber-700
  
  [Topo do card]
    Nome em font-serif text-xl
    Badge: ativo (âmbar) | inativo (cinza)
  
  [Meio]
    Líder: {lider_nome ?? "Sem líder definido"} (ícone User)
    Membros: {total_membros} membro(s) (ícone Users)
  
  [Rodapé]
    Botão "Ver membros" → abre modal de detalhe
    Botão ícone Pencil → abre modal de edição (admin/lider)
    Botão ícone Trash2 → confirmar e excluir (admin/lider)

[Estado vazio]
  Texto: "Nenhum ministério cadastrado ainda."
  Botão: "Criar primeiro ministério" (admin/lider)
```

**Modal "Ver ministério" (`<MinisterioDetalheModal>`):**
```
Título: {ministerio.nome}
Líder: {lider_nome}

Lista de membros ativos:
  Cada linha: avatar (inicial), nome, cargo, telefone
  Ícone para remover (admin/lider)

Botão "Fechar"
```

**Modal "Criar/Editar ministério" (`<MinisterioFormModal>`):**
```
Título: "Novo ministério" / "Editar ministério"

Campos:
  - Nome* 
  - Descrição (textarea)
  - Líder: Select de membros ativos da igreja (api.getMembros("?status=ativo"))

Botões: Cancelar | Salvar
```

---

## 16. PÁGINA: `/followup-whatsapp` — `src/paginas/followup-whatsapp/page.tsx`

```tsx
export function FollowupWhatsappPage() { ... }
```

**Hooks:**
```ts
const { data: urgentes } = useMembrosSemContato(90);   // > 90 dias
const { data: atencao } = useMembrosSemContato(60);    // > 60 dias (inclui os urgentes)

// Filtrar apenas entre 60 e 90 dias:
const somenteAtencao = (atencao ?? []).filter((m) => (m.dias_sem_contato ?? 0) <= 90);
```

**Layout:**
```
PageHeader (chapter="06", eyebrow="Pastoral · Cuidado", title="Follow-up",
            lede="Membros que estão precisando de contato pastoral.")

[Linha de KPIs]
  Card: "{urgentes.length} membros — mais de 90 dias" (vermelho/âmbar)
  Card: "{somenteAtencao.length} membros — entre 60 e 90 dias" (âmbar claro)

[Seção I — Urgente: sem contato há mais de 90 dias]
  label vermelho: border-l-4 border-red-400
  
  Lista de cards horizontais por membro:
    - Nome (font-serif)
    - "Sem contato há {dias_sem_contato} dias" (vermelho, bold se > 90)
    - Telefone
    - Dois botões:
        [Vi hoje]         → useViHoje().mutate(membro.id) + toast
        [Enviar WhatsApp] → abre WhatsappModal para este membro

[Seção II — Atenção: entre 60 e 90 dias]
  label âmbar: border-l-4 border-amber-400
  Mesmo formato da lista acima

[Botão "Disparar follow-up para todos os urgentes"] (admin only)
  bg-red-700 hover:bg-red-800 rounded-none
  Ao clicar: abre <Dialog> de confirmação:
    "Você está prestes a enviar WhatsApp para {urgentes.length} membros
     sem contato há mais de 90 dias. Confirmar?"
  Ao confirmar:
    Dispara para cada membro urgente em sequência
    Exibe progresso: "Enviando X de Y..."
    Ao terminar: toast.success("Follow-up concluído: X enviados, Y erros")
```

---

## 17. PÁGINA PÚBLICA: `/cadastro-membro/:slug` — `src/paginas/cadastro-membro/[slug]/page.tsx`

Rota pública (sem autenticação). Para acessar o parâmetro:
```tsx
import { useParams } from "@tanstack/react-router";
const { slug } = useParams({ from: "/cadastro-membro/$slug" });
```

**Hooks:**
```ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function useIgrejaPublicaMembro(slug: string) {
  return useQuery({
    queryKey: ["igreja-publica-membro", slug],
    queryFn: () => api.getIgrejaCadastroMembro(slug),
    enabled: !!slug,
  });
}

function useCadastroPublicoMembro(slug: string) {
  return useMutation({
    mutationFn: (data: unknown) => api.cadastroPublicoMembro(slug, data),
  });
}
```

**Layout (sem sidebar, tela cheia):**
```
Fundo: bg-[#faf7f2] min-h-screen

Coluna centralizada: max-w-lg mx-auto px-6 py-12

[Cabeçalho]
  Logo da igreja (se logo_url) ou avatar com inicial do nome
  Nome da igreja em font-serif text-3xl
  Subtítulo: "Cadastre-se na nossa membresia"
  Cidade/Estado da igreja

[Formulário]
  Título seção: "Seus dados"
  
  Campos (mesmo padrão visual dos outros formulários):
    - Nome* (obrigatório)
    - Telefone* (obrigatório, tipo "tel")
    - E-mail
    - Data de nascimento
    - Gênero: Select
  
  Botão submit:
    className="w-full h-14 rounded-none bg-stone-900 text-amber-50 hover:bg-amber-800"
    Texto: "Solicitar cadastro"

[Tela de sucesso] (substitui o formulário após envio bem-sucedido)
  Ícone grande: ✓ (CheckCircle2, h-16 w-16 text-amber-700)
  Título: "Bem-vindo à membresia!" (font-serif text-3xl)
  Texto: "Seu cadastro foi recebido. Em breve entraremos em contato por telefone."
  Subtext: "Que Deus abençoe cada passo da sua jornada." (font-serif italic)
```

**Loading da página:**
```
Se isLoading da igreja: spinner centralizado
Se isError: "Igreja não encontrada."
```

---

## 18. FORMATADORES UTILITÁRIOS

Crie ou adicione ao arquivo `src/lib/utils.ts` (se não existir, criar):

```ts
// Formatar data BR: "2024-03-15" → "15/03/2024"
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

// Calcular idade
export function calcularIdade(dataNascStr?: string | null): number | null {
  if (!dataNascStr) return null;
  const nasc = new Date(dataNascStr);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

// Formatar tipo de entrada
export function formatTipoEntrada(tipo?: string | null): string {
  const mapa: Record<string, string> = {
    batismo: "Batismo",
    transferencia: "Transferência",
    aclamacao: "Aclamação",
    reconciliacao: "Reconciliação",
  };
  return tipo ? (mapa[tipo] ?? tipo) : "—";
}

// Formatar estado civil
export function formatEstadoCivil(ec?: string | null): string {
  const mapa: Record<string, string> = {
    solteiro: "Solteiro(a)",
    casado: "Casado(a)",
    divorciado: "Divorciado(a)",
    viuvo: "Viúvo(a)",
    uniao_estavel: "União estável",
  };
  return ec ? (mapa[ec] ?? ec) : "—";
}

// Formatar gênero
export function formatGenero(g?: string | null): string {
  return g === "masculino" ? "Masculino" : g === "feminino" ? "Feminino" : g === "outro" ? "Outro" : "Não informado";
}
```

---

## 19. CHECKLIST FINAL

Antes de entregar, verifique:

- [ ] `src/lib/api.ts` — funções de membros, ministérios e cadastro público de membro adicionadas (sem remover as existentes)
- [ ] `src/lib/api.ts` — tipos `Membro`, `MembroMinisterio`, `CargoMembro`, `Ministerio`, `MinisterioMembro`, `MembrosStats` adicionados
- [ ] `src/components/layout/Sidebar.tsx` — seção "Membresia" adicionada com 3 itens
- [ ] `src/routes/_auth.tsx` — restrição de `/followup-whatsapp` adicionada
- [ ] 7 arquivos de rota criados em `src/routes/`
- [ ] `src/paginas/membros/hooks.ts` criado com todos os hooks
- [ ] `src/paginas/membros/page.tsx` — lista com filtros, tabela, badges de contato
- [ ] `src/paginas/membros/novo/page.tsx` — formulário em 5 seções
- [ ] `src/paginas/membros/[id]/page.tsx` — perfil com botão "Vi hoje", abas, modal WhatsApp
- [ ] `src/paginas/membros/[id]/editar/page.tsx` — formulário pré-preenchido com seção de status/transferência
- [ ] `src/paginas/ministerios/hooks.ts` criado
- [ ] `src/paginas/ministerios/page.tsx` — grid de cards, modal detalhe, modal form
- [ ] `src/paginas/followup-whatsapp/page.tsx` — duas seções (urgente/atenção), botão de disparo em massa
- [ ] `src/paginas/cadastro-membro/[slug]/page.tsx` — página pública com tela de sucesso
- [ ] Formatadores adicionados em `src/lib/utils.ts`
- [ ] Nenhum arquivo existente foi removido ou teve suas rotas/lógica existente apagada
- [ ] Padrão visual seguido: `rounded-none`, `font-serif`, cores âmbar/pedra, `border-stone-*`
- [ ] Loading states em todas as páginas
- [ ] Toasts de sucesso e erro em todas as mutações

Entregue cada arquivo completo, do início ao fim, sem omitir nenhuma linha.
