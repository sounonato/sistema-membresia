# Scorecard

1. Good design is innovative — Score: 1/3
   Evidence: The audited surface still uses the standard operational grammar of fixed sidebar + boxed dashboard + charts (`frontend v4/src/components/layout/AppShell.tsx:22-85`, `frontend v4/src/components/layout/Sidebar.tsx:36-300`, `frontend v4/src/paginas/dashboard/page.tsx:117-232`).
   Justification: It is a clean refresh of a familiar pattern, not a meaningfully new form.

2. Good design makes a product useful — Score: 2/3
   Evidence: The main tasks are reachable quickly from the shell and the dashboard exposes KPIs, charts, and direct navigation (`frontend v4/src/components/layout/Sidebar.tsx:36-300`, `frontend v4/src/paginas/dashboard/page.tsx:117-232`).
   Justification: The surface supports the job, but it still makes the user work through a lot of chrome before the priority signal lands.

3. Good design is aesthetic — Score: 1/3
   Evidence: The color system is dominated by one blue/navy family across background, shell, sidebar, primary, and chart tokens (`frontend v4/src/styles.css:73-154`).
   Justification: The system is consistent, but it reads heavy and monochromatic rather than visually balanced.

4. Good design makes a product understandable — Score: 2/3
   Evidence: The labels and hierarchy are readable, but several operational terms remain domain-heavy (`frontend v4/src/components/layout/PageHeader.tsx:11-45`, `frontend v4/src/paginas/dashboard/page.tsx:188-229`).
   Justification: A first-time user can infer the structure, yet some labels still require church context.

5. Good design is unobtrusive — Score: 1/3
   Evidence: The shell and dashboard both carry a lot of visible chrome: fixed sidebar, sticky header, section labels, framed cards, and chart containers (`frontend v4/src/components/layout/AppShell.tsx:22-85`, `frontend v4/src/components/layout/Sidebar.tsx:155-300`, `frontend v4/src/paginas/dashboard/page.tsx:117-232`).
   Justification: The UI is orderly, but the chrome still competes with the content instead of receding behind it.

6. Good design is honest — Score: 3/3
   Evidence: Labels map directly to behavior; there are no inflated claims, fake scarcity cues, or label-behavior mismatches in the audited shell (`frontend v4/src/components/layout/Sidebar.tsx:36-300`, `frontend v4/src/paginas/dashboard/page.tsx:117-232`).
   Justification: The interface says what it does and does what it says.

7. Good design is long-lasting — Score: 2/3
   Evidence: The typography and layout system are classic enough to survive, but the visual language still leans on current dashboard conventions and a dominant blue stack (`frontend v4/src/components/layout/PageHeader.tsx:11-45`, `frontend v4/src/styles.css:73-154`).
   Justification: It should age reasonably well, though it still carries a recognizable dashboard era flavor.

8. Good design is thorough down to the last detail — Score: 1/3
   Evidence: Loading is explicit, but empty/error/success states are not designed on the dashboard surface, and the screen leans on default structural states rather than a complete state model (`frontend v4/src/paginas/dashboard/page.tsx:71-232`).
   Justification: The happy path is covered, but several important states are missing or implicit.

9. Good design is environmentally friendly — Score: 1/3
   Evidence: The build graph still includes heavy shared bundles (`recharts` 546.71kB, `@tanstack/react-router` 655.31kB) even though the route chunk itself is small (`npm run build` output).
   Justification: The current shell is not grotesquely heavy, but it is not lean enough to earn a higher score.

10. Good design is as little design as possible — Score: 1/3
    Evidence: The screen is built from many bordered blocks, repeated labels, and duplicate chrome layers (`frontend v4/src/components/layout/AppShell.tsx:22-85`, `frontend v4/src/components/layout/Sidebar.tsx:155-300`, `frontend v4/src/paginas/dashboard/page.tsx:117-232`).
    Justification: Most elements have a reason, but the composition still contains too many removable parts.

Total: 15/30
