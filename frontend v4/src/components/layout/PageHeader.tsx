import type { ReactNode } from "react";

type Props = {
  chapter: string;         // "03"
  eyebrow: string;         // "Administração"
  title: string;           // main serif title
  lede?: string;           // italic editorial subtitle
  actions?: ReactNode;     // right-aligned buttons
};

export function PageHeader({ chapter, eyebrow, title, lede, actions }: Props) {
  return (
    <header className="border-b border-stone-300/70 pb-6 mb-8">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-stone-500">
            <span className="font-serif text-2xl italic text-primary tabular-nums leading-none">
              {chapter}
            </span>
            <span className="h-px w-6 bg-stone-400" />
            {eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05] text-stone-900 tracking-tight">
            {title}
          </h1>
          {lede && (
            <p className="mt-3 font-[Instrument_Serif,serif] italic text-lg text-stone-600 leading-snug">
              {lede}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3">
      <span className="font-serif italic text-primary text-sm tabular-nums">{n}</span>
      <span className="h-px flex-1 bg-stone-300" />
      <span>{children}</span>
    </div>
  );
}