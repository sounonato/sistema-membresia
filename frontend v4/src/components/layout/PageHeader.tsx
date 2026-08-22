import type { ReactNode } from "react";

type Props = {
  chapter: string; // "03"
  eyebrow: string; // "Administração"
  title: string; // main serif title
  lede?: string; // italic editorial subtitle
  actions?: ReactNode; // right-aligned buttons
};

export function PageHeader({ chapter, eyebrow, title, lede, actions }: Props) {
  return (
    <header className="mb-8 border border-border bg-card px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-4 xl:grid-cols-[10rem_minmax(0,1fr)] xl:items-end">
          <div className="border-b border-border pb-4 xl:border-b-0 xl:border-r xl:pr-5">
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              {eyebrow}
            </p>
            <p className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <span className="font-serif text-3xl italic leading-none text-primary tabular-nums">
                {chapter}
              </span>
              <span className="h-px flex-1 bg-border" />
              <span>Base operacional</span>
            </p>
          </div>

          <div className="min-w-0">
            <h1 className="font-serif text-[clamp(2rem,3vw,3.3rem)] leading-[1.02] tracking-tight text-foreground">
              {title}
            </h1>
            {lede && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {lede}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">{actions}</div>
        )}
      </div>
    </header>
  );
}

export function SectionLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
      <span className="font-serif italic text-primary text-sm tabular-nums">{n}</span>
      <span className="h-px flex-1 bg-border" />
      <span>{children}</span>
    </div>
  );
}
