// src/components/ui/Badge.tsx
import React, { ReactNode } from "react";

type Variant = "brand" | "cta" | "success" | "warning" | "danger" | "muted";

export interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
}

/**
 * Small status badge. Background uses the "soft" token, text uses the main token.
 */
export function Badge({ children, variant = "muted" }: BadgeProps) {
  const styles: Record<Variant, string> = {
    brand: "bg-brand-soft text-brand",
    cta: "bg-cta hover:bg-cta-hover text-ink",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    muted: "bg-surface-2 text-muted",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
