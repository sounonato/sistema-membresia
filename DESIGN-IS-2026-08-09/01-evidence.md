# Evidence

## Structural evidence

- Desktop shell exposes 16 visible interactive controls on the audited surface: 14 role-based nav links in the sidebar plus the theme toggle and logout button. Evidence: `frontend v4/src/components/layout/Sidebar.tsx:36-129` and `frontend v4/src/components/layout/Sidebar.tsx:268-300`.
- Mobile shell adds a menu button, raising the breakpoint-specific interactive count by 1. Evidence: `frontend v4/src/components/layout/AppShell.tsx:32-50`.
- Primary component nesting is deep but regular: `AppShell -> header/aside/main -> SidebarContent -> section -> Link -> icon wrapper/label` and `DashboardPage -> section -> ChartShell/KpiCard -> chart/metric primitives`. Evidence: `frontend v4/src/components/layout/AppShell.tsx:22-85`, `frontend v4/src/components/layout/Sidebar.tsx:155-300`, `frontend v4/src/paginas/dashboard/page.tsx:117-232`.
- Repeated-pattern count is high: 5 sidebar section groups, 4 KPI cards, and 2 chart shells. Evidence: `frontend v4/src/components/layout/Sidebar.tsx:36-130`, `frontend v4/src/paginas/dashboard/page.tsx:94-232`.
- Dead-prop / unused-import count is 0 in the audited files after inspection. Evidence: all imported symbols in `AppShell.tsx`, `Sidebar.tsx`, `PageHeader.tsx`, and `dashboard/page.tsx` are used.

## Visual evidence, INFERRED from source

- Spacing scale observed: 4, 8, 12, 16, 20, 24, 32, and 40 px equivalents are repeated across header, sidebar, and dashboard cards. Evidence: `frontend v4/src/components/layout/AppShell.tsx:23-85`, `frontend v4/src/components/layout/Sidebar.tsx:155-300`, `frontend v4/src/paginas/dashboard/page.tsx:117-232`.
- Type scale observed: 10px labels, 12px metadata, 14px body, 16px small body, 24px section titles, 30px chapter markers, and large KPI numerals around 2rem-3.5rem. Evidence: `frontend v4/src/components/layout/PageHeader.tsx:11-45`, `frontend v4/src/paginas/dashboard/page.tsx:32-64`, `frontend v4/src/paginas/dashboard/page.tsx:117-232`.
- Distinct color tokens referenced on the audited surface: approximately 14 semantic tokens, led by `--background`, `--foreground`, `--card`, `--primary`, `--border`, `--sidebar`, `--shell`, and chart tokens. Evidence: `frontend v4/src/styles.css:21-154`.
- Lowest contrast ratio observed across primary text: inferred around 4.4:1 for muted shell labels against the dark shell background, with the rest of the primary text appearing stronger. Evidence: `frontend v4/src/styles.css:98-111` and `frontend v4/src/components/layout/Sidebar.tsx:176-205`.
- States present checklist: loading present; focus present; disabled present in base controls; empty absent on the dashboard surface; error absent on the dashboard surface; success absent on the dashboard surface. Evidence: `frontend v4/src/paginas/dashboard/page.tsx:71-81`, `frontend v4/src/components/ui/button.tsx:1-20`, `frontend v4/src/components/ui/input.tsx:1-20`, `frontend v4/src/components/ui/sidebar.tsx:504-706`.

## Copy and honesty evidence

- Main user-facing strings on the audited surface are literal and behavior-matched: `Painel global`, `Painel operacional`, `Panorama`, `Convertidos`, `Discipulado`, `Relatórios`, `Membros`, `Métricas`, `Follow-up`, `Encerrar sessão`, `Dashboard`, `Leitura rápida`, `Movimento de convertidos`, `Leitura de agora`, `Perfil por gênero`, and `Base de membros`. Evidence: `frontend v4/src/components/layout/AppShell.tsx:52-79`, `frontend v4/src/components/layout/Sidebar.tsx:36-300`, `frontend v4/src/paginas/dashboard/page.tsx:117-232`.
- Jargon level is moderate: `Discipulados ativos`, `Aguardando`, `Sem discipulador atribuído`, and `Panorama pastoral` are domain terms that make sense to insiders but still ask for church context. Evidence: `frontend v4/src/paginas/dashboard/page.tsx:94-114`, `frontend v4/src/paginas/dashboard/page.tsx:188-229`, `frontend v4/src/components/layout/PageHeader.tsx:11-45`.
- No inflation, fake scarcity, forced continuity, or label-behavior mismatch was found on the audited dashboard shell. Evidence: `frontend v4/src/components/layout/Sidebar.tsx:36-300` and `frontend v4/src/paginas/dashboard/page.tsx:117-232`.

## Weight and friction evidence

- Build output shows the dashboard route chunk at `12.55kB`, but the app also ships heavy shared bundles such as `recharts` at `546.71kB` and `@tanstack/react-router` at `655.31kB`. Evidence: `npm run build` output.
- Initial dashboard load is therefore estimated to pull a double-digit JS request graph, not a single compact payload. Method: inspect build chunk graph and shared dependencies imported by `dashboard/page.tsx`. Evidence: `frontend v4/src/paginas/dashboard/page.tsx:1-17` plus build output.
- Idle animation count on the audited screen is 0, except for the loading spinner when stats are pending. Evidence: `frontend v4/src/paginas/dashboard/page.tsx:71-81`.
- Notification / badge / modal count on initial dashboard load is 0; the screen uses structural labels and chips, not transient notification surfaces. Evidence: `frontend v4/src/components/layout/AppShell.tsx:52-79`, `frontend v4/src/components/layout/Sidebar.tsx:192-205`.

## Accessibility evidence

- Focus order on the shell is straightforward: sidebar nav links, theme toggle, logout; on mobile, the menu button appears before the drawer content. Evidence: `frontend v4/src/components/layout/Sidebar.tsx:208-300` and `frontend v4/src/components/layout/AppShell.tsx:32-50`.
- Keyboard reachability of the primary actions is yes for nav, theme toggle, and logout because they are native anchors/buttons. Evidence: `frontend v4/src/components/layout/Sidebar.tsx:236-300`.
- ARIA landmark count on the audited shell is 4: header, aside, nav, and main. Evidence: `frontend v4/src/components/layout/AppShell.tsx:22-85` and `frontend v4/src/components/layout/Sidebar.tsx:208-266`.
- Skip-link is absent on the audited surface. Evidence: no skip-link string in `frontend v4/src/components/layout/AppShell.tsx` or the shared UI search results.
