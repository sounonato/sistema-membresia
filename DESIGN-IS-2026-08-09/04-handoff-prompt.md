```text
/make-plan Redesign the authenticated operational dashboard shell for `sistema-membresia`. Current design failed audit at 15/30 with critical gaps in principles #3, #5, #8, #9, and #10.

Verdict paragraph (quoted from 03-verdict.md):
> REDESIGN. The current dashboard shell should be rebuilt from a clearer operational layout because the audit totals 15/30 and the screen still reads as a heavy blue/navy card stack instead of a sharper working surface.

Why redesign and not refine: the load-bearing screen still depends on a dense card-stack/sidebar grammar, a one-note navy palette, and missing states; that is a structural change, not a polish pass.

Preserve from current design (MUST be non-empty):
- Brand tokens `--primary`, `--shell`, `--shell-foreground`, and the authenticated shell route boundaries in `frontend v4/src/styles.css:73-154` and `frontend v4/src/routes/_auth.tsx:1-87`.
- The protected operational route model and role gating in `frontend v4/src/routes/_auth.tsx:1-87`.
- The live data sources already powering the dashboard in `frontend v4/src/paginas/dashboard/page.tsx:66-232`.

Discard (MUST be non-empty):
- The dense card-stack dashboard grammar with KPI grid + chart rail + sidebar chrome. Evidence: `frontend v4/src/paginas/dashboard/page.tsx:126-232`. Caused failure on principle #5 and #10.
- The one-note navy-on-navy visual system as the dominant shell language. Evidence: `frontend v4/src/styles.css:73-154`. Caused failure on principle #3.
- The current sidebar section stack as the main organizing principle. Evidence: `frontend v4/src/components/layout/Sidebar.tsx:36-300`. Caused failure on principle #5.

Top 3–5 moves from the audit (verbatim):
1. Principle #5 / #10: remove the dense card-stack grammar from the dashboard body and replace it with a lighter priority layout. Evidence: `frontend v4/src/paginas/dashboard/page.tsx:126-232`.
2. Principle #3 / #7: replace the one-note navy system with a broader, calmer neutral palette and fewer competing borders. Evidence: `frontend v4/src/styles.css:73-154`.
3. Principle #8: add explicit empty, error, success, focus, and disabled states to the dashboard surface. Evidence: `frontend v4/src/paginas/dashboard/page.tsx:71-232`, `frontend v4/src/components/layout/AppShell.tsx:22-85`.
4. Principle #4: rename jargon and clarify action order in the sidebar and dashboard copy. Evidence: `frontend v4/src/components/layout/Sidebar.tsx:36-129`, `frontend v4/src/paginas/dashboard/page.tsx:188-229`.
5. Principle #9: trim bundle weight by separating charts from the default dashboard payload. Evidence: `npm run build` output and `frontend v4/src/paginas/dashboard/page.tsx:1-17`.

Redesign principles in priority order:
1. Good design is useful (#2) — the first screen must show the next action and the top risk in one glance.
2. Good design is understandable (#4) — the layout must explain itself without domain translation.
3. Good design is as little design as possible (#10) — every border, label, and panel must earn its place.

Deliverables for the plan:
- New information architecture for the authenticated shell and dashboard.
- New primary flow for daily operational use.
- States checklist (empty, loading, error, success, focus, disabled).
- Migration path for users currently on the old dashboard.
- Cutover criteria for retiring the old dashboard.
- Token decisions limited to one palette system and one typography scale.
- Performance budget for the new dashboard shell and charts.

Anti-patterns to guard against:
- Porting the old card-stack structure under new styling.
- Keeping the current one-note blue/navy palette.
- Shipping a redesign that still needs explanation to feel operational.
```
