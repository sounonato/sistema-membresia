# UI Review — Sistema Membresia

**Audited:** 2026-06-06
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md)
**Screenshots:** Not captured — dev server not detected on ports 5175, 3000, 5173, 8080

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | "Categoria" mislabels a gender/age field; generic "Salvar"/"Cancelar" buttons; destructive actions have zero copy |
| 2. Visuals | 2/4 | No aria-labels on any icon-only interactive elements; Trash2 and LogOut buttons are keyboard/screen-reader blind |
| 3. Color | 3/4 | Hardcoded hex values in all 3 charts bypass the design token system; accent distribution is otherwise disciplined |
| 4. Typography | 3/4 | 6 font sizes and 3 weights — one size step too wide, one weight tier redundant |
| 5. Spacing | 3/4 | Two arbitrary pixel grid-cols values in Convertidos; spacing scale is otherwise consistent |
| 6. Experience Design | 2/4 | Destructive actions (Trash2 remove-member, module delete) have no confirmation dialog; mutation errors silently swallowed |

**Overall: 15/24**

---

## Top 3 Priority Fixes

1. **No confirmation for destructive actions** — Users accidentally remove group members or delete modules with a single tap; on mobile the Trash2 target is only 13px. Fix: wrap `removeMembro.mutate` and `remove.mutate` in a confirmation Dialog (reuse the existing Dialog primitive) before executing. — `GrupoDetalhe.tsx:227`, `Modulos.tsx:139`

2. **Zero aria-labels on icon-only interactive buttons** — The LogOut button in Sidebar, the Trash2 remove-member button in GrupoDetalhe, the Edit/Trash2 pair in Modulos, and the ArrowLeft back-navigation buttons are all icon-only with no accessible name. Screen readers announce them as "button" only. Fix: add `aria-label="Remover membro"`, `aria-label="Sair"`, etc. to every icon-only `<button>`. — `Sidebar.tsx:71`, `GrupoDetalhe.tsx:226`, `Modulos.tsx:133-141`, `ConvertidoDetalhe.tsx:98`, `NovoConvertido.tsx:98`, `GrupoDetalhe.tsx:144`

3. **Mutation errors silently swallowed in dialogs** — `createGrupo`, `addMembro`, `toggleAtivo`, `toggleAula`, and `create` (Discipuladores) mutations have `onSuccess` but no `onError`. When the Supabase call fails, the dialog stays open and the user sees nothing. Fix: add `onError: (err) => setServerError(err.message)` to each mutation and render the error inside the dialog form. — `Discipulado.tsx:88`, `GrupoDetalhe.tsx:86`, `Discipuladores.tsx:46`, `GrupoDetalhe.tsx:111`

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

**WARNING — Mislabeled field "Categoria" for a gender/age selector**
- `NovoConvertido.tsx:154` and `FormularioPublico.tsx:143` use `label="Categoria"` for a field that stores `genero` with values `masculino`, `feminino`, `jovem`, `adolescente`. The label "Categoria" is ambiguous — users don't know what kind of category is expected. The field should be labeled "Gênero / Faixa" or the field should be split into separate gender and age-group selectors. This also creates a semantic mismatch: the chart at `GeneroChart.tsx:56` labels it "Distribuição por Categoria" which matches, but the underlying column is `genero`, creating confusion.

**WARNING — Generic button labels in dialogs**
- `ConvertidoDetalhe.tsx:249`, `Discipulado.tsx:237`, `GrupoDetalhe.tsx:308`: "Cancelar" and "Salvar"/"Adicionar"/"Criar Grupo" are acceptable in Portuguese context, but "Salvar" (used 3 times in dialogs) is detached from the action. Prefer "Alterar Status", "Adicionar ao Grupo", "Criar Grupo" as primary CTA labels — the dialog title already says what the action is, so the button should confirm it, not repeat "Salvar".
- `Modulos.tsx:164`: The primary CTA switches between "Salvar" (edit mode) and "Criar Módulo" (create mode) — this is a positive pattern; extend it to ConvertidoDetalhe where the status-change button just says "Salvar".

**WARNING — Destructive actions have no copy or warning**
- `GrupoDetalhe.tsx:227`: Trash2 button removes a member with zero user-facing label or confirmation. The text on the surrounding row does not indicate the action is destructive.
- `Modulos.tsx:139`: Module delete is an icon button with no label and no "are you sure?" copy.

**POSITIVE** — Empty states are contextual and specific throughout (`DashboardLider.tsx:97-99`, `Discipulado.tsx:153-155`, `DashboardDiscipulador.tsx:184-186`). Error copy in Login and NovoConvertido is precise ("E-mail ou senha incorretos", "Erro ao salvar. Tente novamente.").

---

### Pillar 2: Visuals (2/4)

**BLOCKER — No aria-labels on any icon-only interactive element**

Zero occurrences of `aria-label` found across the entire `src/` tree. Every icon-only button is inaccessible:

| Element | File | Issue |
|---------|------|-------|
| LogOut button | `Sidebar.tsx:71` | Has `title="Sair"` (tooltip only, no aria-label) |
| ArrowLeft back button | `ConvertidoDetalhe.tsx:98`, `NovoConvertido.tsx:98`, `GrupoDetalhe.tsx:144` | No title, no aria-label |
| Trash2 remove member | `GrupoDetalhe.tsx:226` | No title, no aria-label |
| Edit / Trash2 module | `Modulos.tsx:133`, `Modulos.tsx:140` | No title, no aria-label |

`title` tooltips are not announced by most screen reader + browser combinations unless the element has keyboard focus and the tooltip is activated. Replace with `aria-label`.

**WARNING — StatCard icons have no visual fallback for loading state**
- `DashboardLider.tsx:63-66`: KPI values render as `'—'` while loading, but the StatCard icon and color still render. This creates a partial skeleton — the card appears to have content before it does. The `DashboardDiscipulador.tsx` loading state (lines 173-177) is correct with `animate-pulse` skeletons; the `DashboardLider.tsx` page does not show a skeleton for its KPI grid — it renders the cards immediately with em-dash placeholders.

**WARNING — BottomNav has 5 items for Lider role (Início, Convertidos, Discipulado, Discipuladores, Módulos)**
- At 375px viewport width, 5 equal-flex items leave each nav tab only ~75px wide. Labels like "Discipuladores" and "Discipulado" will be very tight or overflow. No `truncate` or `overflow-hidden` is applied to the BottomNav labels (`BottomNav.tsx:32`). On real hardware this likely causes text clipping or wrapping under the icon.

**POSITIVE** — Visual hierarchy through consistent h1 (`text-2xl font-bold`) → section headers (`text-base font-semibold`) → body (`text-sm`) is maintained across all pages. Empty states consistently use a large muted icon + text center pattern. Cards use `shadow-sm` uniformly.

---

### Pillar 3: Color (3/4)

**WARNING — Hardcoded hex values in all three chart components**

Charts bypass the design token system entirely:

| File | Line | Value | Correct Tailwind token |
|------|------|-------|----------------------|
| `ConversoesMesChart.tsx` | 68 | `fill="#7c3aed"` | should be `primary-600` (CSS var) |
| `FaixaEtariaChart.tsx` | 23 | `['#818cf8','#7c3aed','#6d28d9','#5b21b6','#4c1d95','#3730a3']` | No token equivalent; at minimum document these as intentional |
| `GeneroChart.tsx` | 8-11 | `'#3b82f6','#ec4899','#f59e0b','#10b981'` | These map to `blue-500`, `pink-500`, `amber-500`, `green-500` |
| Chart tooltips | Multiple | `'#e5e7eb'`, `'#9ca3af'`, `'#6b7280'` | These are Tailwind gray tokens but used as raw hex |

If the primary color is ever changed in `tailwind.config`, charts will visually break while the rest of the UI updates. The convention for Recharts is to read CSS variable values at runtime or maintain a shared constants file.

**WARNING — Avatar color randomization introduces off-palette colors**
- `avatar.tsx:17-21`: Avatar background colors (`bg-blue-500`, `bg-purple-500`, `bg-green-500`, `bg-rose-500`, `bg-amber-500`, `bg-teal-500`, `bg-indigo-500`, `bg-pink-500`) are 8 distinct background colors assigned by name hash. While functional, this is 8 different hues in a UI that otherwise uses a purple primary system. This is a minor divergence from a coherent palette, not a blocker.

**POSITIVE** — Accent color (`primary-*`) usage (31 references) is concentrated on interactive elements: active nav links, focus rings, CTA buttons, and form outlines. No purely decorative element uses `primary-*`. The 60/30/10 principle is approximately respected: `gray-*` dominates surfaces (60%), `primary-*` accent on interactive elements (10%), semantic colors (green/red/amber) for status (30%).

---

### Pillar 4: Typography (3/4)

**Font sizes in use:** `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl` — 6 distinct sizes.

**Font weights in use:** `font-medium`, `font-semibold`, `font-bold` — 3 weights.

**WARNING — 6 font sizes exceeds the recommended 4-size ceiling**

`text-base` and `text-lg` appear rarely and create ambiguity:
- `text-base` appears only in `button.tsx:24` (large button size) and `avatar.tsx:13` (large avatar text)
- `text-lg` appears only in `dialog.tsx:31` (dialog title) and `ConvertidoDetalhe.tsx:109` (profile name inside a card)
- `text-xl` appears on page h2 titles (`ConvertidoDetalhe.tsx:109`, `GrupoDetalhe.tsx:155`)
- `text-2xl` is used for all main page h1 headings

The gap between `text-sm` (most body text) and `text-2xl` (headings) is large. Eliminating `text-lg` and using `text-xl` for the dialog title and profile name would reduce the scale to 5 sizes. Eliminating `text-base` from the large button and using `text-sm` (consistent with all other buttons) would bring it to 4.

**WARNING — `font-medium` and `font-semibold` coexist with overlapping use cases**
- Card titles use `font-semibold` (`card.tsx:22`)
- Group names in Discipulado card use `font-semibold` (`Discipulado.tsx:170`)
- Discipulador names use `font-semibold` (`Discipuladores.tsx:101`)
- But: member names in GrupoDetalhe use `font-medium` (`GrupoDetalhe.tsx:221`), convertido names in the list use `font-medium` (`Convertidos.tsx:137`), and form labels use `font-medium` (`input.tsx:16`)

There is no clear semantic distinction between when `font-medium` vs `font-semibold` is chosen for person names. A single weight (`font-semibold` for names/titles, `font-medium` for labels/metadata) should be documented and enforced.

**POSITIVE** — H1 page headings are consistently `text-2xl font-bold` across all pages. No italic, text-decoration, or letter-spacing variations introduce noise.

---

### Pillar 5: Spacing (3/4)

**Arbitrary values found:**
- `Convertidos.tsx:118,132`: `grid-cols-[1fr_140px_140px_120px]` — the fixed pixel widths `140px` and `120px` for Telefone, Conversão, and Status columns are arbitrary. These columns will misalign on viewport widths between 640px and 1000px where the grid is visible but constrained. Prefer fractional grid columns or use `min-content` / `max-content` constraints within the Tailwind scale.

**Spacing scale analysis — inconsistencies:**

| Pattern | Values used | Issue |
|---------|-------------|-------|
| Padding inside cards | `p-5` (main), `p-4` (group header in DashboardDisc), `p-3` (member rows), `p-2.5` (some rows) | 4 different inner padding values within card content areas — `p-4` vs `p-5` is inconsistent across equivalent card types |
| Vertical stack gaps | `space-y-4`, `space-y-5`, `space-y-6`, `space-y-3` | All four values in active use; no rule for which level of content nesting gets which gap |
| Item gaps | `gap-1`, `gap-2`, `gap-3`, `gap-4` | 4 gap sizes; `gap-1` is used for icon+label pairs (fine) but appears alongside `gap-2` for the same pattern in other components |

**WARNING — `p-12` for empty states**
- Empty state containers use `p-12` (`Convertidos.tsx:110`, `Discipulado.tsx:152`, `Discipuladores.tsx:87`). This is 48px padding all around on a centered empty state — generous but visually inconsistent with `p-8` used for the same pattern in `DashboardLider.tsx:95`. Standardize to one value.

**POSITIVE** — No `!important`, no negative margins, no `mt-[37px]`-style one-offs outside charts. The base scale (`gap-2/3/4`, `p-5`, `space-y-4/5`) is used for >85% of spacing decisions, which is solid for a codebase without a formal spec.

---

### Pillar 6: Experience Design (2/4)

**BLOCKER — Destructive mutations have no confirmation step**

| Action | File | Risk |
|--------|------|------|
| Remove member from group | `GrupoDetalhe.tsx:227` | Immediately calls `removeMembro.mutate(m.id)` with no confirm |
| Delete (deactivate) module | `Modulos.tsx:139` | Immediately calls `remove.mutate(m.id)` with no confirm |
| Toggle discipulador active/inactive | `Discipuladores.tsx:126` | One tap changes active status with a vague "Desativar" label and no undo |

The module "delete" is soft (sets `ativo: false`) but the user has no way to know that — the item disappears from the list with no undo/restore UI.

**BLOCKER — Mutation error handling absent in 4 critical flows**

Mutations with no `onError` handler:
- `createGrupo` (`Discipulado.tsx:88`) — dialog stays open, user sees nothing on failure
- `addMembro` (`GrupoDetalhe.tsx:86`) — same
- `toggleAula` (`GrupoDetalhe.tsx:111`) — toggle appears to do nothing on error
- `create` discipulador (`Discipuladores.tsx:46`) — dialog stays open silently
- `toggleAtivo` (`Discipuladores.tsx:63`) — silent failure

Only `onSubmit` in `NovoConvertido.tsx:86` and `FormularioPublico.tsx:84` have try/catch with `setServerError`. All other mutations are fire-and-forget on error.

**WARNING — DashboardLider has no loading skeleton for KPI grid**
- `DashboardLider.tsx:63-66`: KPI cards render immediately with `stats?.total ?? '—'`. While not a blank screen, the dash placeholder is visually jarring — a tall card with an icon but no number. `DashboardDiscipulador.tsx:172-177` correctly returns a pulse skeleton while loading; `DashboardLider.tsx` should do the same.

**WARNING — `<a href>` vs `<Link>` inconsistency causes full-page reload**
- `DashboardDiscipulador.tsx:289`: `<a href={'/discipulado/${grupo.id}'}` uses a native anchor tag instead of React Router's `<Link>`. This causes a full-page reload when the discipulador navigates to a group detail, bypassing client-side routing and losing React Query cache. All other internal navigation uses `<Link>` correctly.

**POSITIVE** — Loading skeletons are present in: `Convertidos.tsx:103-108`, `DashboardDiscipulador.tsx:172-177`, `Discipulado.tsx:145-149`, `Discipuladores.tsx:83-86`, `Modulos.tsx:99-101`, `ConvertidoDetalhe.tsx:80-85`, `GrupoDetalhe.tsx:132`. The pattern is consistent (`animate-pulse` rounded divs). Empty states are handled across all list views. The `Dialog` component uses Radix UI with proper focus trap and `backdrop-blur-sm` overlay.

---

## Additional Findings (Beyond Top 3)

4. **`<a href>` instead of `<Link>` in DashboardDiscipulador** — causes full-page reload (`DashboardDiscipulador.tsx:289`) — replace with `import { Link } from 'react-router-dom'` and `<Link to={\`/discipulado/${grupo.id}\`}>`.

5. **"Categoria" field mislabeled** — `NovoConvertido.tsx:154`, `FormularioPublico.tsx:143` — rename to "Gênero / Faixa etária" or split into separate fields.

6. **BottomNav label overflow risk** — 5 items at 375px width with labels like "Discipuladores" — add `text-[10px]` or truncate, or abbreviate to "Disc." for narrow viewports.

7. **Chart hex values bypass token system** — `ConversoesMesChart.tsx:68`, `FaixaEtariaChart.tsx:23` — extract to a shared `chartColors.ts` constants file and document the mapping to Tailwind palette.

8. **p-12 vs p-8 empty state inconsistency** — `DashboardLider.tsx:95` uses `p-8`; all other pages use `p-12`. Standardize to `p-10` or `p-12`.

---

## Files Audited

**Layout:**
- `src/components/layout/AppShell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/BottomNav.tsx`

**UI Primitives:**
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/progress.tsx`
- `src/components/ui/textarea.tsx`

**Pages:**
- `src/pages/Login.tsx`
- `src/pages/DashboardLider.tsx`
- `src/pages/DashboardDiscipulador.tsx`
- `src/pages/Convertidos.tsx`
- `src/pages/ConvertidoDetalhe.tsx`
- `src/pages/NovoConvertido.tsx`
- `src/pages/FormularioPublico.tsx`
- `src/pages/Discipulado.tsx`
- `src/pages/GrupoDetalhe.tsx`
- `src/pages/Discipuladores.tsx`
- `src/pages/Modulos.tsx`

**Charts:**
- `src/components/charts/ConversoesMesChart.tsx`
- `src/components/charts/GeneroChart.tsx`
- `src/components/charts/FaixaEtariaChart.tsx`
