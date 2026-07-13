# Gemini — Login global `/login` (sem slug)

## Contexto

O sistema tem login por slug: o cliente acessa `/{slug}/login`, digita email + senha.
O problema: o cliente precisa saber e lembrar o slug da igreja pra acessar o sistema.

A solução é um login global em `/login` onde o cliente digita só email + senha.
O backend **já está pronto** — ele busca o usuário por email (`WHERE u.email = $1`) e retorna
`igreja_slug` e `cor_primaria` no payload. Nenhuma mudança de backend é necessária.

---

## O que já existe (não mexer)

- `backend/src/rotas/autenticacao.js` — POST `/api/autenticacao/login` já funciona só com email + senha e retorna `igreja_slug` na resposta
- `frontend v4/src/routes/$slug.login.tsx` — página de login por slug (mantém funcionando)
- `frontend v4/src/contexts/AuthContext.tsx` — contexto de autenticação

---

## O que o Gemini deve criar/alterar

### 1. `frontend v4/src/lib/api.ts` — tornar `slug` opcional no login

Função atual:
```ts
login: (email: string, senha: string, slug: string) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha, slug }),
  }),
```

Alterar para:
```ts
login: (email: string, senha: string, slug?: string) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha, ...(slug ? { slug } : {}) }),
  }),
```

---

### 2. `frontend v4/src/contexts/AuthContext.tsx` — aceitar login sem slug

Função atual recebe `slug` como parâmetro obrigatório e armazena no localStorage.

Alterar para:
- `slug` vira opcional: `login(email: string, senha: string, slug?: string)`
- Se não vier slug no parâmetro, usar `res.usuario.igreja_slug` (já vem na resposta da API)
- O restante do fluxo permanece igual

Trecho atual relevante:
```ts
async function login(email: string, senha: string, slugIgreja: string) {
  const res = await api.login(email, senha, slugIgreja);
  // ...
  localStorage.setItem("slug", slugIgreja);
  setSlug(slugIgreja);
}
```

Alterar para:
```ts
async function login(email: string, senha: string, slugIgreja?: string) {
  const res = await api.login(email, senha, slugIgreja);
  const slugFinal = slugIgreja ?? res.usuario.igreja_slug ?? "";
  // ...
  localStorage.setItem("slug", slugFinal);
  setSlug(slugFinal);
}
```

Também atualizar o tipo no contexto:
```ts
login: (email: string, senha: string, slug?: string) => Promise<void>;
```

---

### 3. `frontend v4/src/routes/login.tsx` — nova rota global

```tsx
import { createFileRoute } from "@tanstack/react-router";
import LoginGlobalPage from "@/paginas/login-global/page";

export const Route = createFileRoute("/login")({
  component: LoginGlobalPage,
});
```

---

### 4. `frontend v4/src/paginas/login-global/page.tsx` — página de login global

Página simples, sem identidade da igreja (ainda não sabemos qual é).
Visual: logo/nome "Ovile" centralizado, campos email + senha, botão entrar.

```tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginGlobalPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await login(email, senha); // sem slug — backend detecta a igreja pelo email
      toast.success("Bem-vindo!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao entrar";
      setErro(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-content-center bg-secondary px-4">
      <Card className="w-full max-w-md rounded-2xl border-border/60 shadow-sm">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Ovile</h1>
            <p className="text-sm text-muted-foreground">Sistema de gestão da sua igreja</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@igreja.org"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-xl">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 5. `frontend v4/src/routeTree.gen.ts` — registrar a nova rota

Adicionar a rota `/login` no `routeTree.gen.ts`.

**Atenção:** o TanStack Router usa geração automática de rotas via arquivo físico.
Após criar `routes/login.tsx`, rodar `npm run build` ou o dev server já atualiza o `routeTree.gen.ts` automaticamente.

Se precisar adicionar manualmente, adicionar no objeto `routeTree` junto com as outras rotas de nível raiz.

---

## Resumo das mudanças

| Arquivo | Ação |
|---|---|
| `frontend v4/src/lib/api.ts` | `slug` vira opcional no `login` |
| `frontend v4/src/contexts/AuthContext.tsx` | `login` aceita slug opcional, usa `res.usuario.igreja_slug` como fallback |
| `frontend v4/src/routes/login.tsx` | CRIAR — rota `/login` |
| `frontend v4/src/paginas/login-global/page.tsx` | CRIAR — página de login sem slug |
| `frontend v4/src/routeTree.gen.ts` | Registrar nova rota (automático pelo dev server) |

## O que NÃO mexer

- `$slug.login.tsx` — continua igual, ainda funciona para links diretos por slug
- Backend — nenhuma alteração necessária
- `AuthContext` — só o `login` muda, o restante fica igual

## Teste esperado

1. Acessar `http://localhost:5175/login`
2. Digitar email + senha de um usuário existente
3. Sistema detecta a igreja, aplica branding e redireciona para `/dashboard`
