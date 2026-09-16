import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "cta" | "ghost" | "outline" | "soft";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-2",
    cta: "bg-cta text-white hover:bg-cta-hover",
    ghost: "bg-transparent text-ink hover:bg-surface-2",
    outline: "border border-line bg-surface text-ink hover:bg-surface-2",
    soft: "bg-brand-soft text-brand hover:opacity-90",
  };
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-[15px]",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-[var(--shadow)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "cta" | "success" | "warning" | "danger" | "ai" | "muted";
}) {
  const map = {
    brand: "bg-brand-soft text-brand",
    cta: "bg-[#fde8dc] text-cta dark:bg-[#3a2418] dark:text-[#f3b38a]",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    ai: "bg-ai-soft text-ai",
    muted: "bg-surface-2 text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink placeholder:text-muted",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink",
        props.className,
      )}
    />
  );
}

export function Kpi({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {trend ? <span className="font-medium text-success">{trend}</span> : null}
        {hint ? <span className="text-muted">{hint}</span> : null}
      </div>
    </Card>
  );
}

export function AiHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-ai-soft px-3 py-2 text-sm text-ai">
      <span className="mt-0.5 font-semibold">AI</span>
      <p>{children}</p>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}
