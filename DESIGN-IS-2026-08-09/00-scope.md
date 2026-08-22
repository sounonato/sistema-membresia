# Scope

- Surface audited: authenticated operational dashboard shell and dashboard home in `frontend v4`, currently served at `http://localhost:8080/dashboard`.
- Primary user: admin / lider / pastor who needs to scan the state of the church quickly and move into members, convertidos, discipulado, reports, and admin tasks with low friction.
- Primary task: identify what needs attention now, then jump to the right operational area without reading a lot of chrome first.
- Constraints: keep the existing TanStack Start + Vite + Tailwind stack, preserve the authenticated route model, avoid backend contract changes, and maintain responsive behavior with dark mode support.
- Reference material: current source in `frontend v4/src/components/layout/AppShell.tsx`, `frontend v4/src/components/layout/Sidebar.tsx`, `frontend v4/src/components/layout/PageHeader.tsx`, `frontend v4/src/paginas/dashboard/page.tsx`, and `frontend v4/src/styles.css`.
- Notes: the audit is based on source inspection plus build output; the thread screenshot present in context shows a stale connection error on `5173`, so it was not treated as the target surface.
