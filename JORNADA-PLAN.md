# Plano: Alinhamento com documento "A Jornada do Discípulo"

**Origem:** PDF enviado pela liderança da igreja
**Responsável execução:** Gemini / Antigravity IDE (ideeskgrafica@gmail.com)
**Responsável estratégia:** Claude (sou.nonato@live.com)

---

## Resumo das 4 alterações

1. Renomear o sistema para "A Jornada do Discípulo"
2. Adicionar campo "Já fez discipulado?" no formulário
3. Renomear "Observações" para "Pedido de oração"
4. Ajustar labels dos filtros da tela de Discipulado

---

## Alteração 1 — Renomear o sistema

**Onde mudar:**

### `src/components/layout/Sidebar.tsx`
Localizar:
```
<p className="text-sm font-bold ...">Membresia</p>
<p className="text-xs ...">Sistema da Igreja</p>
```
Substituir por:
```
<p className="text-sm font-bold ...">A Jornada do</p>
<p className="text-xs font-semibold text-amber-700">Discípulo</p>
```

### `src/pages/Login.tsx`
Localizar o título principal da tela de login (h1 ou texto com "Membresia").
Substituir por: **"A Jornada do Discípulo"**
Subtítulo manter: "Acompanhamento de novos convertidos"

### `index.html` (raiz do projeto)
Localizar a tag `<title>` e mudar para:
```html
<title>A Jornada do Discípulo</title>
```

---

## Alteração 2 — Campo "Já fez discipulado?"

Adicionar em **dois arquivos**: formulário interno e formulário público.

### `src/pages/NovoConvertido.tsx`

**Onde inserir:** dentro da seção de Informações de Fé (mesma área onde está "Batizado nas águas?" e "Já frequentou alguma igreja?").

Localizar o bloco dos checkboxes de fé (batizado, quer_batismo, ja_frequentava_igreja) e adicionar um quarto checkbox logo após:

```tsx
<label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 cursor-pointer hover:border-amber-300 transition-colors">
  <input type="checkbox" {...register('ja_fez_discipulado')} className="w-4 h-4 accent-amber-700 rounded" />
  <span className="text-sm text-stone-700">Já fez discipulado</span>
</label>
```

Adicionar ao schema zod (localizar `z.object({`):
```ts
ja_fez_discipulado: z.boolean(),
```

Adicionar ao `defaultValues`:
```ts
ja_fez_discipulado: false,
```

### `src/pages/FormularioPublico.tsx`

Mesma mudança: adicionar ao schema, defaultValues e ao JSX no mesmo bloco de checkboxes de fé.

### `src/types/index.ts`

Localizar a interface `NovoConvertido` e adicionar:
```ts
ja_fez_discipulado: boolean
```

### `database/migration_002.sql` (criar arquivo novo)

```sql
-- Migration 002: campo ja_fez_discipulado
ALTER TABLE novos_convertidos
  ADD COLUMN IF NOT EXISTS ja_fez_discipulado BOOLEAN DEFAULT FALSE;
```

---

## Alteração 3 — Renomear "Observações" para "Pedido de oração"

### `src/pages/NovoConvertido.tsx`

Localizar:
```tsx
label="Conta um pouquinho sobre você (opcional)"
placeholder="Como foi sua experiência..."
{...register('observacoes')}
```
Substituir label e placeholder por:
```
label="Pedido de oração (opcional)"
placeholder="Deixe aqui seu pedido de oração..."
```

### `src/pages/FormularioPublico.tsx`

Mesma substituição de label e placeholder para "Pedido de oração".

### `src/pages/ConvertidoDetalhe.tsx`

Localizar onde o campo `observacoes` é exibido no detalhe do convertido.
Mudar o label/título de exibição de "Observações" para "Pedido de oração".

---

## Alteração 4 — Labels dos filtros na tela de Discipulado

### `src/pages/Discipulado.tsx`

Localizar o array de filtros:
```ts
{ value: '', label: 'Todos' },
{ value: 'ativo', label: 'Ativos' },
{ value: 'encerrado', label: 'Encerrados' },
{ value: 'pausado', label: 'Pausados' },
```

Substituir por:
```ts
{ value: '', label: 'Todos' },
{ value: 'ativo', label: 'Em andamento' },
{ value: 'encerrado', label: 'Concluídos' },
{ value: 'pausado', label: 'Descontinuado' },
```

> Os valores (`value`) não mudam — só os labels visuais. O banco continua com os mesmos status.

---

## Checklist de execução

- [ ] `index.html` — atualizar `<title>`
- [ ] `src/components/layout/Sidebar.tsx` — renomear sistema
- [ ] `src/pages/Login.tsx` — renomear sistema
- [ ] `src/types/index.ts` — adicionar `ja_fez_discipulado: boolean`
- [ ] `src/pages/NovoConvertido.tsx` — campo discipulado + renomear observações
- [ ] `src/pages/FormularioPublico.tsx` — campo discipulado + renomear observações
- [ ] `src/pages/ConvertidoDetalhe.tsx` — renomear label observações
- [ ] `src/pages/Discipulado.tsx` — ajustar labels dos filtros
- [ ] Criar `database/migration_002.sql`
- [ ] `npm run build` — zero erros
- [ ] `git add -A && git commit -m "feat: alinhamento com documento A Jornada do Discípulo"`
- [ ] `git push origin main`
- [ ] `vercel --prod --yes`
