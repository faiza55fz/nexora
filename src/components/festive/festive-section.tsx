import Link from "next/link";
import type { ReactNode } from "react";
import type { FestivalTheme } from "./festival-themes";

type FestiveSectionProps = {
  theme: FestivalTheme;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  id?: string;
  children: ReactNode;
};

export function FestiveSection({
  theme,
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
  id,
  children,
}: FestiveSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 pt-6 sm:pt-8">
      <div className="mb-3 flex items-end justify-between gap-4 sm:mb-4">
        <div className="min-w-0">
          {eyebrow ? (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] sm:text-xs"
              style={{ color: theme.pageAccent }}
            >
              <span
                className="h-[3px] w-5 rounded-full"
                style={{ background: theme.pageAccent }}
              />
              {eyebrow}
            </span>
          ) : null}
          <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-ink sm:text-2xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>

        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink transition hover:border-brand hover:text-brand sm:text-sm"
          >
            {viewAllLabel} →
          </Link>
        ) : null}
      </div>

      {children}
    </section>
  );
}
