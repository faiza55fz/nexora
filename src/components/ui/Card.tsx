// src/components/ui/Card.tsx
import React, { ReactNode, HTMLAttributes } from "react";

type Variant = "surface" | "surface-2" | "brand-soft";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: Variant;
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * Card component using semantic colour tokens.
 * Allows optional header/footer slots.
 */
export function Card({
  children,
  variant = "surface",
  header,
  footer,
  className = "",
  ...rest
}: CardProps) {
  const bgClass = {
    surface: "bg-surface",
    "surface-2": "bg-surface-2",
    "brand-soft": "bg-brand-soft",
  }[variant];

  return (
    <div
      className={`rounded-xl border border-line shadow-card ${bgClass} ${className}`}
      {...rest}
    >
      {header && <div className="px-4 pt-4">{header}</div>}
      <div className="p-4">{children}</div>
      {footer && <div className="px-4 pb-4">{footer}</div>}
    </div>
  );
}
